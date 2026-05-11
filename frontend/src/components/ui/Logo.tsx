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
        "relative flex items-center shrink-0",
        className
      )}
    >
      {/* Glow */}
      <div
        className={cn(
          "absolute inset-0 blur-3xl opacity-20 scale-110",
          isAdmin ? "bg-amber-500/20" : "bg-cyan-500/20"
        )}
      />

      <img
        src="https://ik.imagekit.io/smr2007/fixnow-logo-colored.svg"
        alt="FIXNOW"
        draggable={false}
        className={cn(
          "relative h-auto object-contain transition-transform duration-500 hover:scale-[1.03] select-none",
          iconClassName || "w-[170px] sm:w-[210px] md:w-[240px] lg:w-[280px]"
        )}
      />
    </div>
  );
};
