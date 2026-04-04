"use client";
import { motion } from "framer-motion";
import { RecommendationItem } from "@/types";
import { AlertTriangle, Lightbulb, ChevronRight } from "lucide-react";

interface Props {
  recommendations: RecommendationItem[];
  onSeek?: (t: number) => void;
}

const priorityStyle = {
  high:   { border: "border-red-500/30",    bg: "bg-red-500/5",    badge: "bg-red-500/15 text-red-400" },
  medium: { border: "border-amber-500/30",  bg: "bg-amber-500/5",  badge: "bg-amber-500/15 text-amber-400" },
  low:    { border: "border-gray-700/50",   bg: "bg-gray-800/30",  badge: "bg-gray-700 text-gray-400" },
};

export function RecommendationPanel({ recommendations, onSeek }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">AI Edit Suggestions</p>
        <span className="text-xs text-gray-500">{recommendations.length} suggestion{recommendations.length !== 1 ? "s" : ""}</span>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Lightbulb size={20} className="text-emerald-400" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Looks great!</p>
          <p className="text-xs text-gray-600 mt-1">No major issues detected in your video.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            const style = priorityStyle[rec.priority] || priorityStyle.low;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`border ${style.border} ${style.bg} rounded-xl p-4 cursor-pointer hover:brightness-110 transition group`}
                onClick={() => {
                  const m = rec.timestamp.match(/(\d+):(\d+)/);
                  if (m && onSeek) onSeek(parseInt(m[1]) * 60 + parseInt(m[2]));
                }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-gray-500">{rec.timestamp}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{rec.priority}</span>
                    <ChevronRight size={12} className="text-gray-600 group-hover:text-gray-400 transition" />
                  </div>
                </div>
                <div className="flex items-start gap-2 mb-1.5">
                  <AlertTriangle size={13} className="text-orange-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-300 leading-snug">{rec.problem}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Lightbulb size={13} className="text-sky-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-sky-300 leading-snug">{rec.suggestion}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
