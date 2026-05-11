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
    <div className={cn("flex items-center gap-5 group", className)}>
      <div className="relative">
        {/* Multi-layered Glow */}
        <div className={cn(
          "absolute -inset-8 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-1000",
          isAdmin ? "bg-amber-500" : "bg-cyan-500"
        )} />
        <div className={cn(
          "absolute -inset-4 rounded-full blur-2xl opacity-20 group-hover:opacity-70 transition-opacity duration-700",
          isAdmin ? "bg-amber-400/30" : "bg-cyan-400/30"
        )} />
        
        <div className={cn(
          "relative flex items-center justify-center size-16 rounded-[1.5rem] shadow-2xl border transition-all duration-700 group-hover:scale-110 group-hover:rotate-2 overflow-hidden",
          isLanding 
            ? "bg-white/90 backdrop-blur-md border-white/40" 
            : "bg-slate-900/40 backdrop-blur-md border-white/10",
          iconClassName
        )}>
          {/* Inner Gloss Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-60" />
          
          <img 
            src="https://ik.imagekit.io/smr2007/fixnow-logo.png" 
            alt="FIXNOW" 
            className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-transform duration-700 group-hover:scale-110"
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "text-3xl font-black tracking-tighter text-white uppercase italic leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] notranslate",
            textClassName
          )}>
            FixNow
          </span>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-90",
            isAdmin ? "text-amber-500" : "text-cyan-400"
          )}>
            {isAdmin ? 'Command Terminal' : 'Service Ecosystem'}
          </span>
        </div>
      )}
    </div>
  );
};
