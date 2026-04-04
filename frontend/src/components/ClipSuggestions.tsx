"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { analysisApi } from "@/lib/api";
import { Scissors, TrendingUp, Copy } from "lucide-react";
import toast from "react-hot-toast";

interface Props { videoId: string; onSeek?: (t: number) => void; }

export function ClipSuggestions({ videoId, onSeek }: Props) {
  const { data: clips = [] } = useQuery({
    queryKey: ["clips", videoId],
    queryFn: () => analysisApi.clipSuggestions(videoId),
  });

  if (!clips.length) return null;

  const copyTimestamp = (clip: any) => {
    navigator.clipboard.writeText(`${clip.start_fmt} - ${clip.end_fmt}`);
    toast.success("Timestamp copied!");
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
          <Scissors size={15} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Best Clip Windows</p>
          <p className="text-xs text-gray-500">Highest engagement segments for Reels/Shorts/TikTok</p>
        </div>
      </div>

      <div className="space-y-3">
        {clips.map((clip: any, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-[#1a1a28] rounded-xl p-4 cursor-pointer hover:bg-[#1e1e30] transition"
            onClick={() => onSeek?.(clip.start_sec)}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400">{clip.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">{clip.start_fmt} → {clip.end_fmt}</span>
                <button onClick={(e) => { e.stopPropagation(); copyTimestamp(clip); }}
                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
                  <Copy size={10} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#0d0d14] rounded-full h-2 overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${clip.avg_score * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }} />
              </div>
              <span className="text-xs font-bold text-emerald-400 shrink-0">
                {Math.round(clip.avg_score * 100)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
