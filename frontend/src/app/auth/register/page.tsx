"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Activity, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.register(form);
      setAuth(data.user, data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] flex flex-col px-5 pt-16 pb-8 max-w-sm mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-violet-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-sky-500/20">
          <Activity size={26} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Create account</h1>
        <p className="text-gray-500 mt-1.5">Start analyzing your videos for free</p>
      </motion.div>

      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onSubmit={submit} className="flex flex-col gap-3 flex-1">
        <div className="card-sm">
          <div className="flex items-center gap-3 px-4 py-4">
            <User size={18} className="text-gray-500 shrink-0" />
            <input type="text" placeholder="Full name" required
              className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-[15px]"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
        </div>
        <div className="card-sm">
          <div className="flex items-center gap-3 px-4 py-4">
            <Mail size={18} className="text-gray-500 shrink-0" />
            <input type="email" placeholder="Email address" required autoComplete="email"
              className="flex-1 bg-transparent text-white placeholder-gray-600 focus:outline-none text-[15px]"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div className="card-sm">
          <div className="flex items-center gap-3 px-4 py-4">
            <Lock size={18} className="text-gray-500 shrink-0" />
            <input type={showPw ? "text" : "password"} placeholder="Password (min 8 chars)" required minLength={8}
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
              : <><span>Create Account</span><ArrowRight size={18} /></>}
          </button>
        </div>

        <div className="flex-1" />
        <p className="text-center text-gray-500 text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-sky-400 font-semibold">Sign in</Link>
        </p>
      </motion.form>
    </div>
  );
}
