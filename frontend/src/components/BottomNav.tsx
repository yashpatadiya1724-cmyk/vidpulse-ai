"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, GitCompare, User } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/upload",    icon: Upload,          label: "Upload" },
  { href: "/compare",   icon: GitCompare,       label: "Compare" },
  { href: "/profile",   icon: User,             label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d14]/96 backdrop-blur-xl border-t border-white/5 bottom-nav">
      <div className="flex items-center justify-around px-2 pt-2 pb-2 max-w-lg mx-auto">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all relative">
              {active && (
                <motion.div layoutId="nav-pill"
                  className="absolute inset-0 bg-sky-500/12 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <Icon size={21} className={active ? "text-sky-400" : "text-gray-600"} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold ${active ? "text-sky-400" : "text-gray-600"}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
