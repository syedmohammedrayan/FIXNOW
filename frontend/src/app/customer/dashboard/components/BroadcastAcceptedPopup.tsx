'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Navigation, X, Star, Phone, Sparkles } from 'lucide-react';
import { BroadcastAcceptedTech } from '../hooks/useBooking';

interface BroadcastAcceptedPopupProps {
  show: boolean;
  technician: BroadcastAcceptedTech | null;
  bookingId: string | null;
  onDismiss: () => void;
  onTrackLive: (bookingId: string) => void;
  onViewBookings: () => void;
}

export default function BroadcastAcceptedPopup({
  show,
  technician,
  bookingId,
  onDismiss,
  onTrackLive,
  onViewBookings,
}: BroadcastAcceptedPopupProps) {
  const [autoDismissTimer, setAutoDismissTimer] = useState(12);

  useEffect(() => {
    if (!show) return;
    setAutoDismissTimer(12);
    const interval = setInterval(() => {
      setAutoDismissTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [show]);

  if (!show || !technician) return null;

  const avatarUrl = technician.avatar;
  const hasRealAvatar = avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/') || avatarUrl.startsWith('data:'));

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl"
            onClick={onDismiss}
          />

          {/* Popup */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/50 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/20 border border-indigo-500/20"
          >
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-violet-500" />

            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="p-8 sm:p-10 flex flex-col items-center text-center">
              {/* Celebration particles */}
              <div className="absolute top-0 left-0 right-0 overflow-hidden h-40 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: `${15 + i * 10}%`,
                      backgroundColor: ['#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#22c55e'][i],
                    }}
                    initial={{ y: -20, opacity: 1 }}
                    animate={{
                      y: [0, 100 + Math.random() * 60],
                      x: [(Math.random() - 0.5) * 80],
                      opacity: [1, 1, 0],
                      scale: [0.5, 1, 0.3],
                      rotate: [0, 360],
                    }}
                    transition={{ duration: 2 + Math.random(), delay: i * 0.15, ease: 'easeOut' }}
                  />
                ))}
              </div>

              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                className="w-20 h-20 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 shadow-xl shadow-emerald-500/10 relative"
              >
                <motion.div
                  className="absolute inset-0 rounded-[1.5rem] bg-emerald-500/20"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <CheckCircle2 className="w-10 h-10 text-emerald-400 relative z-10" />
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2"
              >
                Service Accepted!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 mb-6"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-300 text-sm font-bold">Expert is on the way</span>
              </motion.div>

              {/* Technician Card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full p-5 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center gap-4 mb-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden shrink-0">
                  {hasRealAvatar ? (
                    <img src={avatarUrl!} className="w-full h-full object-cover" alt={technician.name} />
                  ) : (
                    <span className="text-3xl">👷</span>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <h3 className="font-black text-lg text-white truncate">{technician.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-slate-300 font-bold">{technician.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                    {technician.phone && (
                      <>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-400 font-medium">{technician.phone}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full space-y-3"
              >
                <button
                  onClick={() => bookingId && onTrackLive(bookingId)}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-[0.15em] text-sm hover:bg-indigo-50 transition-all active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                >
                  <Navigation className="w-4 h-4" />
                  Track Live Location
                </button>
                <button
                  onClick={onViewBookings}
                  className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-white/5 border border-white/10 text-white/80 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
                >
                  View in My Bookings
                </button>
              </motion.div>

              {/* Auto-dismiss indicator */}
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-6">
                Auto-closing in {autoDismissTimer}s
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
