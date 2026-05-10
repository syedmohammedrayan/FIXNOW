'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

interface ActiveJobBannerProps {
  activeJob: any;
  onTrack: (id: string) => void;
}

export default function ActiveJobBanner({ activeJob, onTrack }: ActiveJobBannerProps) {
  return (
    <AnimatePresence>
      {activeJob && activeJob.status !== 'Completed' && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
        >
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-6 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="size-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <div className="relative">
                  <Activity className="size-6 text-white" />
                  <div className="absolute -top-1 -right-1 size-2 bg-emerald-400 rounded-full animate-ping" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Live Status: {activeJob.status}</p>
                <h4 className="text-sm font-black text-white tracking-tight">{activeJob.category} Service In Progress</h4>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <button 
                onClick={() => onTrack(activeJob.id)}
                className="px-5 py-3 glass-panel text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition shadow-sm"
              >
                Track Live
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
