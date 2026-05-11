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
    <div className={cn("flex items-center gap-3 sm:gap-4 group", className)}>
      <div className="relative">
        {/* Subtle Premium Glows */}
        <div className={cn(
          "absolute -inset-6 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000",
          isAdmin ? "bg-amber-500/20" : "bg-cyan-500/20"
        )} />
        <div className={cn(
          "absolute -inset-3 rounded-full blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-700",
          isAdmin ? "bg-amber-400/10" : "bg-cyan-400/10"
        )} />
        
        <div className={cn(
          "relative flex items-center justify-center size-10 sm:size-12 transition-all duration-700 group-hover:scale-110",
          iconClassName
        )}>
          <img 
            src="https://ik.imagekit.io/smr2007/fixnow-logo.png" 
            alt="FIXNOW" 
            className="size-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-700"
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col -ml-1 sm:-ml-1.5">
          <span className={cn(
            "text-xl sm:text-3xl font-black tracking-[-0.04em] text-white uppercase italic leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] notranslate",
            textClassName
          )}>
            FixNow
          </span>
          <span className={cn(
            "text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mt-1 sm:mt-1.5 opacity-80",
            isAdmin ? "text-amber-500" : "text-cyan-400"
          )}>
            {isAdmin ? 'Command Terminal' : 'Service Ecosystem'}
          </span>
        </div>
      )}
    </div>
  );
};
