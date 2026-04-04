import uuid, os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.video import Video
from app.schemas import VideoResponse
from app.services.storage_service import storage_service
from app.workers.celery_tasks import process_video_background

router = APIRouter(tags=["videos"])

ALLOWED_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}
MAX_SIZE = 500 * 1024 * 1024  # 500MB


class YouTubeRequest(BaseModel):
    url: str
    title: str = ""


@router.post("/upload", response_model=VideoResponse)
async def upload_video(
    file: UploadFile = File(...),
    title: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Unsupported format. Use MP4, MOV, AVI, or WebM.")
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(413, "File too large (max 500MB)")

    s3_key = f"videos/{current_user.id}/{uuid.uuid4()}/{file.filename}"
    await storage_service.upload_bytes(contents, s3_key, file.content_type)

    video = Video(
        user_id=current_user.id, title=title, s3_key=s3_key,
        file_size_bytes=len(contents), mime_type=file.content_type, status="uploaded",
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)
    process_video_background(video.id, s3_key, current_user.id)
    return video


@router.post("/analyze-youtube", response_model=VideoResponse)
async def analyze_youtube(
    body: YouTubeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.youtube_service import download_youtube
    try:
        tmp_path, info = await download_youtube(body.url)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(422, f"Could not download video: {str(e)}")

    video_title = body.title.strip() or info["title"]
    s3_key = f"videos/{current_user.id}/{uuid.uuid4()}/yt.mp4"
    try:
        with open(tmp_path, "rb") as f:
            contents = f.read()
        await storage_service.upload_bytes(contents, s3_key, "video/mp4")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    video = Video(
        user_id=current_user.id, title=video_title, s3_key=s3_key,
        file_size_bytes=len(contents), mime_type="video/mp4", status="uploaded",
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)
    process_video_background(video.id, s3_key, current_user.id)
    return video


@router.get("/{video_id}/thumbnail")
async def get_thumbnail(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Extract a JPEG thumbnail from the video's first frame."""
    import cv2, tempfile, numpy as np
    result = await db.execute(select(Video).where(Video.id == video_id, Video.user_id == current_user.id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Video not found")

    try:
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp_path = tmp.name
        await storage_service.download_to_file(video.s3_key, tmp_path)

        cap = cv2.VideoCapture(tmp_path)
        # Seek to 10% of video for a better thumbnail
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, total // 10))
        ret, frame = cap.read()
        cap.release()
        os.unlink(tmp_path)

        if not ret:
            raise HTTPException(404, "Could not extract thumbnail")

        # Resize to 320x180
        frame = cv2.resize(frame, (320, 180))
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return Response(content=buf.tobytes(), media_type="image/jpeg")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Thumbnail error: {e}")


@router.get("/", response_model=list[VideoResponse])
async def list_videos(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Video).where(Video.user_id == current_user.id).order_by(Video.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Video).where(Video.id == video_id, Video.user_id == current_user.id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Video not found")
    return video


@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Video).where(Video.id == video_id, Video.user_id == current_user.id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Video not found")
    await storage_service.delete(video.s3_key)
    await db.delete(video)
    await db.commit()
    return {"message": "Deleted"}
