from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    NODE_ENV: str = "production"

    # Database — Railway provides DATABASE_URL automatically for PostgreSQL
    # Falls back to SQLite for local dev
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./vidpulse.db"
    )

    SECRET_KEY: str = "changeme32charslongsecretkeyhere"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days

    # Storage — use local filesystem by default, S3 if configured
    S3_BUCKET_NAME: str = "vidpulse-videos"
    AWS_ACCESS_KEY_ID: str = "minioadmin"
    AWS_SECRET_ACCESS_KEY: str = "minioadmin"
    AWS_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: Optional[str] = None

    # AI
    DEVICE: str = "cpu"
    BATCH_SIZE: int = 8
    FRAMES_PER_SECOND: int = 1
    ATTENTION_THRESHOLD: float = 0.45

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Fix Render/Railway PostgreSQL URL for asyncpg
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif settings.DATABASE_URL.startswith("postgresql://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
