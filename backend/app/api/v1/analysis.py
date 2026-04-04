import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.video import Video, AttentionDrop, Recommendation
from app.schemas import AnalysisResponse, AttentionPoint, DropSegment, RecommendationItem
from app.workers.celery_tasks import process_video_background

router = APIRouter(tags=["analysis"])


async def _get_video_or_404(video_id: str, user: User, db: AsyncSession) -> Video:
    result = await db.execute(select(Video).where(Video.id == video_id, Video.user_id == user.id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Video not found")
    return video


@router.get("/{video_id}", response_model=AnalysisResponse)
async def get_analysis(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    video = await _get_video_or_404(video_id, current_user, db)

    timeline = []
    if video.timeline_json:
        try:
            raw = json.loads(video.timeline_json)
            for entry in raw:
                score = entry["score"]
                label = "High attention" if score > 0.6 else ("Attention drop" if score < 0.45 else "Stable engagement")
                timeline.append(AttentionPoint(second=entry["second"], score=score, label=label))
        except Exception:
            pass

    drops_result = await db.execute(select(AttentionDrop).where(AttentionDrop.video_id == video_id))
    drops = [
        DropSegment(
            start_sec=d.start_sec, end_sec=d.end_sec,
            severity=d.severity, avg_score=d.avg_score or 0.0,
            motion_level=d.motion_lvl,
        )
        for d in drops_result.scalars().all()
    ]

    recs_result = await db.execute(select(Recommendation).where(Recommendation.video_id == video_id))
    recs = [
        RecommendationItem(
            timestamp=f"{int(r.start_sec//60)}:{int(r.start_sec%60):02d}–{int((r.end_sec or r.start_sec+5)//60)}:{int((r.end_sec or r.start_sec+5)%60):02d}",
            problem=r.problem, suggestion=r.suggestion,
            priority=r.priority, category=r.category,
        )
        for r in recs_result.scalars().all()
    ]

    return AnalysisResponse(
        video_id=video_id, status=video.status,
        duration_seconds=video.duration_sec,
        overall_score=video.overall_score,
        hook_score=video.hook_score,
        virality_score=video.virality_score,
        attention_timeline=timeline, drops=drops, recommendations=recs,
    )


@router.get("/{video_id}/clip-suggestions")
async def get_clip_suggestions(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return best clip windows (high engagement segments) for short-form content."""
    video = await _get_video_or_404(video_id, current_user, db)
    if not video.timeline_json:
        return []

    import numpy as np
    timeline = json.loads(video.timeline_json)
    if not timeline:
        return []

    scores = [t["score"] for t in timeline]
    duration = video.duration_sec or len(scores)

    # Find windows of 15s, 30s, 60s with highest avg engagement
    clips = []
    for window in [15, 30, 60]:
        if window >= duration:
            continue
        best_score, best_start = 0.0, 0
        for i in range(len(scores) - window):
            avg = float(np.mean(scores[i:i+window]))
            if avg > best_score:
                best_score, best_start = avg, i
        if best_score > 0:
            clips.append({
                "duration_sec": window,
                "start_sec": best_start,
                "end_sec": best_start + window,
                "avg_score": round(best_score, 3),
                "label": f"Best {window}s clip",
                "start_fmt": f"{best_start//60}:{best_start%60:02d}",
                "end_fmt": f"{(best_start+window)//60}:{(best_start+window)%60:02d}",
            })

    return sorted(clips, key=lambda x: x["avg_score"], reverse=True)


@router.get("/{video_id}/scores")
async def get_scores(video_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    video = await _get_video_or_404(video_id, current_user, db)
    if not video.timeline_json:
        return []
    try:
        return json.loads(video.timeline_json)
    except Exception:
        return []


@router.get("/{video_id}/drops")
async def get_drops(video_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_video_or_404(video_id, current_user, db)
    result = await db.execute(select(AttentionDrop).where(AttentionDrop.video_id == video_id))
    return result.scalars().all()


@router.get("/{video_id}/hook")
async def get_hook(video_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    video = await _get_video_or_404(video_id, current_user, db)
    return {"hook_score": video.hook_score}


@router.get("/{video_id}/virality")
async def get_virality(video_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    video = await _get_video_or_404(video_id, current_user, db)
    return {"virality_score": video.virality_score}


@router.get("/{video_id}/recommendations")
async def get_recommendations(video_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _get_video_or_404(video_id, current_user, db)
    result = await db.execute(select(Recommendation).where(Recommendation.video_id == video_id))
    return result.scalars().all()


@router.post("/{video_id}/reanalyze")
async def reanalyze(video_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    video = await _get_video_or_404(video_id, current_user, db)
    video.status = "uploaded"
    video.timeline_json = None
    await db.commit()
    process_video_background(video.id, video.s3_key, current_user.id)
    return {"message": "Re-analysis started"}
