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
    <div className="glass-neon-card p-6 flex items-center justify-between group cursor-default">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <h4 className="text-3xl font-black text-white group-hover:text-indigo-600 transition-colors">{value}</h4>
        {trend && <p className="text-[10px] font-bold text-indigo-300 mt-1">{trend}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl glass-panel border-white/10 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
      </div>
    </div>
  );
}
