import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
  open: boolean;
}

export function SidebarLink({ icon, label, active, count, onClick, open }: SidebarLinkProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          // Layout
          'w-full flex items-center gap-3 rounded-[1.25rem] transition-all duration-300 group relative overflow-hidden',
          // Touch target: minimum 48px height
          'min-h-[52px] px-4',
          // Active vs default
          active
            ? 'bg-cyan-500/10 text-white border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
            : 'text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent'
        )}
      >
        {/* Active side indicator */}
        {active && (
          <motion.div
            layoutId="adminSidebarActive"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-7 rounded-r-full bg-cyan-500 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        )}

        {/* Icon wrapper */}
        <span className={cn(
          'shrink-0 flex items-center justify-center transition-all duration-300',
          active
            ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
            : 'text-slate-500 group-hover:text-cyan-400/80'
        )}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-[19px] h-[19px]' })}
        </span>

        {/* Label */}
        <AnimatePresence mode="wait">
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                'flex-1 text-[11px] font-black uppercase tracking-[0.15em] text-left truncate',
                active ? 'text-white' : 'text-slate-400 group-hover:text-white'
              )}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge count */}
        {count !== undefined && count > 0 && (
          <span className={cn(
            'shrink-0 min-w-[22px] h-5 px-1.5 rounded-lg text-[9px] font-black flex items-center justify-center transition-all duration-300',
            open ? '' : 'absolute -top-1 -right-1',
            active
              ? 'bg-cyan-500 text-slate-950'
              : 'bg-white/[0.08] text-cyan-400 border border-white/[0.1]'
          )}>
            {count}
          </span>
        )}

        {/* Hover background splash */}
        {!active && hovered && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none" />
        )}
      </button>

      {/* Tooltip when collapsed (desktop only) */}
      <AnimatePresence>
        {!open && hovered && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-4 z-[200] pointer-events-none"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/90 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl whitespace-nowrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">{label}</span>
              {count !== undefined && count > 0 && (
                <span className="text-[9px] font-black text-slate-950 bg-cyan-500 px-1.5 py-0.5 rounded-md">{count}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
