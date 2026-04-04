"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Activity, Upload, LayoutDashboard, LogOut, User } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const navLink = (href: string, label: string, Icon: any) => (
    <Link href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
        pathname === href ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}>
      <Icon size={15} />{label}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-sky-400 to-violet-500 rounded-lg flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">VidPulse AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {navLink("/dashboard", "Dashboard", LayoutDashboard)}
          {navLink("/upload", "Upload", Upload)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/upload"
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-violet-500 hover:opacity-90 px-4 py-2 rounded-lg text-xs font-semibold transition">
          <Upload size={13} /> Upload Video
        </Link>
        {user && (
          <div className="flex items-center gap-1 ml-1">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-sm text-gray-300">
              <User size={13} className="text-gray-500" />
              {user.name}
            </div>
            <button onClick={handleLogout}
              className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
