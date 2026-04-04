"use client";
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { AttentionPoint, DropSegment } from "@/types";

interface Props {
  scores: AttentionPoint[];
  drops: DropSegment[];
  currentTime?: number;
  onSeek?: (t: number) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const score = payload[0]?.value as number;
  const color = score > 0.6 ? "#10b981" : score < 0.45 ? "#ef4444" : "#f59e0b";
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}s</p>
      <p className="font-semibold" style={{ color }}>{(score * 100).toFixed(0)}% attention</p>
    </div>
  );
};

export function AttentionTimeline({ scores, drops, currentTime, onSeek }: Props) {
  const data = scores.map(s => ({ second: s.second, score: s.score, threshold: 0.45 }));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">Attention Timeline</p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-sky-500 rounded inline-block" />Engaged</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-red-500 rounded inline-block" />Drop</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} onClick={e => e?.activeLabel && onSeek?.(Number(e.activeLabel))}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis dataKey="second" stroke="#374151" tick={{ fontSize: 10, fill: "#6b7280" }}
            tickFormatter={v => `${v}s`} />
          <YAxis domain={[0, 1]} stroke="#374151" tick={{ fontSize: 10, fill: "#6b7280" }}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`} width={36} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#374151", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="score" stroke="#0ea5e9" fill="url(#scoreGrad)"
            strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#0ea5e9" }} />
          <ReferenceLine y={0.45} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
          {drops.map((d, i) => (
            <ReferenceLine key={i} x={d.start_sec} stroke="#ef4444" strokeOpacity={0.4} strokeWidth={1} />
          ))}
          {currentTime !== undefined && (
            <ReferenceLine x={currentTime} stroke="#f59e0b" strokeWidth={2} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
