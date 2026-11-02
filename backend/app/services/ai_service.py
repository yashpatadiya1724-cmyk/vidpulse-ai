"""
AI Service — fast heuristic engagement scoring.
Optical flow uses minimal settings for speed. No deep learning required.
"""
import numpy as np
try:
    import cv2
except ImportError:
    cv2 = None
from typing import List
try:
    from app.core.config import settings
except ImportError:
    settings = None


def compute_motion_magnitude(frame1: np.ndarray, frame2: np.ndarray) -> float:
    """Fast optical flow — small image, minimal iterations."""
    # Resize to tiny for speed
    small1 = cv2.resize(frame1, (160, 90))
    small2 = cv2.resize(frame2, (160, 90))
    gray1 = cv2.cvtColor(small1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(small2, cv2.COLOR_BGR2GRAY)
    flow = cv2.calcOpticalFlowFarneback(
        gray1, gray2, None,
        pyr_scale=0.5, levels=2, winsize=10,
        iterations=2, poly_n=5, poly_sigma=1.1, flags=0
    )
    magnitude, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
    return float(np.mean(magnitude))


def heuristic_engagement_score(frame: np.ndarray, motion: float) -> float:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    brightness_var = float(np.std(gray)) / 128.0
    score = 0.4 * min(brightness_var, 1.0) + 0.6 * min(motion / 5.0, 1.0)
    return float(np.clip(score, 0.0, 1.0))


def classify_severity(scores: np.ndarray) -> str:
    avg = float(np.mean(scores))
    if avg < 0.2:   return "critical"
    elif avg < 0.3: return "high"
    elif avg < 0.4: return "medium"
    return "low"


def detect_attention_drops(scores: List[float], threshold: float = 0.45,
                            min_duration: int = 3, smoothing_window: int = 5) -> List[dict]:
    arr = np.array(scores)
    kernel = np.ones(smoothing_window) / smoothing_window
    smoothed = np.convolve(arr, kernel, "same")

    drops, in_drop, start = [], False, 0
    for i, score in enumerate(smoothed):
        if score < threshold and not in_drop:
            in_drop, start = True, i
        elif score >= threshold and in_drop:
            in_drop = False
            if (i - start) >= min_duration:
                drops.append({"start_sec": start, "end_sec": i,
                               "severity": classify_severity(smoothed[start:i]),
                               "avg_score": float(np.mean(smoothed[start:i])),
                               "motion_level": None})
    if in_drop and (len(smoothed) - start) >= min_duration:
        drops.append({"start_sec": start, "end_sec": len(smoothed),
                       "severity": classify_severity(smoothed[start:]),
                       "avg_score": float(np.mean(smoothed[start:])),
                       "motion_level": None})
    return drops


def score_hook(scores: List[float], motions: List[float]) -> int:
    if not scores: return 0
    first_n = min(10, len(scores))
    motion_avg = float(np.mean(motions[:first_n])) if motions else 0.0
    score_avg = float(np.mean(scores[:first_n]))
    scene_changes = sum(1 for i in range(1, first_n) if abs(scores[i] - scores[i-1]) > 0.15)
    visual_novelty = float(np.std(scores[:first_n]))
    result = min(30, int(motion_avg * 8)) + min(25, scene_changes * 6) + min(20, int(visual_novelty * 40)) + min(25, int(score_avg * 25))
    return min(100, result)


def predict_virality(scores: List[float], hook_score: int, motions: List[float]) -> int:
    if not scores: return 0
    avg_score = float(np.mean(scores))
    pacing_var = float(np.std(motions)) if motions else 0.0
    high_pct = sum(1 for s in scores if s > 0.6) / max(len(scores), 1)
    opening = float(np.mean(scores[:max(1, len(scores)//10)]))
    closing = float(np.mean(scores[max(0, len(scores)*9//10):]))
    virality = avg_score*30 + (hook_score/100)*25 + high_pct*20 + min(pacing_var/2.0,1.0)*15 + opening*5 + closing*5
    return int(np.clip(virality, 0, 100))


RECOMMENDATION_RULES = [
    {"condition": lambda h, d, s: h < 35,
     "start": 0, "end": 5,
     "problem": "Weak hook in first 5 seconds",
     "suggestion": "Shorten intro to <5s. Open with action or a question.",
     "priority": "high", "category": "hook"},
    {"condition": lambda h, d, s: any(drop["avg_score"] < 0.3 for drop in d),
     "start_fn": lambda d: next((x["start_sec"] for x in d if x["avg_score"] < 0.3), 0),
     "end_fn":   lambda d: next((x["end_sec"]   for x in d if x["avg_score"] < 0.3), 5),
     "problem": "Critical attention drop detected",
     "suggestion": "Add a fast cut, animation or re-engagement hook at this segment.",
     "priority": "high", "category": "pacing"},
    {"condition": lambda h, d, s: len(d) > 2,
     "start": 0, "end": None,
     "problem": "Multiple attention drops throughout video",
     "suggestion": "Increase cut rate. Remove filler pauses. Add B-roll or text overlays.",
     "priority": "medium", "category": "pacing"},
    {"condition": lambda h, d, s: s < 0.5,
     "start": 0, "end": None,
     "problem": "Low overall engagement score",
     "suggestion": "Review pacing throughout. Add more visual variety and motion.",
     "priority": "medium", "category": "pacing"},
]


def generate_recommendations(hook_score: int, drops: List[dict], overall_score: float) -> List[dict]:
    recs = []
    for rule in RECOMMENDATION_RULES:
        try:
            if rule["condition"](hook_score, drops, overall_score):
                start = rule.get("start_fn", lambda d: rule.get("start", 0))(drops)
                end = rule.get("end_fn", lambda d: rule.get("end", None))(drops)
                recs.append({
                    "start_sec": float(start),
                    "end_sec": float(end) if end is not None else None,
                    "problem": rule["problem"],
                    "suggestion": rule["suggestion"],
                    "priority": rule["priority"],
                    "category": rule["category"],
                })
        except Exception:
            continue
    return recs


def analyze_frames(frames: List[np.ndarray], timestamps: List[float]) -> dict:
    """
    Fast pipeline:
    - Resize frames to 320px max before processing
    - Optical flow on 160x90 thumbnails
    - All numpy, no deep learning
    """
    scores, motions = [], []

    # Pre-resize all frames to 320px max for speed
    resized = []
    for f in frames:
        h, w = f.shape[:2]
        if max(h, w) > 320:
            scale = 320 / max(h, w)
            f = cv2.resize(f, (int(w*scale), int(h*scale)))
        resized.append(f)

    for i, frame in enumerate(resized):
        motion = compute_motion_magnitude(resized[i-1], frame) if i > 0 else 0.0
        motions.append(motion)
        scores.append(heuristic_engagement_score(frame, motion))

    timeline = [
        {"second": int(ts), "score": round(s, 4), "motion": round(m, 4), "scene_change": False}
        for s, m, ts in zip(scores, motions, timestamps)
    ]

    threshold = getattr(settings, 'ATTENTION_THRESHOLD', 0.45) if settings else 0.45
    drops = detect_attention_drops(scores, threshold=threshold)
    hook = score_hook(scores, motions)
    overall = float(np.mean(scores)) if scores else 0.0
    virality = predict_virality(scores, hook, motions)
    recs = generate_recommendations(hook, drops, overall)

    return {
        "timeline": timeline,
        "drops": drops,
        "hook_score": hook,
        "overall_score": round(overall, 4),
        "virality_score": virality,
        "recommendations": recs,
    }
