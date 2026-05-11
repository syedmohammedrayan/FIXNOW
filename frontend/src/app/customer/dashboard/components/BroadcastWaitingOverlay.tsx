'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Clock, AlertTriangle, RotateCcw, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BroadcastWaitingOverlayProps {
  category: string;
  timerEnd: number | null;
  status: 'waiting' | 'expired' | 'cancelled';
  onCancel: () => void;
  onRetry: () => void;
}

export default function BroadcastWaitingOverlay({
  category,
  timerEnd,
  status,
  onCancel,
  onRetry,
}: BroadcastWaitingOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);

  const TOTAL_DURATION = 10 * 60; // 10 minutes in seconds

  useEffect(() => {
    if (!timerEnd || status !== 'waiting') return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((timerEnd - Date.now()) / 1000));
      setTimeLeft(remaining);
      setProgress((remaining / TOTAL_DURATION) * 100);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timerEnd, status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SVG circle parameters
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (status === 'expired') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-white/[0.04] backdrop-blur-2xl p-5 sm:p-7 md:p-10 relative overflow-hidden border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-rose-500/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
            No Expert Currently Available
          </h3>
          <p className="text-slate-400 text-sm font-medium max-w-md mb-8">
            Unfortunately, no {category} experts were available to accept your request within the time limit. Please try again later.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-[0.15em] text-sm hover:bg-slate-100 transition-all active:scale-[0.98] shadow-2xl shadow-black/40"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-sm hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white/[0.04] backdrop-blur-2xl p-5 sm:p-7 md:p-10 relative overflow-hidden border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl"
    >
      {/* Animated background pulse */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-violet-500/5 pointer-events-none" />
      <motion.div
        className="absolute inset-0 bg-white/[0.03] pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Radar-like scanning animation */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-40 h-40 rounded-full border-2 border-white/10"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-32 h-32 rounded-full border-2 border-white/15"
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
            />
          </div>

          {/* Countdown circle */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
              {/* Track */}
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              {/* Progress */}
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke="url(#timerGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
              </defs>
            </svg>

            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-white tracking-tight tabular-nums">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                remaining
              </span>
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            <Radio className="w-5 h-5 text-white" />
          </motion.div>
          <span className="px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
            Broadcasting Live
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Searching for {category} Expert
        </h3>
        <p className="text-slate-400 text-sm font-medium max-w-md mb-2">
          Your service request has been broadcast to all available {category.toLowerCase()} experts in your area.
          An expert will accept your request shortly.
        </p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-8">
          Payment will be collected after service completion
        </p>

        {/* Scanning dots animation */}
        <div className="flex gap-2 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white/60 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
        >
          <X className="w-3.5 h-3.5" />
          Cancel Request
        </button>
      </div>
    </motion.div>
  );
}
