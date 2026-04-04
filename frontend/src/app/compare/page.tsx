"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { videosApi, analysisApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { Video, AnalysisResult } from "@/types";
import { BarChart2, ChevronDown, TrendingUp, Zap, AlertCircle } from "lucide-react";

function VideoSelector({ videos, selected, onSelect, label }: {
  videos: Video[]; selected: string; onSelect: (id: string) => void; label: string;
}) {
  const [open, setOpen] = useState(false);
  const sel = videos.find(v => v.id === selected);
  return (
    <div className="relative">
      <p className="text-xs text-gray-500 font-medium mb-2">{label}</p>
      <button onClick={() => setOpen(!open)}
        className="w-full card p-3 flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-500/10 rounded-xl flex items-center justify-center">
            <BarChart2 size={15} className="text-sky-400" />
          </div>
          <span className="text-sm text-white truncate">{sel?.title || "Select video..."}</span>
        </div>
        <ChevronDown size={14} className={`text-gray-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#161622] border border-[#1e1e2e] rounded-2xl overflow-hidden z-20 shadow-2xl">
          {videos.filter(v => v.status === "complete").map(v => (
            <button key={v.id} onClick={() => { onSelect(v.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition text-left ${selected === v.id ? "bg-sky-500/10" : ""}`}>
              <span className="text-sm text-white truncate">{v.title}</span>
              <span className="text-xs text-gray-600 ml-auto shrink-0">{Math.round((v.overall_score||0)*100)}%</span>
            </button>
          ))}
          {videos.filter(v => v.status === "complete").length === 0 && (
            <p className="text-xs text-gray-600 px-4 py-3">No analyzed videos yet</p>
          )}
        </div>
      )}
    </div>
  );
}

function CompareBar({ label, a, b, colorA, colorB }: { label: string; a: number; b: number; colorA: string; colorB: string }) {
  const max = Math.max(a, b, 1);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>{label}</span>
        <div className="flex gap-3">
          <span style={{ color: colorA }} className="font-bold">{a}%</span>
          <span style={{ color: colorB }} className="font-bold">{b}%</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="w-full bg-[#1e1e30] rounded-full h-2 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: colorA }}
            initial={{ width: 0 }} animate={{ width: `${(a/max)*100}%` }} transition={{ duration: 1 }} />
        </div>
        <div className="w-full bg-[#1e1e30] rounded-full h-2 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: colorB }}
            initial={{ width: 0 }} animate={{ width: `${(b/max)*100}%` }} transition={{ duration: 1 }} />
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push("/auth/login"); }, [token, router]);

  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["videos"], queryFn: videosApi.list, enabled: !!token,
  });

  const { data: analysisA } = useQuery<AnalysisResult>({
    queryKey: ["analysis", idA], queryFn: () => analysisApi.get(idA), enabled: !!idA,
  });
  const { data: analysisB } = useQuery<AnalysisResult>({
    queryKey: ["analysis", idB], queryFn: () => analysisApi.get(idB), enabled: !!idB,
  });

  const videoA = videos.find(v => v.id === idA);
  const videoB = videos.find(v => v.id === idB);
  const canCompare = !!analysisA && !!analysisB;

  const COLOR_A = "#0ea5e9";
  const COLOR_B = "#8b5cf6";

  return (
    <div className="min-h-screen bg-[#0d0d14] pb-28">
      <TopBar title="Compare Videos" subtitle="Side-by-side analysis" back />
      <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">

        {/* Selectors */}
        <VideoSelector videos={videos} selected={idA} onSelect={setIdA} label="Video A" />
        <VideoSelector videos={videos} selected={idB} onSelect={setIdB} label="Video B" />

        {/* Legend */}
        {canCompare && (
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: COLOR_A }} />{videoA?.title?.slice(0,20)}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: COLOR_B }} />{videoB?.title?.slice(0,20)}</span>
          </div>
        )}

        {/* Comparison */}
        {canCompare && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Winner banner */}
            {(() => {
              const scoreA = Math.round((analysisA.overall_score||0)*100);
              const scoreB = Math.round((analysisB.overall_score||0)*100);
              const winner = scoreA > scoreB ? videoA : scoreB > scoreA ? videoB : null;
              return winner ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <TrendingUp size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">"{winner.title.slice(0,30)}" wins</p>
                    <p className="text-xs text-gray-500">Higher overall engagement score</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-400 shrink-0" />
                  <p className="text-sm text-white">It's a tie! Both videos have equal engagement.</p>
                </div>
              );
            })()}

            {/* Score comparison */}
            <div className="card p-5">
              <p className="text-sm font-bold text-white mb-4">Score Comparison</p>
              <CompareBar label="Engagement"
                a={Math.round((analysisA.overall_score||0)*100)}
                b={Math.round((analysisB.overall_score||0)*100)}
                colorA={COLOR_A} colorB={COLOR_B} />
              <CompareBar label="Hook Score"
                a={analysisA.hook_score||0}
                b={analysisB.hook_score||0}
                colorA={COLOR_A} colorB={COLOR_B} />
              <CompareBar label="Virality"
                a={analysisA.virality_score||0}
                b={analysisB.virality_score||0}
                colorA={COLOR_A} colorB={COLOR_B} />
            </div>

            {/* Drops comparison */}
            <div className="card p-5">
              <p className="text-sm font-bold text-white mb-4">Attention Drops</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: videoA?.title?.slice(0,16), drops: analysisA.drops.length, color: COLOR_A },
                  { label: videoB?.title?.slice(0,16), drops: analysisB.drops.length, color: COLOR_B },
                ].map(s => (
                  <div key={s.label} className="bg-[#1a1a28] rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.drops}</p>
                    <p className="text-xs text-gray-600 mt-1 truncate">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!canCompare && idA && idB && (
          <div className="text-center py-8 text-gray-600 text-sm">Loading comparison...</div>
        )}

        {!idA && !idB && (
          <div className="text-center py-12">
            <BarChart2 size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Select two analyzed videos to compare them</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
