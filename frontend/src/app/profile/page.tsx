"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { videosApi } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { Video } from "@/types";
import { User, Mail, Shield, Bell, HelpCircle, LogOut, ChevronRight, Zap, BarChart2, CheckCircle, Copy } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { token, user, logout } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!token) router.push("/auth/login"); }, [token, router]);

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ["videos"], queryFn: videosApi.list, enabled: !!token,
  });

  const complete = videos.filter(v => v.status === "complete");
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const handleLogout = () => { logout(); router.push("/auth/login"); };

  const copyEmail = () => {
    navigator.clipboard.writeText(user?.email || "");
    toast.success("Email copied!");
  };

  const menuItems = [
    { icon: Bell,        label: "Notifications",      sub: "Manage alerts",     color: "text-sky-400",     bg: "bg-sky-400/10" },
    { icon: Shield,      label: "Privacy & Security",  sub: "Password, 2FA",    color: "text-violet-400",  bg: "bg-violet-400/10" },
    { icon: HelpCircle,  label: "Help & Support",      sub: "FAQ, contact us",  color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d14] pb-28">
      <TopBar title="Profile" />
      <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">

        {/* Avatar + info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="card p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-violet-600 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-sky-500/20 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-lg leading-tight">{user?.name}</p>
              <button onClick={copyEmail} className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5 hover:text-gray-300 transition">
                <Mail size={12} /> {user?.email}
                <Copy size={10} className="opacity-50" />
              </button>
            </div>
            <div className="flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-1.5 shrink-0">
              <Zap size={11} className="text-sky-400" />
              <span className="text-xs font-bold text-sky-400 capitalize">{user?.plan || "free"}</span>
            </div>
          </div>

          {/* Account stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#1e1e2e]">
            {[
              { label: "Videos",   value: videos.length,   color: "text-sky-400" },
              { label: "Analyzed", value: complete.length, color: "text-emerald-400" },
              { label: "Plan",     value: user?.plan || "Free", color: "text-violet-400" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Account credentials box */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card p-5">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Your Login Credentials</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#1a1a28] rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <p className="text-sm text-white font-medium">{user?.email}</p>
              </div>
              <button onClick={copyEmail} className="text-gray-600 hover:text-sky-400 transition">
                <Copy size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between bg-[#1a1a28] rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-600">Password</p>
                <p className="text-sm text-white font-medium">••••••••</p>
              </div>
              <button className="text-xs text-sky-400 hover:text-sky-300 transition font-medium">Change</button>
            </div>
            <div className="flex items-center justify-between bg-[#1a1a28] rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-gray-600">Account ID</p>
                <p className="text-xs text-gray-500 font-mono">{user?.id?.slice(0, 16)}...</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Upgrade banner */}
        {user?.plan === "free" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="bg-gradient-to-r from-sky-500/12 via-violet-500/12 to-pink-500/12 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Upgrade to Pro</p>
                <p className="text-xs text-gray-400 mt-0.5">Unlimited videos · Priority AI · PDF exports</p>
              </div>
              <button className="bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition">
                Upgrade
              </button>
            </div>
          </motion.div>
        )}

        {/* Menu */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card overflow-hidden">
          {menuItems.map((item, i) => (
            <button key={item.label}
              className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-white/3 active:bg-white/5 transition ${i < menuItems.length - 1 ? "border-b border-[#1e1e2e]" : ""}`}>
              <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <item.icon size={16} className={item.color} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-gray-600">{item.sub}</p>
              </div>
              <ChevronRight size={14} className="text-gray-700" />
            </button>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <button onClick={handleLogout}
            className="w-full card flex items-center gap-4 px-4 py-4 hover:bg-red-500/5 active:scale-[0.98] transition">
            <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center">
              <LogOut size={16} className="text-red-400" />
            </div>
            <span className="text-sm font-semibold text-red-400">Sign Out</span>
          </button>
        </motion.div>

        <p className="text-center text-xs text-gray-700 pb-2">VidPulse AI v1.0.0 · MIT License</p>
      </div>
      <BottomNav />
    </div>
  );
}
