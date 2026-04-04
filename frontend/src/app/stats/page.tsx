"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { videosApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { Video } from "@/types";
import { BarChart2, TrendingUp, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function StatsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push("/auth/login"); }, [token, router]);

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["videos"], queryFn: videosApi.list, enabled: !!token,
  });

  const complete = videos.filter(v => v.status === "complete");
  const chartData = complete.slice(-8).map(v => ({
    name: v.title.slice(0, 10),
    engagement: Math.round((v.overall_score||0)*100),
    hook: v.hook_score||0,
    virality: v.virality_score||0,
  }));

  const avg = (key: keyof typeof chartData[0]) =>
    complete.length ? Math.round(complete.reduce((s, v) => {
      if (key === "engagement") return s + (v.overall_score||0)*100;
      if (key === "hook") return s + (v.hook_score||0);
      return s + (v.virality_score||0);
    }, 0) / complete.length) : 0;

  const radialData = [
    { name: "Engagement", value: avg("engagement"), fill: "#0ea5e9" },
    { name: "Hook",       value: avg("hook"),       fill: "#8b5cf6" },
    { name: "Virality",   value: avg("virality"),   fill: "#10b981" },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d14] pb-28">
      <TopBar title="Stats" subtitle={`${complete.length} videos analyzed`} />
      <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">

        {complete.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BarChart2 size={40} className="text-gray-700 mb-4" />
            <p className="text-gray-500 text-sm">No analyzed videos yet</p>
          </div>
        ) : (
          <>
            {/* Radial overview */}
            <div className="card p-5">
              <p className="text-sm font-bold text-white mb-4">Average Scores</p>
              <div className="flex items-center gap-4">
                <div style={{ width: 120, height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                      <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#1e1e30" }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {radialData.map(d => (
                    <div key={d.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{d.name}</span>
                        <span className="font-bold" style={{ color: d.fill }}>{d.value}%</span>
                      </div>
                      <div className="w-full bg-[#1e1e30] rounded-full h-1.5">
                        <motion.div className="h-full rounded-full" style={{ backgroundColor: d.fill }}
                          initial={{ width: 0 }} animate={{ width: `${d.value}%` }} transition={{ duration: 1 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar chart */}
            {chartData.length > 1 && (
              <div className="card p-5">
                <p className="text-sm font-bold text-white mb-4">Engagement per Video</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} barSize={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e30" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#4b5563" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#4b5563" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ background: "#161622", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 11 }} />
                    <Bar dataKey="engagement" fill="#0ea5e9" radius={[4,4,0,0]} />
                    <Bar dataKey="hook"       fill="#8b5cf6" radius={[4,4,0,0]} />
                    <Bar dataKey="virality"   fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-3 justify-center">
                  {[["#0ea5e9","Engagement"],["#8b5cf6","Hook"],["#10b981","Virality"]].map(([c,l]) => (
                    <span key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-2 h-2 rounded-full" style={{ background: c }} />{l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Videos",   value: videos.length,    icon: BarChart2,   color: "text-sky-400",     bg: "from-sky-500/10" },
                { label: "Analyzed",       value: complete.length,  icon: CheckCircle, color: "text-emerald-400", bg: "from-emerald-500/10" },
                { label: "Avg Hook Score", value: avg("hook"),      icon: Zap,         color: "text-violet-400",  bg: "from-violet-500/10" },
                { label: "Avg Virality",   value: `${avg("virality")}%`, icon: TrendingUp, color: "text-pink-400", bg: "from-pink-500/10" },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`card-sm bg-gradient-to-b ${s.bg} to-transparent p-4`}>
                  <s.icon size={18} className={`${s.color} mb-2`} />
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
