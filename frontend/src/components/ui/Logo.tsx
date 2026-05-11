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
    <div className={cn("flex items-center gap-4 group", className)}>
      <div className="relative">
        {/* Multi-layered Glow */}
        <div className={cn(
          "absolute -inset-6 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000",
          isAdmin ? "bg-amber-500" : "bg-cyan-500"
        )} />
        <div className={cn(
          "absolute -inset-2 rounded-full blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-700",
          isAdmin ? "bg-amber-400/30" : "bg-cyan-400/30"
        )} />
        
        <div className={cn(
          "relative flex items-center justify-center size-12 rounded-[1.25rem] shadow-2xl border transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 overflow-hidden",
          isLanding 
            ? "bg-white/80 backdrop-blur-md border-white/40" 
            : "bg-slate-900/60 backdrop-blur-md border-white/10",
          iconClassName
        )}>
          {/* Inner Gloss Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />
          
          <img 
            src="https://ik.imagekit.io/smr2007/fixnow-logo.png" 
            alt="FIXNOW" 
            className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "text-2xl font-black tracking-tighter text-white uppercase italic leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] notranslate",
            textClassName
          )}>
            FixNow
          </span>
          <span className={cn(
            "text-[9px] font-black uppercase tracking-[0.4em] mt-1.5 opacity-80",
            isAdmin ? "text-amber-500" : "text-cyan-500"
          )}>
            {isAdmin ? 'Command Terminal' : 'Service Ecosystem'}
          </span>
        </div>
      )}
    </div>
  );
};
