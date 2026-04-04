"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
}

export function TopBar({ title, subtitle, back, right }: Props) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-40 bg-[#0d0d14]/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {back && (
            <button onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center active:scale-95 transition">
              <ChevronLeft size={20} className="text-gray-300" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {right && <div>{right}</div>}
      </div>
    </div>
  );
}
