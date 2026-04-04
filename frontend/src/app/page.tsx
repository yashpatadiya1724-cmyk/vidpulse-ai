"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Zap, TrendingUp, Eye, ArrowRight, BarChart2, Cpu, Youtube, Upload } from "lucide-react";

const features = [
  { icon: Eye,        title: "Frame-by-Frame Heatmaps",  desc: "Color-coded engagement map showing exactly where viewers drop off, second by second.", color: "text-sky-400",     bg: "bg-sky-400/10",     border: "border-sky-400/20" },
  { icon: Zap,        title: "Hook Strength Score",       desc: "AI scores your first 5 seconds — the most critical window for viewer retention.", color: "text-violet-400",  bg: "bg-violet-400/10",  border: "border-violet-400/20" },
  { icon: TrendingUp, title: "Virality Prediction",       desc: "Predict viral potential using pacing, motion and engagement patterns.", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  { icon: BarChart2,  title: "Smart Edit Suggestions",    desc: "Timestamped, actionable fixes tied to specific seconds in your video.", color: "text-pink-400",    bg: "bg-pink-400/10",    border: "border-pink-400/20" },
];

const steps = [
  { n: "01", icon: Upload,  title: "Upload or paste URL",  desc: "Upload MP4/MOV/AVI/WebM up to 500MB, or paste any YouTube link." },
  { n: "02", icon: Cpu,     title: "AI analyzes it",       desc: "Frame extraction, optical flow, attention scoring — all automatic." },
  { n: "03", icon: BarChart2,title: "Get your report",     desc: "Heatmaps, hook score, virality, drops and edit suggestions." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0d0d14] overflow-x-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-sky-500/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-violet-500/6 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-violet-600 rounded-xl flex items-center justify-center">
            <Activity size={15} className="text-white" />
          </div>
          <span className="font-bold text-white">VidPulse AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-gray-500 hover:text-white text-sm transition px-3 py-2">Sign In</Link>
          <Link href="/auth/register" className="bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition">
            Get Started Free
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="text-center pt-20 pb-16">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 text-sky-400 text-xs font-medium mb-8">
            <Cpu size={12} /> AI-Powered · Frame-by-Frame · YouTube Support
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
            Know exactly why<br />
            <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              viewers click away
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Upload any video or paste a YouTube URL. Get AI-powered attention scores, engagement heatmaps, hook strength, virality prediction and timestamped edit suggestions.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register"
              className="group flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-violet-600 hover:opacity-90 px-8 py-4 rounded-2xl font-semibold text-base transition shadow-2xl shadow-sky-500/20">
              Start Analyzing Free
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/auth/login"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-2xl font-semibold text-base transition">
              Sign In
            </Link>
          </motion.div>

          <p className="text-gray-700 text-xs mt-4">No credit card · Free plan · Results in ~60 seconds</p>
        </section>

        {/* YouTube highlight */}
        <section className="pb-12">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-red-500/8 to-orange-500/8 border border-red-500/20 rounded-2xl p-6 flex items-center gap-5">
            <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center shrink-0">
              <Youtube size={26} className="text-red-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Analyze any YouTube video</p>
              <p className="text-gray-400 text-sm mt-1">Paste a YouTube URL — we download it and run the full AI pipeline. No manual download needed.</p>
            </div>
            <Link href="/auth/register" className="shrink-0 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-4 py-2 rounded-xl text-sm font-semibold text-red-300 transition">
              Try it →
            </Link>
          </motion.div>
        </section>

        {/* How it works */}
        <section className="pb-14">
          <p className="text-center text-xs text-gray-600 font-semibold uppercase tracking-widest mb-8">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i + 0.2 }}
                className="bg-[#161622] border border-[#1e1e2e] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-black text-white/10">{s.n}</span>
                  <s.icon size={18} className="text-sky-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="pb-14">
          <p className="text-center text-xs text-gray-600 font-semibold uppercase tracking-widest mb-8">What you get</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i + 0.3 }}
                className={`bg-[#161622] border ${f.border} rounded-2xl p-6 hover:brightness-110 transition`}>
                <div className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon size={20} className={f.color} />
                </div>
                <h3 className="text-white font-semibold mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20 text-center">
          <div className="bg-gradient-to-r from-sky-500/8 via-violet-500/8 to-pink-500/8 border border-white/6 rounded-3xl p-10">
            <h2 className="text-3xl font-bold text-white mb-3">Ready to optimize your videos?</h2>
            <p className="text-gray-500 mb-6 text-sm">Upload a file or paste a YouTube URL — results in under 60 seconds.</p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-violet-600 hover:opacity-90 px-8 py-4 rounded-2xl font-semibold transition shadow-xl shadow-sky-500/20">
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
