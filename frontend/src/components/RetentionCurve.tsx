"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart } from "recharts";
import { AttentionPoint } from "@/types";
import { TrendingDown } from "lucide-react";

interface Props { scores: AttentionPoint[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value as number;
  const color = v > 0.6 ? "#10b981" : v < 0.45 ? "#ef4444" : "#f59e0b";
  return (
    <div className="bg-[#161622] border border-[#1e1e2e] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}s</p>
      <p className="font-bold" style={{ color }}>{(v * 100).toFixed(0)}% retention</p>
    </div>
  );
};

export function RetentionCurve({ scores }: Props) {
  if (!scores.length) return null;

  const data = scores.map(s => ({ second: s.second, retention: s.score, threshold: 0.45 }));
  const avgRetention = Math.round(scores.reduce((s, p) => s + p.score, 0) / scores.length * 100);
  const dropPoints = scores.filter(s => s.score < 0.45).length;
  const dropPct = Math.round(dropPoints / scores.length * 100);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-white">Retention Curve</p>
          <p className="text-xs text-gray-500 mt-0.5">How attention changes over time</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">Avg <span className="text-sky-400 font-bold">{avgRetention}%</span></span>
          {dropPct > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <TrendingDown size={11} /> {dropPct}% below threshold
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis dataKey="second" stroke="#374151" tick={{ fontSize: 10, fill: "#6b7280" }}
            tickFormatter={v => `${v}s`} />
          <YAxis domain={[0, 1]} stroke="#374151" tick={{ fontSize: 10, fill: "#6b7280" }}
            tickFormatter={v => `${(v*100).toFixed(0)}%`} width={36} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#374151" }} />
          <ReferenceLine y={0.45} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Area type="monotone" dataKey="retention" stroke="#0ea5e9" fill="url(#retGrad)"
            strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#0ea5e9" }} />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-sky-500 inline-block rounded" />Retention</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 inline-block rounded" style={{ borderStyle: "dashed" }} />Drop threshold</span>
      </div>
    </div>
  );
}
