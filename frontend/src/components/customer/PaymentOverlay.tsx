'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, QrCode, Smartphone, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/lib/config';

interface PaymentOverlayProps {
  bookingId: string;
  totalAmount: number;
  onPaymentComplete: () => void;
}

export default function PaymentOverlay({ bookingId, totalAmount, onPaymentComplete }: PaymentOverlayProps) {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayNow = async () => {
    setProcessing(true);
    // Simulate payment gateway delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    try {
      await axios.post(`${API_BASE}/api/bookings/update-status`, {
        bookingId,
        status: "Completed",
        isPaid: true
      });
      
      setProcessing(false);
      setSuccess(true);
      
      setTimeout(() => {
        onPaymentComplete();
      }, 1500);
    } catch (err) {
      console.error('Failed to complete payment', err);
      setProcessing(false);
      alert('Payment processing failed. Please try again.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[250] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-12 font-sans"
    >
      {success ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="size-32 rounded-full bg-emerald-500/20 flex items-center justify-center mb-8 border border-emerald-500/30">
            <CheckCircle2 className="size-16 text-emerald-400" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight uppercase">Payment Successful</h2>
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Secure Transaction Confirmed</p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-lg bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Digital Settlement</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Secure Payment Gateway</p>
            </div>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Total Amount Due</p>
              <p className="text-6xl font-black text-white tracking-tighter">₹{totalAmount}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button 
                onClick={handlePayNow}
                disabled={processing}
                className="p-6 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                <div className="size-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Smartphone className="size-6 text-cyan-400" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest text-center">Pay via UPI</span>
              </button>
              
              <button 
                onClick={handlePayNow}
                disabled={processing}
                className="p-6 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                <div className="size-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <CreditCard className="size-6 text-amber-400" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest text-center">Credit / Debit</span>
              </button>
            </div>
            
            <button
              onClick={handlePayNow}
              disabled={processing}
              className="mt-6 w-full py-5 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center shadow-xl active:scale-95 disabled:opacity-50"
            >
              {processing ? <Loader2 className="size-5 animate-spin" /> : 'Pay Instantly Now'}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
