import React from 'react';

interface StatItemProps {
  label: string;
  value: any;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

export function StatItem({ label, value, icon, color, trend }: StatItemProps) {
  // Generate a random sparkline for visual effect (since we can't use real chart library per requirements)
  const isPositive = trend?.includes('+') || trend?.includes('Up');
  const strokeColor = isPositive ? '#10b981' : (trend?.includes('-') ? '#ef4444' : '#64748b');
  
  return (
    <div className="card-stat flex flex-col justify-between gap-3 group relative overflow-hidden min-h-[140px]">
      <div className="flex items-start justify-between w-full relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:bg-white/[0.08] transition-colors duration-300">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4 text-slate-300 group-hover:text-white transition-colors duration-300' })}
        </div>
        {trend && (
          <span className="badge badge-neutral bg-white/[0.03]">
            {trend}
          </span>
        )}
      </div>
      
      <div className="min-w-0 w-full relative z-10 mt-auto">
        <p className="text-overline text-slate-400 mb-1 truncate">{label}</p>
        <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">{value}</h4>
      </div>

      {/* Decorative Sparkline */}
      <div className="absolute bottom-0 left-0 w-full h-12 opacity-30 pointer-events-none">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
          <path 
            d={isPositive ? "M0,30 L20,20 L40,25 L60,10 L80,15 L100,5" : "M0,30 L20,25 L40,15 L60,20 L80,10 L100,15"} 
            fill="none" 
            stroke={strokeColor} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d={isPositive ? "M0,30 L20,20 L40,25 L60,10 L80,15 L100,5 L100,30 L0,30 Z" : "M0,30 L20,25 L40,15 L60,20 L80,10 L100,15 L100,30 L0,30 Z"} 
            fill={`url(#gradient-${label.replace(/\s+/g, '-')})`} 
          />
          <defs>
            <linearGradient id={`gradient-${label.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
