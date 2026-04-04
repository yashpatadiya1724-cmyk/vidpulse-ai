"""
YouTube video downloader using yt-dlp.
Downloads the best available video (max 720p) to a temp file.
"""
import tempfile
import os
import re
import asyncio
from typing import Tuple


def _is_youtube_url(url: str) -> bool:
    patterns = [
        r"(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)[\w-]+",
    ]
    return any(re.match(p, url) for p in patterns)


def _extract_video_id(url: str) -> str:
    patterns = [
        r"youtube\.com/watch\?v=([\w-]+)",
        r"youtu\.be/([\w-]+)",
        r"youtube\.com/shorts/([\w-]+)",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return "unknown"


def _download_sync(url: str, output_path: str) -> dict:
    """Runs in a thread — yt-dlp is synchronous."""
    import yt_dlp

    ydl_opts = {
        "format": "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]/best",
        "outtmpl": output_path,
        "quiet": True,
        "no_warnings": True,
        "merge_output_format": "mp4",
        "noplaylist": True,
        "socket_timeout": 30,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return {
            "title": info.get("title", "YouTube Video"),
            "duration": info.get("duration", 0),
            "uploader": info.get("uploader", ""),
            "view_count": info.get("view_count", 0),
            "thumbnail": info.get("thumbnail", ""),
        }


async def download_youtube(url: str) -> Tuple[str, dict]:
    """
    Downloads a YouTube video to a temp file.
    Returns (temp_file_path, video_info).
    Caller is responsible for deleting the temp file.
    """
    if not _is_youtube_url(url):
        raise ValueError("Not a valid YouTube URL")

    # yt-dlp adds extension automatically — use a base path
    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    tmp_path = tmp.name
    tmp.close()
    os.unlink(tmp_path)  # yt-dlp will create it

    # Run blocking download in thread pool
    loop = asyncio.get_event_loop()
    info = await loop.run_in_executor(None, _download_sync, url, tmp_path)

    # yt-dlp may add .mp4 extension
    if not os.path.exists(tmp_path):
        if os.path.exists(tmp_path + ".mp4"):
            tmp_path = tmp_path + ".mp4"
        else:
            raise FileNotFoundError("Download failed — output file not found")

    return tmp_path, info
