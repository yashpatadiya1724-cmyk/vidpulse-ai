"use client";
import { motion } from "framer-motion";

interface Props { score: number }

function getColor(s: number) {
  if (s >= 81) return { stroke: "#10b981", text: "text-emerald-400", label: "Viral-level opening" };
  if (s >= 61) return { stroke: "#0ea5e9", text: "text-sky-400",     label: "Strong hook" };
  if (s >= 31) return { stroke: "#f59e0b", text: "text-amber-400",   label: "Average hook" };
  return         { stroke: "#ef4444", text: "text-red-400",          label: "Weak hook — high skip risk" };
}

export function HookScoreCard({ score }: Props) {
  const { stroke, text, label } = getColor(score);
  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="card p-5">
      <p className="text-xs text-gray-500 font-medium mb-4 uppercase tracking-wider">Hook Strength</p>
      <div className="flex items-center gap-5">
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
            <motion.circle cx="60" cy="60" r={r} fill="none" stroke={stroke} strokeWidth="10"
              strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }} transition={{ duration: 1.4, ease: "easeOut" }}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span className={`text-3xl font-bold ${text}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              {score}
            </motion.span>
            <span className="text-xs text-gray-600">/100</span>
          </div>
        </div>
        <div>
          <p className={`font-semibold text-sm ${text}`}>{label}</p>
          <div className="mt-3 space-y-1.5">
            {[
              { label: "Motion", pct: Math.min(100, score * 1.2) },
              { label: "Novelty", pct: Math.min(100, score * 0.9) },
              { label: "Pacing",  pct: Math.min(100, score * 1.1) },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-12">{b.label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: stroke }}
                    initial={{ width: 0 }} animate={{ width: `${b.pct}%` }}
                    transition={{ duration: 1, delay: 0.3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
