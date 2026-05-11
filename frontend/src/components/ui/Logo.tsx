'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  isAdmin?: boolean;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  iconClassName,
  isAdmin = false,
  showText = true, // Default to true now as requested
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-4 group",
        className
      )}
    >
      <div className="relative flex-shrink-0">
        {/* Premium Glow Effects */}
        <div
          className={cn(
            "absolute -inset-8 rounded-full blur-[70px] opacity-0 group-hover:opacity-60 transition-all duration-700",
            isAdmin ? "bg-amber-500/30" : "bg-cyan-500/30"
          )}
        />

        <div
          className={cn(
            "absolute -inset-4 rounded-full blur-2xl opacity-20 group-hover:opacity-70 transition-all duration-700",
            isAdmin ? "bg-amber-400/20" : "bg-cyan-400/20"
          )}
        />

        {/* Logo Icon */}
        <div
          className={cn(
            "relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 transition-all duration-700 group-hover:scale-110 group-hover:rotate-3",
            iconClassName
          )}
        >
          <img
            src="https://ik.imagekit.io/smr2007/fixnow-logo-colored.svg"
            alt="FIXNOW"
            className="w-full h-full object-contain select-none filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            draggable={false}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col -space-y-1 sm:-space-y-2">
          <span className="text-2xl sm:text-4xl font-black text-white uppercase italic tracking-tighter leading-none transition-all duration-500 group-hover:tracking-normal drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
            FixNow
          </span>
          <div className="flex items-center gap-1.5 opacity-60">
            <span className={cn(
              "size-1 rounded-full animate-pulse",
              isAdmin ? "bg-amber-500" : "bg-cyan-500"
            )} />
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-white transition-colors duration-500">
              {isAdmin ? 'System Terminal' : 'Service Ecosystem'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
