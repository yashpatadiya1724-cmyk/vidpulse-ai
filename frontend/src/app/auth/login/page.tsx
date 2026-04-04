"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Activity, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(form);
      setAuth(data.user, data.access_token);
      router.push("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col px-5 pt-16 pb-8 max-w-sm mx-auto">
      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-sky-500/20">
          <Activity size={26} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="text-gray-500 mt-1.5">Sign in to your account</p>
      </motion.div>

      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onSubmit={submit} className="flex flex-col gap-3 flex-1">
        {/* Email */}
        <div className="card-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <Mail size={18} className="text-gray-500 shrink-0" />
            <input type="email" placeholder="Email address" required autoComplete="email"
              className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-[15px]"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>

        {/* Password */}
        <div className="card-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <Lock size={18} className="text-gray-500 shrink-0" />
            <input type={showPw ? "text" : "password"} placeholder="Password" required
              className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-[15px]"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-600 hover:text-gray-400">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="mt-2">
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-[15px] shadow-lg shadow-sky-500/20">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><span>Sign In</span><ArrowRight size={18} /></>}
          </button>
        </div>

        <div className="flex-1" />

        <p className="text-center text-gray-500 text-sm">
          No account?{" "}
          <Link href="/auth/register" className="text-sky-400 font-semibold">Create one free</Link>
        </p>
      </motion.form>
    </div>
  );
}
