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


video_processor = VideoProcessor()
