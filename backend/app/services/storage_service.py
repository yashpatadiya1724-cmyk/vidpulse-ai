"""
Storage service — local filesystem for dev, persists to /tmp on Railway.
For production with large files, configure S3/Cloudflare R2.
"""
import os
import aiofiles
from app.core.config import settings

# Railway has ephemeral filesystem — use /tmp which persists during container lifetime
LOCAL_STORAGE_DIR = os.environ.get("STORAGE_PATH", "/tmp/vidpulse_uploads")
os.makedirs(LOCAL_STORAGE_DIR, exist_ok=True)


class StorageService:
    def __init__(self):
        self._use_local = True
        self._s3 = None

        # Try S3 only if real credentials configured
        if settings.AWS_ACCESS_KEY_ID not in ("minioadmin", "", "your-access-key"):
            try:
                import boto3
                kwargs = dict(
                    region_name=settings.AWS_REGION,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                )
                if settings.S3_ENDPOINT_URL:
                    kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
                self._s3 = boto3.client("s3", **kwargs)
                self._use_local = False
                print("[STORAGE] Using S3")
            except Exception as e:
                print(f"[STORAGE] S3 failed: {e}, using local")

        if self._use_local:
            print(f"[STORAGE] Using local: {LOCAL_STORAGE_DIR}")

    def _local_path(self, key: str) -> str:
        safe = key.replace("/", "_").replace(" ", "_")
        return os.path.join(LOCAL_STORAGE_DIR, safe)

    async def upload_bytes(self, data: bytes, key: str, content_type: str = "video/mp4"):
        if self._use_local:
            path = self._local_path(key)
            async with aiofiles.open(path, "wb") as f:
                await f.write(data)
        else:
            import asyncio
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: self._s3.put_object(
                Bucket=settings.S3_BUCKET_NAME, Key=key, Body=data, ContentType=content_type,
            ))

    async def download_to_file(self, key: str, local_path: str):
        if self._use_local:
            src = self._local_path(key)
            if not os.path.exists(src):
                raise FileNotFoundError(f"File not found: {src}")
            async with aiofiles.open(src, "rb") as f:
                data = await f.read()
            async with aiofiles.open(local_path, "wb") as f:
                await f.write(data)
        else:
            import asyncio
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: self._s3.download_file(
                settings.S3_BUCKET_NAME, key, local_path
            ))

    async def delete(self, key: str):
        if self._use_local:
            path = self._local_path(key)
            if os.path.exists(path):
                os.unlink(path)
        else:
            import asyncio
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, lambda: self._s3.delete_object(
                Bucket=settings.S3_BUCKET_NAME, Key=key
            ))


storage_service = StorageService()
