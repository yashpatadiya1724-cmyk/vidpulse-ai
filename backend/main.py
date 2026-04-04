from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.api.v1 import auth, videos, analysis, websocket
from app.core.database import init_db

app = FastAPI(
    title="VidPulse AI API",
    description="AI Video Engagement Analytics",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # allows bypass-tunnel-reminder header
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.on_event("startup")
async def startup():
    await init_db()


app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(videos.router, prefix="/api/v1/videos")
app.include_router(analysis.router, prefix="/api/v1/analysis")
app.include_router(websocket.router, prefix="/ws")


@app.get("/health")
async def health():
    return {"status": "ok"}
