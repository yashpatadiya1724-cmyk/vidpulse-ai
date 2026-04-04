"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { videosApi } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { Upload, Film, X, CheckCircle, Loader, Youtube, Link2, Sparkles } from "lucide-react";

type Tab = "file" | "youtube";

function isYouTubeUrl(url: string) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/.test(url);
}

export default function UploadPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("file");

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  // YouTube state
  const [ytUrl, setYtUrl] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytDone, setYtDone] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setFileTitle(accepted[0].name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "video/*": [".mp4", ".mov", ".avi", ".webm"] },
    maxFiles: 1, disabled: uploading,
  });

  const handleFileUpload = async () => {
    if (!file || !fileTitle.trim()) return toast.error("Add a title first");
    setUploading(true);
    try {
      const video = await videosApi.upload(file, fileTitle, setProgress);
      setDone(true);
      toast.success("Uploaded! Analysis starting...");
      setTimeout(() => router.push(`/analysis/${video.id}`), 700);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed");
      setUploading(false);
    }
  };

  const handleYouTube = async () => {
    if (!ytUrl.trim()) return toast.error("Paste a YouTube URL first");
    if (!isYouTubeUrl(ytUrl)) return toast.error("Not a valid YouTube URL");
    setYtLoading(true);
    try {
      const video = await videosApi.analyzeYoutube(ytUrl, ytTitle || undefined);
      setYtDone(true);
      toast.success("Video fetched! Analysis starting...");
      setTimeout(() => router.push(`/analysis/${video.id}`), 700);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Could not fetch YouTube video");
      setYtLoading(false);
    }
  };

  const fmt = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  return (
    <div className="min-h-screen bg-[#0d0d14] pb-28">
      <TopBar title="Analyze Video" subtitle="Upload a file or paste a YouTube URL" />

      <div className="px-4 pt-5 max-w-lg mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 bg-[#161622] border border-[#1e1e2e] rounded-2xl p-1">
          {([
            { key: "file",    label: "Upload File",   icon: Upload },
            { key: "youtube", label: "YouTube URL",   icon: Youtube },
          ] as { key: Tab; label: string; icon: any }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-gradient-to-r from-sky-500 to-violet-600 text-white shadow-lg"
                  : "text-gray-500 hover:text-gray-300"
              }`}>
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── FILE UPLOAD TAB ── */}
          {tab === "file" && (
            <motion.div key="file" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="space-y-4">
              {/* Dropzone */}
              <div {...getRootProps()}
                className={`rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                  isDragActive ? "border-sky-500 bg-sky-500/8 scale-[1.01]"
                  : file ? "border-violet-500/40 bg-violet-500/5"
                  : "border-[#2a2a3e] hover:border-[#3a3a5e] bg-[#161622]"
                } ${uploading ? "pointer-events-none" : ""}`}>
                <input {...getInputProps()} />
                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-violet-500/15 rounded-2xl flex items-center justify-center">
                        <Film size={26} className="text-violet-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{fmt(file.size)}</p>
                      </div>
                      {!uploading && (
                        <button onClick={e => { e.stopPropagation(); setFile(null); setFileTitle(""); }}
                          className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-400 transition">
                          <X size={11} /> Remove
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-[#1e1e30] rounded-2xl flex items-center justify-center">
                        <Upload size={24} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="text-gray-300 font-medium text-sm">
                          {isDragActive ? "Drop it here" : "Tap to select video"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">MP4, MOV, AVI, WebM · max 500MB</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {file && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="card-sm px-4 py-4">
                    <p className="text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wide">Title</p>
                    <input type="text" placeholder="Give your video a title..." value={fileTitle}
                      onChange={e => setFileTitle(e.target.value)} disabled={uploading}
                      className="w-full bg-transparent text-white placeholder-gray-600 focus:outline-none text-[15px] disabled:opacity-50" />
                  </div>

                  {uploading && (
                    <div className="card-sm px-4 py-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1.5"><Loader size={11} className="animate-spin" /> Uploading...</span>
                        <span className="font-bold text-white">{progress}%</span>
                      </div>
                      <div className="w-full bg-[#1e1e30] rounded-full h-2 overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full"
                          initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  <button onClick={handleFileUpload} disabled={uploading || !fileTitle.trim()}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-[15px] shadow-lg shadow-sky-500/15 disabled:opacity-50">
                    {done ? <><CheckCircle size={17} /> Redirecting...</>
                      : uploading ? <><Loader size={17} className="animate-spin" /> Uploading {progress}%</>
                      : <><Sparkles size={17} /> Upload & Analyze</>}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── YOUTUBE TAB ── */}
          {tab === "youtube" && (
            <motion.div key="youtube" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="space-y-4">
              {/* Info banner */}
              <div className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-2xl px-4 py-3.5">
                <Youtube size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Analyze any YouTube video</p>
                  <p className="text-xs text-gray-500 mt-0.5">Paste a YouTube link — we'll download and run the full AI analysis on it.</p>
                </div>
              </div>

              {/* URL input */}
              <div className="card-sm">
                <div className="flex items-center gap-3 px-4 py-4">
                  <Link2 size={17} className="text-gray-500 shrink-0" />
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={ytUrl}
                    onChange={e => setYtUrl(e.target.value)}
                    disabled={ytLoading}
                    className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-[15px] disabled:opacity-50"
                  />
                  {ytUrl && !ytLoading && (
                    <button onClick={() => { setYtUrl(""); setYtTitle(""); }}>
                      <X size={14} className="text-gray-600 hover:text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Validation indicator */}
              {ytUrl && (
                <div className={`flex items-center gap-2 text-xs px-1 ${isYouTubeUrl(ytUrl) ? "text-emerald-400" : "text-red-400"}`}>
                  {isYouTubeUrl(ytUrl)
                    ? <><CheckCircle size={12} /> Valid YouTube URL</>
                    : <><X size={12} /> Not a valid YouTube URL</>}
                </div>
              )}

              {/* Optional custom title */}
              {ytUrl && isYouTubeUrl(ytUrl) && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="card-sm px-4 py-4">
                    <p className="text-xs text-gray-600 mb-1.5 font-medium uppercase tracking-wide">Custom Title (optional)</p>
                    <input type="text" placeholder="Leave blank to use YouTube title..."
                      value={ytTitle} onChange={e => setYtTitle(e.target.value)} disabled={ytLoading}
                      className="w-full bg-transparent text-white placeholder-gray-600 focus:outline-none text-[15px] disabled:opacity-50" />
                  </div>
                </motion.div>
              )}

              {/* Loading state */}
              {ytLoading && (
                <div className="card-sm px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Loader size={16} className="text-sky-400 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium">Downloading from YouTube...</p>
                      <p className="text-xs text-gray-500 mt-0.5">This may take 30–60 seconds depending on video length</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-[#1e1e30] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-sky-500 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              <button
                onClick={handleYouTube}
                disabled={ytLoading || !ytUrl.trim() || !isYouTubeUrl(ytUrl)}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-[15px] shadow-lg shadow-sky-500/15 disabled:opacity-50">
                {ytDone ? <><CheckCircle size={17} /> Redirecting...</>
                  : ytLoading ? <><Loader size={17} className="animate-spin" /> Fetching video...</>
                  : <><Youtube size={17} /> Analyze YouTube Video</>}
              </button>

              <p className="text-center text-xs text-gray-700">
                Works with youtube.com/watch, youtu.be, and YouTube Shorts
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
