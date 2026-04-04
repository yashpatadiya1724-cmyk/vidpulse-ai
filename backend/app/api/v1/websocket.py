from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import asyncio

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, video_id: str, ws: WebSocket):
        await ws.accept()
        self.connections.setdefault(video_id, []).append(ws)

    def disconnect(self, video_id: str, ws: WebSocket):
        if video_id in self.connections:
            self.connections[video_id].remove(ws)

    async def broadcast(self, video_id: str, data: dict):
        for ws in self.connections.get(video_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                pass


ws_manager = ConnectionManager()


@router.websocket("/analysis/{video_id}")
async def analysis_ws(video_id: str, websocket: WebSocket):
    await ws_manager.connect(video_id, websocket)
    try:
        while True:
            await asyncio.sleep(30)  # keep-alive ping
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        ws_manager.disconnect(video_id, websocket)
