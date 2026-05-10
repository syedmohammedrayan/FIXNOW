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
            className="bg-emerald-600 text-white rounded-[3rem] p-12 text-center shadow-[0_20px_60px_rgba(16,185,129,0.4)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <CheckCircle2 className="size-24 mx-auto mb-8 text-white animate-bounce" />
            <h2 className="text-4xl font-black tracking-tight mb-4">Service Success!</h2>
            <p className="text-emerald-50 text-lg font-bold opacity-80">Payment Received • Job Completed</p>
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
