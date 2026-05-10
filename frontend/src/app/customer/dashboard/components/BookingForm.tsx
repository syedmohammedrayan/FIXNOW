'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Smartphone, Clock, X, User } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Technician, AnalysisResult } from '../types';

interface BookingFormProps {
  selectedTech: Technician;
  analysisResult: AnalysisResult | null;
  address: string;
  setAddress: (v: string) => void;
  contactNumber: string;
  setContactNumber: (v: string) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  serviceTime: string;
  setServiceTime: (v: string) => void;
  paymentMethod: 'now' | 'later';
  setPaymentMethod: (v: 'now' | 'later') => void;
  onConfirm: () => void;
  onCancel: () => void;
  analyzing: boolean;
  addressInputRef: React.RefObject<HTMLInputElement>;
}

export default function BookingForm({
  selectedTech,
  analysisResult,
  address,
  setAddress,
  contactNumber,
  setContactNumber,
  customerName,
  setCustomerName,
  serviceTime,
  setServiceTime,
  paymentMethod,
  setPaymentMethod,
  onConfirm,
  onCancel,
  analyzing,
  addressInputRef
}: BookingFormProps) {
  useEffect(() => {
    if (selectedTech.online === false && paymentMethod === 'now') {
      setPaymentMethod('later');
    }
  }, [selectedTech.online, paymentMethod, setPaymentMethod]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-2xl mx-auto bg-transparent font-sans">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/90 backdrop-blur-3xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] blur-[60px] -mr-32 -mt-32" />
        <button type="button" onClick={onCancel} className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors mb-8 flex items-center gap-2">
          <X className="w-3.5 h-3.5" /> Cancel & Back
        </button>
        <h2 className="text-3xl font-black text-white mb-8 tracking-tight">Confirm Request</h2>
        
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-8 flex items-center gap-5 shadow-sm">
          <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-500">
            {selectedTech.avatar && (selectedTech.avatar.startsWith('data:image') || selectedTech.avatar.startsWith('http') || selectedTech.avatar.startsWith('/')) ? (
            <div className="relative size-full">
              <img src={selectedTech.avatar} className="w-full h-full object-cover transition-all duration-500" />
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />
            </div>
            ) : (
              <span className="text-3xl drop-shadow-sm transition-all duration-500">{selectedTech.avatar || '👷'}</span>
            )}
          </div>
          <div>
            <h3 className="font-black text-lg text-white">{selectedTech.name}</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
              {selectedTech.category} • ⭐ {selectedTech.rating} • 📍 {selectedTech.distance}
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          {/* Personal Identity Section */}
          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Personal Identity</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                className="w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-12 py-4 text-white focus:outline-none focus:border-white/30 focus:ring-4 focus:ring-white/5 transition font-medium shadow-sm placeholder:text-slate-500"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
          </div>

          {/* Service Location Section */}
          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Service Location</label>
            <div className="relative">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                ref={addressInputRef}
                type="text"
                className="w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-12 py-4 text-white focus:outline-none focus:border-white/30 focus:ring-4 focus:ring-white/5 transition font-medium shadow-sm placeholder:text-slate-500"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Complete service address..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Contact Line */}
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Contact Line</label>
              <div className="relative">
                <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="tel"
                  className="w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-12 py-4 text-white focus:outline-none focus:border-white/30 focus:ring-4 focus:ring-white/5 transition font-medium shadow-sm placeholder:text-slate-500"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Mobile No."
                />
              </div>
            </div>

            {/* Protocol Timestamp (Auto-fetched) */}
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2 block">Protocol Timestamp</label>
              <div className="relative group">
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 group-hover:rotate-12 transition-transform" />
                <div className="w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-12 py-4 text-slate-400 font-bold text-[13px] shadow-inner select-none cursor-default">
                  {serviceTime}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-10">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 mb-4">Transaction Protocol</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled={selectedTech.online === false}
              onClick={() => setPaymentMethod('now')}
              className={`p-5 rounded-[1.5rem] border-2 text-left transition-all relative overflow-hidden group ${
                selectedTech.online === false
                  ? 'border-white/5 bg-white/5 cursor-not-allowed opacity-50'
                  : paymentMethod === 'now'
                  ? 'border-white bg-white/10 shadow-2xl shadow-black/40'
                  : 'border-white/10 bg-white/5 text-slate-500 hover:border-white/30'
              }`}
            >
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center mb-3 transition-colors", paymentMethod === 'now' && selectedTech.online !== false ? "border-white" : "border-white/20")}>{paymentMethod === 'now' && selectedTech.online !== false && <div className="w-2.5 h-2.5 bg-white rounded-full" />}</div>
              <p className={cn("font-black text-sm uppercase tracking-wider transition-colors", paymentMethod === 'now' && selectedTech.online !== false ? "text-white" : "text-slate-500")}>Online Payment</p>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", paymentMethod === 'now' && selectedTech.online !== false ? "text-indigo-600/80" : "text-slate-400")}>{selectedTech.online === false ? 'Unavailable (Offline)' : 'Instant Activation'}</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('later')}
              className={`p-5 rounded-[1.5rem] border-2 text-left transition-all relative overflow-hidden group ${
                paymentMethod === 'later'
                  ? 'border-emerald-600 bg-emerald-500/10 shadow-md shadow-emerald-500/10'
                  : 'border-white/10 bg-white/5 text-slate-500 hover:border-white/30'
              }`}
            >
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center mb-3 transition-colors", paymentMethod === 'later' ? "border-emerald-600" : "border-white/20")}>{paymentMethod === 'later' && <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />}</div>
              <p className={cn("font-black text-sm uppercase tracking-wider transition-colors", paymentMethod === 'later' ? "text-emerald-900" : "text-slate-600")}>Post-Service</p>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", paymentMethod === 'later' ? "text-emerald-600/80" : "text-slate-400")}>Pay Tech Directly</p>
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          disabled={analyzing}
          className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] text-slate-900 bg-white shadow-2xl hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {analyzing ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : paymentMethod === 'now' ? 'Execute Secure Payment' : 'Initialize Service Booking'}
        </button>
      </motion.div>
    </div>
  );
}
