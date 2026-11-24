import cv2
import os
import numpy as np
from app.core.config import settings


class VideoProcessor:
    def __init__(self, fps: int = 1, max_dimension: int = 320):
        self.fps = fps
        self.max_dimension = max_dimension

    def extract_frames(self, video_path: str) -> dict:
        if not os.path.exists(video_path):
            raise ValueError(f"Video file not found: {video_path}")

        file_size = os.path.getsize(video_path)
        if file_size == 0:
            raise ValueError("Video file is empty")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"OpenCV cannot open video: {video_path} (size={file_size})")

        original_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / original_fps if original_fps > 0 else 0
        width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Cap at 10 minutes
        max_duration = 600
        effective_duration = min(duration, max_duration)
        max_frames = int(effective_duration * self.fps) + 1

        frame_interval = max(1, int(original_fps / self.fps))
        frames, timestamps = [], []
        frame_count = 0

        while cap.isOpened() and len(frames) < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_count % frame_interval == 0:
                frames.append(self._resize(frame))
                timestamps.append(round(frame_count / original_fps, 3))
            frame_count += 1

        cap.release()

        if not frames:
            raise ValueError("No frames could be read from video file")

        return {
            "frames": frames,
            "timestamps": timestamps,
            "duration": effective_duration,
            "original_fps": original_fps,
            "resolution": f"{width}x{height}",
        }

    def _resize(self, frame: np.ndarray) -> np.ndarray:
        h, w = frame.shape[:2]
        if max(h, w) <= self.max_dimension:
            return frame
        scale = self.max_dimension / max(h, w)
        return cv2.resize(frame, (int(w * scale), int(h * scale)))

    def compute_thumbnail_metrics(self, frame: np.ndarray) -> dict:
        """Computes aesthetic and attention metrics for candidate video thumbnails."""
        if frame is None or frame.size == 0:
            return {
                "brightness": 0.0,
                "contrast": 0.0,
                "sharpness": 0.0,
                "colorfulness": 0.0,
                "thumbnail_score": 0.0,
                "is_recommended": False,
            }

        # 1. Grayscale luminance & contrast
        if len(frame.shape) == 3 and frame.shape[2] == 3:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # Hasler and Süsstrunk colorfulness metric
            (B, G, R) = cv2.split(frame.astype("float"))
            rg = np.abs(R - G)
            yb = np.abs(0.5 * (R + G) - B)
            std_root = np.sqrt(np.std(rg) ** 2 + np.std(yb) ** 2)
            mean_root = np.sqrt(np.mean(rg) ** 2 + np.mean(yb) ** 2)
            colorfulness = float(std_root + (0.3 * mean_root))
        else:
            gray = frame
            colorfulness = 0.0

        brightness = float(np.mean(gray)) / 255.0
        contrast = float(np.std(gray)) / 128.0

        # Sharpness via Laplacian variance
        sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        # Normalize metrics to heuristic 0-100 score
        b_score = max(0.0, 1.0 - abs(brightness - 0.55) * 2) * 25.0
        c_score = min(25.0, contrast * 25.0)
        s_score = min(25.0, (sharpness / 150.0) * 25.0)
        col_score = min(25.0, (colorfulness / 40.0) * 25.0)

        total_score = round(b_score + c_score + s_score + col_score, 1)

        return {
            "brightness": round(brightness, 3),
            "contrast": round(contrast, 3),
            "sharpness": round(sharpness, 2),
            "colorfulness": round(colorfulness, 2),
            "thumbnail_score": total_score,
            "is_recommended": total_score >= 60.0,
        }


video_processor = VideoProcessor()
