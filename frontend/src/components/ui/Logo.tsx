'use client';

import React from 'react';
import { Wrench, Sparkles, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  isAdmin?: boolean;
  showText?: boolean;
  textClassName?: string;
  isLanding?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className, 
  iconClassName, 
  isAdmin = false, 
  showText = false,
  textClassName,
  isLanding = false
}) => {
  return (
    <div className={cn("flex items-center gap-3 sm:gap-6 group", className)}>
      <div className="relative">
        {/* Massive Premium Glows */}
        <div className={cn(
          "absolute -inset-12 rounded-full blur-[100px] opacity-0 group-hover:opacity-60 transition-opacity duration-1000",
          isAdmin ? "bg-amber-500/40" : "bg-cyan-500/40"
        )} />
        <div className={cn(
          "absolute -inset-6 rounded-full blur-3xl opacity-30 group-hover:opacity-80 transition-opacity duration-700",
          isAdmin ? "bg-amber-400/20" : "bg-cyan-400/20"
        )} />
        
        <div className={cn(
          "relative flex items-center justify-center size-16 sm:size-28 transition-all duration-700 group-hover:scale-110 group-hover:rotate-1",
          iconClassName
        )}>
          <img 
            src="https://ik.imagekit.io/smr2007/fixnow-logo.png" 
            alt="FIXNOW" 
            className="size-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-700 group-hover:drop-shadow-[0_0_50px_rgba(255,255,255,0.6)]"
            style={{ filter: 'contrast(1.1) brightness(1.1)' }}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col -ml-1 sm:-ml-4">
          <span className={cn(
            "text-2xl sm:text-5xl font-black tracking-[-0.06em] text-white uppercase italic leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] notranslate",
            textClassName
          )}>
            FixNow
          </span>
          <span className={cn(
            "text-[9px] sm:text-xs font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] mt-2 sm:mt-3 opacity-90",
            isAdmin ? "text-amber-500" : "text-cyan-400"
          )}>
            {isAdmin ? 'Command Terminal' : 'Service Ecosystem'}
          </span>
        </div>
      )}
    </div>
  );
};
