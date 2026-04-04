"use client";
import { useEffect, useState } from "react";

type AnalysisStatus = "queued" | "processing" | "complete" | "error";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export function useAnalysisWebSocket(videoId: string | null) {
  const [status, setStatus] = useState<AnalysisStatus>("queued");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!videoId) return;
    const ws = new WebSocket(`${WS_URL}/analysis/${videoId}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "progress") setProgress(data.percent ?? 0);
        if (data.type === "complete") { setStatus("complete"); ws.close(); }
        if (data.type === "error") { setStatus("error"); ws.close(); }
        if (data.status === "complete") setStatus("complete");
        if (data.status === "error") setStatus("error");
      } catch {}
    };

    ws.onerror = () => setStatus("error");

    return () => ws.close();
  }, [videoId]);

  return { status, progress };
}
