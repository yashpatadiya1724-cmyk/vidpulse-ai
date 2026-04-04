"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { videosApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { BottomNav } from "@/components/BottomNav";
import { Video } from "@/types";
import {
  Loader, Upload, BarChart2, Zap, TrendingUp, CheckCircle,
  AlertCircle, Clock, ChevronRight, Search, Trash2, RefreshCw,
  Filter, SlidersHorizontal, X
} from "lucide-react";

type StatusFilter = "all" | "complete" | "processing" | "error";

const statusConfig: Record<string, { color: string; label: string; dot: string }> = {
  uploaded:   { color: "text-gray-400",   label: "Queued",    dot: "bg-gray-500" },
  processing: { color: "text-amber-400",  label: "Analyzing", dot: "bg-amber-400 animate-pulse" },
  complete:   { color: "text-emerald-400",label: "Done",      dot: "bg-emerald-400" },
  error:      { color: "text-red-400",    label: "Error",     dot: "bg-red-400" },
};

function VideoCard({ video, index, onDelete }: { video: Video; index: number; onDelete: (id: string) => void }) {
  const cfg = statusConfig[video.status] || statusConfig.uploaded;
  const [showDelete, setShowDelete] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="card p-4 hover:border-gray-700 transition group">
      <div className="flex items-center gap-3">
        {/* Thumb */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500/15 to-violet-500/15 flex items-center justify-center shrink-0 border border-white/5">
          <BarChart2 size={20} className="text-sky-400/50" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{video.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
            {video.duration_sec && <span className="text-xs text-gray-600">· {Math.round(video.duration_sec)}s</span>}
            <span className="text-xs text-gray-700">· {new Date(video.created_at).toLocaleDateString()}</span>
          </div>
          {video.status === "complete" && (
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-sky-400 font-semibold">{Math.round((video.overall_score||0)*100)}%</span>
              <span className="text-xs text-violet-400 font-semibold">Hook {video.hook_score}</span>
              <span className="text-xs text-emerald-400 font-semibold">{video.virality_score}% viral</span>
            </div>
          )}
          {video.status === "processing" && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Loader size={10} className="text-amber-400 animate-spin" />
              <span className="text-xs text-amber-400">AI analyzing...</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {video.status === "complete" && (
            <Link href={`/analysis/${video.id}`}
              className="w-8 h-8 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 flex items-center justify-center transition">
              <ChevronRight size={15} className="text-sky-400" />
            </Link>
          )}
          <button onClick={() => setShowDelete(true)}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/15 flex items-center justify-center transition opacity-0 group-hover:opacity-100">
            <Trash2 size={13} className="text-gray-500 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-400">Delete this video?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 transition">Cancel</button>
              <button onClick={() => { onDelete(video.id); setShowDelete(false); }}
                className="text-xs text-red-400 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition">Delete</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => { if (!token) router.push("/auth/login"); }, [token, router]);

  const { data: videos = [], isLoading } = useQuery<Video[]>({
    queryKey: ["videos"], queryFn: videosApi.list,
    refetchInterval: 4000, enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: videosApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); toast.success("Video deleted"); },
    onError: () => toast.error("Delete failed"),
  });

  const complete = videos.filter(v => v.status === "complete");
  const avgEng   = complete.length ? Math.round(complete.reduce((s, v) => s + (v.overall_score||0), 0) / complete.length * 100) : 0;
  const avgHook  = complete.length ? Math.round(complete.reduce((s, v) => s + (v.hook_score||0), 0) / complete.length) : 0;
  const avgViral = complete.length ? Math.round(complete.reduce((s, v) => s + (v.virality_score||0), 0) / complete.length) : 0;

  const filtered = videos.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || v.status === filter;
    return matchSearch && matchFilter;
  });

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "complete", label: "Done" },
    { key: "processing", label: "Processing" },
    { key: "error", label: "Error" },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d14] pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-gray-500 text-xs">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white">{user?.name?.split(" ")[0] || "Creator"} 👋</h1>
          </div>
          <Link href="/upload"
            className="w-11 h-11 bg-gradient-to-br from-sky-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 active:scale-95 transition">
            <Upload size={19} className="text-white" />
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      {complete.length > 0 && (
        <div className="px-5 mb-5 mt-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Avg Engagement", value: `${avgEng}%`,   icon: TrendingUp, color: "text-sky-400",     from: "from-sky-500/10" },
              { label: "Avg Hook",       value: avgHook,         icon: Zap,        color: "text-violet-400",  from: "from-violet-500/10" },
              { label: "Avg Virality",   value: `${avgViral}%`,  icon: BarChart2,  color: "text-emerald-400", from: "from-emerald-500/10" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className={`bg-gradient-to-b ${s.from} to-transparent border border-white/6 rounded-2xl p-3 text-center`}>
                <s.icon size={15} className={`${s.color} mx-auto mb-1`} />
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-600 leading-tight">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="px-5 mb-4 space-y-3">
        <div className="flex items-center gap-2 bg-[#161622] border border-[#1e1e2e] rounded-2xl px-4 py-3">
          <Search size={15} className="text-gray-600 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none" />
          {search && <button onClick={() => setSearch("")}><X size={14} className="text-gray-600" /></button>}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filterTabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === t.key ? "bg-sky-500/20 text-sky-400 border border-sky-500/30" : "bg-[#161622] text-gray-500 border border-[#1e1e2e]"
              }`}>
              {t.label}
              {t.key !== "all" && (
                <span className="ml-1.5 opacity-60">{videos.filter(v => v.status === t.key || (t.key === "processing" && v.status === "uploaded")).length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Videos list */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white">
            {filtered.length} video{filtered.length !== 1 ? "s" : ""}
            {search && <span className="text-gray-500 font-normal"> for "{search}"</span>}
          </h2>
          <button onClick={() => qc.invalidateQueries({ queryKey: ["videos"] })}
            className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
            <RefreshCw size={12} className="text-gray-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-600">
            <Loader size={16} className="animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-500/8 to-violet-500/8 rounded-3xl flex items-center justify-center mb-5 border border-white/5">
              {search ? <Search size={28} className="text-gray-600" /> : <Upload size={28} className="text-gray-600" />}
            </div>
            <p className="font-semibold text-white mb-1">{search ? "No results" : "No videos yet"}</p>
            <p className="text-gray-600 text-sm mb-6">
              {search ? `Nothing matches "${search}"` : "Upload your first video to get AI analysis"}
            </p>
            {!search && (
              <Link href="/upload" className="bg-gradient-to-r from-sky-500 to-violet-600 px-6 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
                <Upload size={14} /> Upload Video
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((v, i) => (
              <VideoCard key={v.id} video={v} index={i} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
