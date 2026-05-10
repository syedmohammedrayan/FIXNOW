'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

export default function AccountDeletionModal({
  isOpen,
  onClose,
  onConfirm,
  deleting
}: AccountDeletionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-indigo-950/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-indigo-950/95 backdrop-blur-xl border border-rose-500/30 rounded-[2.5rem] p-10 shadow-[0_0_40px_rgba(244,63,94,0.2)] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-orange-500 to-indigo-500" />
            
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(244,63,94,0.15)] transition-all hover:scale-105 duration-300">
              <ShieldAlert className="w-10 h-10 text-rose-400 animate-pulse" />
            </div>
            
            <h3 className="font-display text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-rose-200 text-center mb-4 tracking-tight">Delete Account Permanently?</h3>
            <div className="bg-indigo-950/40 border border-white/10 rounded-2xl p-4 mb-8 backdrop-blur-sm shadow-[inset_0_0_15px_rgba(79,70,229,0.05)]">
              <p className="text-indigo-100 text-center text-sm leading-relaxed font-bold">
                This action is <strong className="text-rose-400">irreversible</strong>. All your profile data, booking history, notifications, and associated records will be wiped from our systems forever.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onConfirm}
                disabled={deleting}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                {deleting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={onClose}
                disabled={deleting}
                className="w-full py-4 bg-indigo-950/60 border border-indigo-500/40 hover:bg-indigo-500/20 text-indigo-200 hover:text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                No, Keep My Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
