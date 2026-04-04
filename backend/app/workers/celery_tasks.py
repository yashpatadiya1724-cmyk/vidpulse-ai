"""
Video processing pipeline — background thread with its own event loop.
"""
import asyncio
import tempfile
import os
import threading
import traceback


async def _run_pipeline(video_id: str, s3_key: str, user_id: str):
    from app.core.database import AsyncSessionLocal, init_db
    from app.models.video import Video, AttentionDrop, Recommendation
    from app.services.storage_service import StorageService
    from app.services.video_processor import VideoProcessor
    from app.services.ai_service import analyze_frames
    from sqlalchemy import select, delete
    import json

    print(f"[PIPELINE] Starting for video {video_id}")
    await init_db()

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Video).where(Video.id == video_id))
        video = result.scalar_one_or_none()
        if not video:
            print(f"[PIPELINE] Video {video_id} not found in DB")
            return

        video.status = "processing"
        await db.commit()
        print(f"[PIPELINE] Status set to processing")

        tmp_path = None
        try:
            # Download video
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                tmp_path = tmp.name
            print(f"[PIPELINE] Downloading from storage...")
            storage = StorageService()
            await storage.download_to_file(s3_key, tmp_path)
            file_size = os.path.getsize(tmp_path)
            print(f"[PIPELINE] Downloaded {file_size} bytes to {tmp_path}")

            if file_size == 0:
                raise ValueError("Downloaded file is empty")

            # Extract frames
            print(f"[PIPELINE] Extracting frames...")
            processor = VideoProcessor()
            extracted = processor.extract_frames(tmp_path)
            frames = extracted["frames"]
            timestamps = extracted["timestamps"]
            print(f"[PIPELINE] Extracted {len(frames)} frames, duration={extracted['duration']:.1f}s")

            if not frames:
                raise ValueError("No frames could be extracted from video")

            # Run AI analysis
            print(f"[PIPELINE] Running AI analysis on {len(frames)} frames...")
            analysis = analyze_frames(frames, timestamps)
            print(f"[PIPELINE] Analysis done. Score={analysis['overall_score']}, Hook={analysis['hook_score']}, Drops={len(analysis['drops'])}")

            # Clear old results
            await db.execute(delete(AttentionDrop).where(AttentionDrop.video_id == video_id))
            await db.execute(delete(Recommendation).where(Recommendation.video_id == video_id))

            # Save drops
            for drop in analysis["drops"]:
                db.add(AttentionDrop(
                    video_id=video_id,
                    start_sec=drop["start_sec"],
                    end_sec=drop["end_sec"],
                    severity=drop["severity"],
                    avg_score=drop["avg_score"],
                    motion_lvl=drop.get("motion_level"),
                ))

            # Save recommendations
            for rec in analysis["recommendations"]:
                db.add(Recommendation(
                    video_id=video_id,
                    start_sec=rec["start_sec"],
                    end_sec=rec.get("end_sec"),
                    problem=rec["problem"],
                    suggestion=rec["suggestion"],
                    priority=rec["priority"],
                    category=rec.get("category"),
                ))

            # Update video record
            video.status = "complete"
            video.duration_sec = extracted["duration"]
            video.resolution = extracted.get("resolution")
            video.overall_score = analysis["overall_score"]
            video.hook_score = analysis["hook_score"]
            video.virality_score = analysis["virality_score"]
            video.timeline_json = json.dumps(analysis["timeline"])
            await db.commit()
            print(f"[PIPELINE] ✅ Complete for video {video_id}")

        except Exception as e:
            print(f"[PIPELINE] ❌ Error for video {video_id}: {e}")
            traceback.print_exc()
            try:
                video.status = "error"
                await db.commit()
            except Exception as commit_err:
                print(f"[PIPELINE] Failed to save error status: {commit_err}")
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)


def _thread_runner(video_id: str, s3_key: str, user_id: str):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(_run_pipeline(video_id, s3_key, user_id))
    except Exception as e:
        print(f"[THREAD] Unhandled error: {e}")
        traceback.print_exc()
    finally:
        loop.close()


def process_video_background(video_id: str, s3_key: str, user_id: str):
    t = threading.Thread(
        target=_thread_runner,
        args=(video_id, s3_key, user_id),
        daemon=True,
        name=f"pipeline-{video_id[:8]}",
    )
    t.start()
    print(f"[PIPELINE] Thread started: {t.name}")
