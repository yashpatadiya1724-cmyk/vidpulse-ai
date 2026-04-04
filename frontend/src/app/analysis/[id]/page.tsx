"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { analysisApi, videosApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useAnalysisWebSocket } from "@/hooks/useWebSocket";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { AttentionTimeline } from "@/components/AttentionTimeline";
import { EngagementHeatmap } from "@/components/EngagementHeatmap";
import { HookScoreCard } from "@/components/HookScoreCard";
import { ViralityScore } from "@/components/ViralityScore";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { RetentionCurve } from "@/components/RetentionCurve";
import { ClipSuggestions } from "@/components/ClipSuggestions";
import { AnalysisResult, Video } from "@/types";
import { Loader, RefreshCw, AlertCircle, BarChart2, Download, Share2, Trash2, Clock, Image } from "lucide-react";

function ProcessingState() {
  const steps = ["Extracting frames", "Computing motion vectors", "Running AI models", "Generating insights"];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center px-5">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-sky-500/15" />
        <div className="absolute inset-0 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-sky-500/20 to-violet-500/20 flex items-center justify-center">
          <BarChart2 size={18} className="text-sky-400" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Analyzing your video</h3>
      <AnimatePresence mode="wait">
        <motion.p key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          className="text-sm text-gray-500 mb-6">{steps[step]}...</motion.p>
      </AnimatePresence>
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <motion.div key={i} animate={{ width: i === step ? 24 : 6, opacity: i === step ? 1 : 0.25 }}
            className="h-1.5 rounded-full bg-sky-500" />
        ))}
      </div>
      <p className="text-xs text-gray-700 mt-6">Usually takes 15–60 seconds</p>
    </div>
  );
}

function ScoreChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex-1 text-center py-3 px-2">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-600 mt-0.5">{label}</p>
    </div>
  );
}

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(0);
  const [showThumb, setShowThumb] = useState(false);

  useEffect(() => { if (!token) router.push("/auth/login"); }, [token, router]);

  const { data: video, refetch: refetchVideo } = useQuery<Video>({
    queryKey: ["video", id],
    queryFn: () => videosApi.get(id),
    refetchInterval: d => (d?.status === "processing" || d?.status === "uploaded" ? 3000 : false),
    enabled: !!token,
  });

  const { data: analysis, refetch: refetchAnalysis } = useQuery<AnalysisResult>({
    queryKey: ["analysis", id],
    queryFn: () => analysisApi.get(id),
    enabled: !!token && video?.status === "complete",
  });

  const deleteMutation = useMutation({
    mutationFn: () => videosApi.delete(id),
    onSuccess: () => { toast.success("Deleted"); router.push("/dashboard"); },
  });

  const { status: wsStatus } = useAnalysisWebSocket(id);
  useEffect(() => {
    if (wsStatus === "complete") { refetchVideo(); refetchAnalysis(); }
  }, [wsStatus]);

  const handleExport = () => {
    if (!analysis || !video) return;
    const lines = [
      `VidPulse AI — Analysis Report`,
      `Video: ${video.title}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Duration: ${Math.round(video.duration_sec || 0)}s`,
      ``,
      `=== SCORES ===`,
      `Overall Engagement: ${Math.round((analysis.overall_score || 0) * 100)}%`,
      `Hook Strength: ${analysis.hook_score}/100`,
      `Virality Potential: ${analysis.virality_score}%`,
      ``,
      `=== ATTENTION DROPS (${analysis.drops.length}) ===`,
      ...analysis.drops.map(d =>
        `  ${Math.floor(d.start_sec/60)}:${String(Math.floor(d.start_sec%60)).padStart(2,"0")} – ${Math.floor(d.end_sec/60)}:${String(Math.floor(d.end_sec%60)).padStart(2,"0")} | ${d.severity} | ${(d.avg_score*100).toFixed(0)}%`
      ),
      ``,
      `=== AI SUGGESTIONS (${analysis.recommendations.length}) ===`,
      ...analysis.recommendations.map(r =>
        `  [${r.priority.toUpperCase()}] ${r.timestamp}\n  Problem: ${r.problem}\n  Fix: ${r.suggestion}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vidpulse-${video.title.replace(/\s+/g, "-")}.txt`;
    a.click();
    toast.success("Report exported!");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  const isProcessing = video?.status === "uploaded" || video?.status === "processing";
  const thumbUrl = video?.status === "complete" ? videosApi.thumbnailUrl(id) : null;

  return (
    <div className="min-h-screen bg-[#0d0d14] pb-28">
      <TopBar
        title={video?.title || "Analysis"}
        subtitle={video?.duration_sec ? `${Math.round(video.duration_sec)}s · ${video.resolution || ""}` : undefined}
        back
        right={
          <div className="flex items-center gap-1">
            {video?.status === "complete" && (
              <>
                {thumbUrl && (
                  <button onClick={() => setShowThumb(!showThumb)}
                    className="w-9 h-9 btn-ghost flex items-center justify-center" title="Thumbnail">
                    <Image size={14} className="text-gray-400" />
                  </button>
                )}
                <button onClick={handleExport} className="w-9 h-9 btn-ghost flex items-center justify-center">
                  <Download size={14} className="text-gray-400" />
                </button>
                <button onClick={handleShare} className="w-9 h-9 btn-ghost flex items-center justify-center">
                  <Share2 size={14} className="text-gray-400" />
                </button>
                <button onClick={() => analysisApi.reanalyze(id).then(() => refetchVideo())}
                  className="w-9 h-9 btn-ghost flex items-center justify-center">
                  <RefreshCw size={14} className="text-gray-400" />
                </button>
              </>
            )}
            <button onClick={() => deleteMutation.mutate()}
              className="w-9 h-9 btn-ghost flex items-center justify-center hover:bg-red-500/10">
              <Trash2 size={14} className="text-red-400/70" />
            </button>
          </div>
        }
      />

      <div className="px-4 max-w-lg mx-auto">
        {isProcessing && <ProcessingState />}

        {video?.status === "error" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-4">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="font-bold text-white mb-1">Analysis failed</p>
            <p className="text-gray-500 text-sm mb-6">Something went wrong processing your video.</p>
            <button onClick={() => analysisApi.reanalyze(id).then(() => refetchVideo())}
              className="btn-primary px-6 py-3 text-sm flex items-center gap-2">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {video?.status === "complete" && analysis && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4">

            {/* Thumbnail preview */}
            <AnimatePresence>
              {showThumb && thumbUrl && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="card overflow-hidden rounded-2xl">
                    <img src={`${thumbUrl}?t=${Date.now()}`}
                      alt="Video thumbnail" className="w-full object-cover"
                      style={{ maxHeight: 180 }}
                      onError={() => setShowThumb(false)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick score strip */}
            <div className="card flex items-center divide-x divide-gray-800/80">
              <ScoreChip label="Engagement" value={`${Math.round((analysis.overall_score||0)*100)}%`} color="text-sky-400" />
              <ScoreChip label="Hook" value={`${analysis.hook_score}/100`} color="text-violet-400" />
              <ScoreChip label="Virality" value={`${analysis.virality_score}%`} color="text-emerald-400" />
              <ScoreChip label="Drops" value={analysis.drops.length}
                color={analysis.drops.length > 3 ? "text-red-400" : analysis.drops.length > 0 ? "text-amber-400" : "text-gray-400"} />
            </div>

            {/* Score cards */}
            <HookScoreCard score={analysis.hook_score ?? 0} />
            <ViralityScore score={analysis.virality_score ?? 0} />

            {/* Overall */}
            <div className="card p-5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Overall Engagement</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-5xl font-bold text-sky-400">{Math.round((analysis.overall_score??0)*100)}</span>
                <span className="text-2xl text-gray-600 mb-1">%</span>
              </div>
              <div className="w-full bg-[#1e1e30] rounded-full h-2.5 overflow-hidden mb-2">
                <motion.div className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${(analysis.overall_score??0)*100}%` }}
                  transition={{ duration: 1.2 }} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{analysis.drops.length} drop{analysis.drops.length !== 1 ? "s" : ""} detected</span>
                {analysis.duration_seconds && (
                  <span className="flex items-center gap-1"><Clock size={10} /> {Math.round(analysis.duration_seconds)}s</span>
                )}
              </div>
            </div>

            {/* Retention Curve — NEW */}
            {analysis.attention_timeline.length > 0 && (
              <RetentionCurve scores={analysis.attention_timeline} />
            )}

            {/* Heatmap */}
            {analysis.attention_timeline.length > 0 && (
              <EngagementHeatmap timeline={analysis.attention_timeline} onSeek={setCurrentTime} />
            )}

            {/* Timeline */}
            {analysis.attention_timeline.length > 0 && (
              <AttentionTimeline scores={analysis.attention_timeline} drops={analysis.drops}
                currentTime={currentTime} onSeek={setCurrentTime} />
            )}

            {/* Clip Suggestions — NEW */}
            <ClipSuggestions videoId={id} onSeek={setCurrentTime} />

            {/* Recommendations */}
            <RecommendationPanel recommendations={analysis.recommendations} onSeek={setCurrentTime} />

            {/* Drops table */}
            {analysis.drops.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-white">Attention Drops</p>
                  <span className="text-xs text-gray-600">{analysis.drops.length} detected</span>
                </div>
                <div className="space-y-2">
                  {analysis.drops.map((d, i) => {
                    const sev: Record<string, string> = {
                      critical: "text-red-400 bg-red-500/10",
                      high: "text-orange-400 bg-orange-500/10",
                      medium: "text-amber-400 bg-amber-500/10",
                      low: "text-gray-400 bg-gray-700/40",
                    };
                    return (
                      <div key={i} onClick={() => setCurrentTime(d.start_sec)}
                        className="flex items-center justify-between py-3 px-3 rounded-xl bg-[#1a1a28] hover:bg-[#1e1e30] active:scale-[0.98] transition cursor-pointer">
                        <span className="font-mono text-xs text-gray-400">
                          {Math.floor(d.start_sec/60)}:{String(Math.floor(d.start_sec%60)).padStart(2,"0")}
                          {" – "}
                          {Math.floor(d.end_sec/60)}:{String(Math.floor(d.end_sec%60)).padStart(2,"0")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sev[d.severity]||sev.low}`}>{d.severity}</span>
                          <span className="text-xs text-gray-600">{(d.avg_score*100).toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Export */}
            <div className="card p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Export Report</p>
                <p className="text-xs text-gray-500 mt-0.5">Download full analysis as .txt</p>
              </div>
              <button onClick={handleExport}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-2.5 rounded-xl text-xs font-semibold hover:opacity-90 transition">
                <Download size={13} /> Export
              </button>
            </div>

          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
