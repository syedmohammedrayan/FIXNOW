"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Briefcase, CalendarCheck } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  color: string;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  color,
}: StatCardProps) {
  const colors: Record<string, string> = {
    indigo:
      "text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-200/50",
    emerald:
      "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-200/50",
    sky: "text-sky-600 bg-sky-50 border-sky-100 shadow-sky-200/50",
    slate: "text-slate-600 bg-slate-50 border-slate-100 shadow-slate-200/50",
  };

  return (
    <div className="glass-neon-card p-4 sm:p-6 lg:p-7 flex items-center justify-between group hover:border-indigo-500/30 overflow-hidden">
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
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter truncate">
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

interface MetricRowProps {
  label: string;
  value: string;
  progress: number;
}

export function MetricRow({
  label,
  value,
  progress,
}: MetricRowProps) {
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
          {label}
        </span>
        <span className="text-xs font-black text-slate-900">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
        />
      </div>
    </div>
  );
}
