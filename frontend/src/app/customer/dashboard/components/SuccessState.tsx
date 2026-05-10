'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import Script from 'next/script';

import { Technician } from '../types';

interface SuccessStateProps {
  bookingConfirmation: any;
  selectedTech: Technician | null;
  onNewRequest: () => void;
  onTrack: (id: string) => void;
  userId?: string;
}

export default function SuccessState({
  bookingConfirmation,
  selectedTech,
  onNewRequest,
  onTrack,
  userId
}: SuccessStateProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-slate-50 font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-slate-200/80 p-8 sm:p-10 rounded-3xl text-center max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col items-center"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.03] blur-[40px] -mr-16 -mt-16" />
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 border border-emerald-100">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">Booking confirmed</h2>
        <p className="text-slate-600 mb-2 font-medium text-sm">
          Order Reference{' '}
          <span className="text-indigo-600 font-bold">#{bookingConfirmation.id?.slice(-6).toUpperCase()}</span>
        </p>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 my-6 flex flex-col items-center justify-center w-full">
           <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1 leading-snug">Your Service OTP</span>
           <span className="text-3xl font-black text-emerald-800 tracking-[0.25em] py-1">{bookingConfirmation.otp || '----'}</span>
           <p className="text-[11px] text-emerald-700/80 mt-2 font-semibold">Share this with the technician to start the job.</p>
        </div>

        <div className="flex flex-col items-center gap-2 mb-8">
          <p className="text-slate-600 font-medium text-sm">
            Technician <strong className="text-slate-900 font-bold">{selectedTech?.name}</strong> is on the way.
          </p>
          {selectedTech?.avatar && (
             <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-md">
                {selectedTech.avatar.startsWith('data:image') || selectedTech.avatar.startsWith('http') || selectedTech.avatar.startsWith('/') ? (
                  <img src={selectedTech.avatar} className="w-full h-full object-cover" alt={selectedTech.name} />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xl">{selectedTech.avatar}</div>
                )}
             </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => onTrack(bookingConfirmation.id)}
          className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition duration-200 uppercase tracking-wider text-xs"
        >
          Live tracking
        </button>
        <button
          type="button"
          onClick={onNewRequest}
          className="w-full mt-3 py-3 rounded-xl font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition duration-200 text-xs uppercase tracking-wider"
        >
          New service request
        </button>
      </motion.div>

    </div>
  );
}
