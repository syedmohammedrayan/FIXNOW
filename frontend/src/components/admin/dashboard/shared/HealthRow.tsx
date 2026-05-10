import React from 'react';

interface HealthRowProps {
  label: string;
  status: string;
  color: string;
}

export function HealthRow({ label, status, color }: HealthRowProps) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <span className="text-indigo-300 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white font-bold">{status}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${color === 'green' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
      </div>
    </div>
  );
}
