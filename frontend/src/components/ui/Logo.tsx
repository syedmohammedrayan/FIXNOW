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
    <div className={cn("flex items-center gap-4 sm:gap-8 group", className)}>
      <div className="relative">
        {/* Legendary Premium Glows */}
        <div className={cn(
          "absolute -inset-16 rounded-full blur-[120px] opacity-0 group-hover:opacity-70 transition-opacity duration-1000",
          isAdmin ? "bg-amber-500/50" : "bg-cyan-500/50"
        )} />
        <div className={cn(
          "absolute -inset-8 rounded-full blur-4xl opacity-40 group-hover:opacity-90 transition-opacity duration-700",
          isAdmin ? "bg-amber-400/30" : "bg-cyan-400/30"
        )} />
        
        <div className={cn(
          "relative flex items-center justify-center size-24 sm:size-44 transition-all duration-700 group-hover:scale-110 group-hover:rotate-1",
          iconClassName
        )}>
          <img 
            src="https://ik.imagekit.io/smr2007/fixnow-logo.png" 
            alt="FIXNOW" 
            className="size-full object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-all duration-700 group-hover:drop-shadow-[0_0_70px_rgba(255,255,255,0.7)]"
            style={{ filter: 'contrast(1.15) brightness(1.15)' }}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col -ml-2 sm:-ml-6">
          <span className={cn(
            "text-3xl sm:text-7xl font-black tracking-[-0.08em] text-white uppercase italic leading-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] notranslate",
            textClassName
          )}>
            FixNow
          </span>
          <span className={cn(
            "text-[10px] sm:text-sm font-black uppercase tracking-[0.5em] sm:tracking-[0.6em] mt-3 sm:mt-5 opacity-90",
            isAdmin ? "text-amber-500" : "text-cyan-400"
          )}>
            {isAdmin ? 'Command Terminal' : 'Service Ecosystem'}
          </span>
        </div>
      )}
    </div>
  );
};
