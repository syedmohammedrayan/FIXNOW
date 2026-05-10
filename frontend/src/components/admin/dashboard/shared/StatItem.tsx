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
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex items-center justify-between group cursor-default shadow-xl">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <h4 className="text-3xl font-black text-white group-hover:text-cyan-400 transition-colors">{value}</h4>
        {trend && <p className="text-[10px] font-bold text-cyan-400/70 mt-1 uppercase tracking-widest">{trend}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
    </div>
  );
}
