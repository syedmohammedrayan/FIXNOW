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
          'w-full flex items-center gap-3 rounded-[14px] transition-all duration-200 group relative',
          // Touch target: minimum 48px height
          'min-h-[48px] px-3',
          // Active vs default
          active
            ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
        )}
      >
        {/* Active left indicator bar */}
        {active && (
          <motion.div
            layoutId="adminSidebarActive"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-blue-600"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}

        {/* Icon */}
        <span className={cn(
          'shrink-0 flex items-center justify-center transition-all duration-200',
          active
            ? 'text-blue-600'
            : 'text-slate-400 group-hover:text-slate-700'
        )}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-[18px] h-[18px]' })}
        </span>

        {/* Label */}
        <AnimatePresence>
          {open && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'flex-1 text-[13px] font-semibold tracking-wide text-left truncate',
                active ? 'text-blue-700' : 'text-slate-600 group-hover:text-slate-900'
              )}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge count */}
        {count !== undefined && count > 0 && (
          <span className={cn(
            'shrink-0 min-w-[20px] h-5 px-1.5 rounded-md text-[10px] font-black flex items-center justify-center',
            open ? '' : 'absolute -top-1 -right-1',
            active
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-rose-100 text-rose-600 border border-rose-200'
          )}>
            {count}
          </span>
        )}
      </button>

      {/* Tooltip when collapsed (desktop only) */}
      <AnimatePresence>
        {!open && hovered && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[200] pointer-events-none"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-xl whitespace-nowrap">
              <span className="text-xs font-bold text-slate-900">{label}</span>
              {count !== undefined && count > 0 && (
                <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">{count}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
