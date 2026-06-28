'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WorkflowStep = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
};

interface AIWorkflowTimelineProps {
  steps: WorkflowStep[];
  className?: string;
}

export default function AIWorkflowTimeline({ steps, className }: AIWorkflowTimelineProps) {
  return (
    <div className={cn('flex items-center gap-0 w-full', className)} role="progressbar" aria-label="AI Workflow Progress">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            {/* Step node */}
            <motion.div
              className="flex flex-col items-center gap-1.5 min-w-0"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.35 }}
            >
              <div
                className={cn(
                  'w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 flex items-center justify-center transition-all duration-500',
                  step.status === 'complete' && 'ai-step-complete',
                  step.status === 'active' && 'ai-step-active',
                  step.status === 'pending' && 'ai-step-pending'
                )}
              >
                {step.status === 'complete' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                )}
                {step.status === 'active' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {step.status === 'pending' && (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              <span className={cn(
                'text-[8px] sm:text-[9px] font-bold uppercase tracking-widest whitespace-nowrap',
                step.status === 'complete' && 'text-emerald-400',
                step.status === 'active' && 'text-violet-400',
                step.status === 'pending' && 'text-slate-600'
              )}>
                {step.label}
              </span>
            </motion.div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 h-0.5 mx-1 sm:mx-2 rounded-full overflow-hidden bg-white/[0.06] self-start mt-4 sm:mt-[18px]">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    step.status === 'complete' ? 'bg-emerald-500/50' : 'bg-transparent'
                  )}
                  initial={{ width: '0%' }}
                  animate={{ width: step.status === 'complete' ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.15 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
