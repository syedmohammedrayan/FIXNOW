import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function StatCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  trend: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    indigo:
      "text-slate-900 bg-slate-50 border-slate-200 shadow-slate-200/50",
    emerald:
      "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-200/50",
    sky: "text-sky-600 bg-sky-50 border-sky-100 shadow-sky-200/50",
    slate: "text-slate-400 glass-panel border-white/10 border-slate-100 shadow-slate-200/50",
  };

  return (
    <div className="glass-neon-card p-4 sm:p-6 lg:p-7 flex items-center justify-between group hover:border-slate-900/30 overflow-hidden">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        <div
          className={cn(
            "p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0",
            colors[color] || colors.slate,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 truncate">
            {label}
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tighter truncate">
            {value}
          </p>
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 ml-2">
        <span
          className={cn(
            "text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded-full border shadow-sm",
            trend.includes("+") || trend.includes("High")
              ? "text-emerald-600 bg-emerald-50 border-emerald-100"
              : "text-rose-600 bg-rose-50 border-rose-100",
          )}
        >
          {trend}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            Live
          </span>
        </div>
      </div>
    </div>
  );
}

export function MetricRow({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
          {label}
        </span>
        <span className="text-xs font-black text-white">{value}</span>
      </div>
      <div className="h-2 bg-slate-800/40 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-slate-200/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-slate-900 rounded-full shadow-[0_0_10px_rgba(15,23,42,0.3)]"
        />
      </div>
    </div>
  );
}

import { Briefcase, ChevronRight } from "lucide-react";
import Link from "next/link";

export function ServiceManifest({ activeJobsCount }: { activeJobsCount: number }) {
  return (
    <div className="glass-neon-card p-8 relative overflow-hidden group min-h-[340px] flex flex-col justify-between border-none glass-panel border-white/80 shadow-[0_20px_50px_rgba(79,70,229,0.08)]">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] blur-[80px] -mr-32 -mt-32 group-hover:bg-indigo-500/[0.08] transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/[0.02] blur-[60px] -ml-24 -mb-24 group-hover:bg-emerald-500/[0.05] transition-all duration-700" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="size-14 rounded-2xl glass-panel border-white/10 shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                Protocol Active
              </span>
            </div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              Node: 402-ALPHA
            </span>
          </div>
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight mb-2">
          Service Manifest
        </h3>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-10 leading-relaxed max-w-[280px]">
          Command center for mission critical assignments & field logistics.
        </p>

        {/* Micro-stats for richness */}
        <div className="flex items-center gap-6 pb-6 border-b border-slate-50">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              Active Jobs
            </p>
            <p className="text-xl font-black text-white">
              {activeJobsCount}
            </p>
          </div>
          <div className="w-px h-8 bg-slate-800/40 backdrop-blur-md" />
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              Avg. ETA
            </p>
            <p className="text-xl font-black text-white">12m</p>
          </div>
          <div className="w-px h-8 bg-slate-800/40 backdrop-blur-md" />
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              Reliability
            </p>
            <p className="text-xl font-black text-emerald-600">99.8%</p>
          </div>
        </div>
      </div>

      <Link
        href="/technician/bookings"
        className="relative z-10 w-full mt-8 inline-flex items-center justify-between bg-slate-900 text-white pl-8 pr-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/30 group/btn"
      >
        <span>Initialize Console</span>
        <div className="size-8 rounded-xl glass-panel border-white/10 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
          <ChevronRight className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
}

