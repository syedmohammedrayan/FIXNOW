'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface PaymentSuccessCelebrationProps {
  show: boolean;
}

export default function PaymentSuccessCelebration({ show }: PaymentSuccessCelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 pointer-events-none">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="bg-slate-900/90 backdrop-blur-3xl text-white rounded-[3rem] p-12 text-center shadow-2xl border border-emerald-500/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-emerald-500/5" />
            <CheckCircle2 className="size-24 mx-auto mb-8 text-emerald-400 animate-bounce" />
            <h2 className="text-4xl font-black tracking-tight mb-4 text-white">Service Success!</h2>
            <p className="text-emerald-400 text-lg font-bold opacity-80">Payment Received • Job Completed</p>
            <div className="mt-8 flex justify-center gap-2">
              {[1,2,3,4,5].map(i => (
                <Sparkles key={i} className={`size-6 text-emerald-200 animate-pulse delay-${i*100}`} />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
