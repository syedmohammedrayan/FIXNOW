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
          "absolute -inset-4 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000",
          isAdmin ? "bg-amber-500" : "bg-cyan-500"
        )} />
        <div className={cn(
          "absolute -inset-1 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse",
          isAdmin ? "bg-amber-400/30" : "bg-cyan-400/30"
        )} />
        
        <div className={cn(
          "relative flex items-center justify-center size-12 rounded-[1.25rem] shadow-2xl border transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 overflow-hidden",
          isLanding 
            ? "bg-white text-slate-950 border-white/20 group-hover:bg-cyan-600 group-hover:text-white" 
            : "bg-slate-900 text-white border-white/10",
          iconClassName
        )}>
          {/* Inner Gloss Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
          
          {isAdmin ? (
            <Shield className="w-6 h-6 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          ) : (
            <div className="relative">
              <Wrench className="w-6 h-6 text-cyan-400 group-hover:text-white transition-colors drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-bounce shadow-sm" />
            </div>
          )}
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "text-2xl font-black tracking-tighter text-white uppercase italic leading-none drop-shadow-sm notranslate",
            textClassName
          )}>
            FixNow
          </span>
          <span className={cn(
            "text-[9px] font-black uppercase tracking-[0.4em] mt-1",
            isAdmin ? "text-amber-500" : "text-slate-500"
          )}>
            {isAdmin ? 'Terminal' : 'Service Node'}
          </span>
        </div>
      )}
    </div>
  );
};
