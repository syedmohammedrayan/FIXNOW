'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  isAdmin?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  iconClassName,
  isAdmin = false,
}) => {
  return (
    <div
      className={cn(
        "flex items-center group",
        className
      )}
    >
      <div className="relative">
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

        {/* Logo */}
        <div
          className={cn(
            "relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 transition-all duration-700 group-hover:scale-105",
            iconClassName
          )}
        >
          <img
            src="https://ik.imagekit.io/smr2007/fixnow-logo-colored.svg"
            alt="FIXNOW"
            className="w-full h-full object-contain select-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};
