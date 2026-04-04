"use client";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props { score: number }

export function ViralityScore({ score }: Props) {
  const color   = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const textCls = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : "text-red-400";
  const Icon    = score >= 70 ? TrendingUp : score >= 40 ? Minus : TrendingDown;
  const label   = score >= 70 ? "High viral potential" : score >= 40 ? "Moderate potential" : "Low viral potential";

  return (
    <div className="card p-5">
      <p className="text-xs text-gray-500 font-medium mb-4 uppercase tracking-wider">Virality Potential</p>
      <div className="flex items-end gap-2 mb-4">
        <motion.span className={`text-5xl font-bold ${textCls}`}
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "backOut" }}>
          {score}
        </motion.span>
        <span className="text-2xl text-gray-500 mb-1">%</span>
        <Icon size={20} className={`${textCls} mb-2 ml-1`} />
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2 mb-3 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }} />
      </div>
      <p className={`text-xs font-medium ${textCls}`}>{label}</p>
      <p className="text-xs text-gray-600 mt-1">Based on pacing, motion & engagement patterns</p>
    </div>
  );
}
