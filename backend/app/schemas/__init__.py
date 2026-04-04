from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# Video
class VideoResponse(BaseModel):
    id: str
    title: str
    status: str
    duration_sec: Optional[float]
    overall_score: Optional[float]
    hook_score: Optional[int]
    virality_score: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# Analysis
class AttentionPoint(BaseModel):
    second: int
    score: float
    label: str


class DropSegment(BaseModel):
    start_sec: float
    end_sec: float
    severity: str
    avg_score: float
    motion_level: Optional[float] = None


class RecommendationItem(BaseModel):
    timestamp: str
    problem: str
    suggestion: str
    priority: str
    category: Optional[str] = None


class AnalysisResponse(BaseModel):
    video_id: str
    status: str
    duration_seconds: Optional[float]
    overall_score: Optional[float]
    hook_score: Optional[int]
    virality_score: Optional[int]
    attention_timeline: List[AttentionPoint] = []
    drops: List[DropSegment] = []
    recommendations: List[RecommendationItem] = []
