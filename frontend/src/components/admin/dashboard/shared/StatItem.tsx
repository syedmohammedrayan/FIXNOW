import React from 'react';

interface StatItemProps {
  label: string;
  value: any;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

export function StatItem({ label, value, icon, color, trend }: StatItemProps) {
  return (
    <div className="bg-[#0f1115]/80 backdrop-blur-2xl border border-white/[0.06] p-3 sm:p-5 rounded-[1rem] sm:rounded-3xl flex flex-col justify-between gap-2.5 sm:gap-4 group cursor-default shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.6)] hover:border-white/[0.15] transition-all duration-500 min-h-[96px] sm:min-h-[140px] relative overflow-hidden">
      {/* Subtle cinematic gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex items-start justify-between w-full relative z-10 gap-1.5">
        <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-black/40 border border-white/[0.05] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-300 group-hover:text-white transition-colors duration-500' })}
        </div>
        {trend && (
          <span className="text-[7px] sm:text-[9px] font-black text-slate-300 bg-white/[0.03] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full uppercase tracking-widest border border-white/[0.05] backdrop-blur-md whitespace-nowrap">
            {trend}
          </span>
        )}
      </div>
      
      <div className="min-w-0 w-full relative z-10 mt-auto pt-1 sm:pt-0">
        <p className="text-[8px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1.5 truncate group-hover:text-slate-300 transition-colors">{label}</p>
        <h4 className="text-lg sm:text-3xl font-black text-white tracking-tight group-hover:translate-x-1 transition-transform duration-500 truncate">{value}</h4>
      </div>
    </div>
  );
}
