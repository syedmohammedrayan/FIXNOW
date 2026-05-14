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
    cyan: "text-indigo-400 bg-indigo-500/10 border-indigo-500/10 shadow-indigo-500/5",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10 shadow-emerald-500/5",
    white: "text-white bg-white/5 border-white/10 shadow-white/5",
    slate: "text-slate-400 bg-white/5 border-white/10 shadow-white/5",
  };

  const dotColors: Record<string, string> = {
    cyan: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]",
    emerald: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]",
    white: "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]",
    slate: "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.5)]",
  };

  return (
    <div className="bg-[#0B0F1A]/60 backdrop-blur-3xl p-4 sm:p-6 lg:p-7 border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col justify-between group hover:border-white/10 hover:bg-[#0B0F1A]/80 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] transition-all duration-700 sm:min-h-[180px] relative min-h-[140px]">
      {/* Cinematic Ambient Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] blur-[40px] -mr-16 -mt-16 group-hover:bg-indigo-500/[0.06] transition-all duration-700 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/[0.02] blur-[30px] -ml-12 -mb-12 group-hover:bg-emerald-500/[0.04] transition-all duration-700 pointer-events-none" />

      <div className="flex justify-between items-start relative z-10">
        <div
          className={cn(
            "p-2.5 sm:p-4 rounded-xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
            colors[color] || colors.slate,
          )}
        >
          {icon}
        </div>

        {/* Live Indicator */}
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.05] px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full backdrop-blur-md">
          <span className={cn("size-1.5 sm:size-2 rounded-full animate-pulse", dotColors[color] || dotColors.slate)} />
          <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest hidden sm:inline-block">Sync</span>
        </div>
      </div>

      <div className="relative z-10 mt-auto pt-4 sm:pt-6">
        <p className="text-xl sm:text-2xl lg:text-4xl font-black text-white tracking-tighter truncate leading-none mb-1 sm:mb-1.5 italic">
          {value}
        </p>
        <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest truncate mb-2 sm:mb-3 opacity-70">
          {label}
        </p>

        <div
          className={cn(
            "inline-block text-[8px] sm:text-[9px] font-black px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border transition-all",
            trend.includes("+") || trend.includes("High") || trend.includes("Ready") || trend.includes("ONLINE") || trend.includes("Verified")
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20"
              : "text-slate-400 bg-white/5 border-white/5 group-hover:bg-white/10",
          )}
        >
          {trend}
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
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">
          {label}
        </span>
        <span className="text-xs font-black text-white">{value}</span>
      </div>
      <div className="h-2 bg-white/5 backdrop-blur-md rounded-full overflow-hidden p-0.5 border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)]"
        />
      </div>
    </div>
  );
}

import { Briefcase, ChevronRight } from "lucide-react";
import Link from "next/link";

export function ServiceManifest({ activeJobsCount }: { activeJobsCount: number }) {
  return (
    <div className="p-8 relative overflow-hidden group min-h-[340px] flex flex-col justify-between border border-white/5 rounded-[3rem] shadow-2xl bg-[#0B0F1A]/60 backdrop-blur-3xl hover:bg-[#0B0F1A]/80 transition-all duration-700">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] blur-[80px] -mr-32 -mt-32 group-hover:bg-indigo-500/[0.08] transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/[0.02] blur-[60px] -ml-24 -mb-24 group-hover:bg-emerald-500/[0.05] transition-all duration-700" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="size-14 rounded-2xl bg-white/5 border border-white/10 shadow-inner flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                Protocol Active
              </span>
            </div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
              Node: 402-ALPHA
            </span>
          </div>
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight mb-2 italic uppercase">
          Service Manifest
        </h3>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-10 leading-relaxed max-w-[280px]">
          Command center for mission critical assignments & field logistics.
        </p>

        {/* Micro-stats for richness */}
        <div className="flex items-center gap-6 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
              Active Jobs
            </p>
            <p className="text-xl font-black text-white">
              {activeJobsCount}
            </p>
          </div>
          <div className="w-px h-8 bg-white/5 backdrop-blur-md" />
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
              Avg. ETA
            </p>
            <p className="text-xl font-black text-white">12m</p>
          </div>
          <div className="w-px h-8 bg-white/5 backdrop-blur-md" />
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
              Reliability
            </p>
            <p className="text-xl font-black text-emerald-400">99.8%</p>
          </div>
        </div>
      </div>

      <Link
        href="/technician/bookings"
        className="relative z-10 w-full mt-8 inline-flex items-center justify-between bg-white text-slate-950 pl-8 pr-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-2xl group/btn"
      >
        <span>Initialize Console</span>
        <div className="size-8 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
          <ChevronRight className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
}

