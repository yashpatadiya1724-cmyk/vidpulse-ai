# VidPulse AI

AI-powered video engagement analytics. Upload a video, get frame-by-frame attention scores, heatmaps, hook/virality scores, and editing suggestions.

## Quick Start (Docker)

```bash
cd vidpulse-ai
cp .env.example .env
docker-compose up --build
```

Open http://localhost:3000

## Manual Dev Setup

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Celery Worker** (separate terminal)
```bash
cd backend
celery -A app.workers.celery_tasks worker --loglevel=info
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Supporting services** (Docker)
```bash
docker run -d -p 5432:5432 -e POSTGRES_DB=vidpulse -e POSTGRES_USER=vidpulse -e POSTGRES_PASSWORD=secret postgres:15
docker run -d -p 27017:27017 mongo:7
docker run -d -p 6379:6379 redis:7-alpine
```

## Stack

- Frontend: Next.js 14 + Tailwind + Recharts + D3 + Framer Motion
- Backend: FastAPI + SQLAlchemy + Motor (MongoDB)
- AI: OpenCV optical flow + heuristic engagement scoring (drop-in PyTorch EfficientNet/LSTM)
- Queue: Celery + Redis
- Storage: S3 / MinIO
- DB: PostgreSQL + MongoDB

## API Docs

http://localhost:8000/api/docs
