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
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center justify-between gap-3 group cursor-default shadow-xl hover:border-white/[0.15] transition-all duration-300 min-h-[80px] sm:min-h-[90px]">
      <div className="min-w-0 flex-1">
        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 truncate">{label}</p>
        <h4 className="text-lg sm:text-2xl lg:text-3xl font-black text-white group-hover:text-slate-100 transition-colors truncate">{value}</h4>
        {trend && (
          <p className="text-[8px] font-bold text-white/30 mt-0.5 uppercase tracking-widest truncate">{trend}</p>
        )}
      </div>
      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center group-hover:bg-white/[0.08] transition-all shrink-0">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-300' })}
      </div>
    </div>
  );
}
