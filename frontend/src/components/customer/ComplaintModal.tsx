'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Send, AlertCircle, Loader2, Camera, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    technician_id: string;
    technician_name: string;
    customer_id: string;
    customer_name: string;
    category: string;
  };
}

export default function ComplaintModal({ isOpen, onClose, booking }: ComplaintModalProps) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of your complaint');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = '';

      // 1. Upload to Cloudinary via Backend
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        
        const uploadRes = await axios.post(`${API_BASE}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (uploadRes.data.imageUrl) {
          imageUrl = uploadRes.data.imageUrl;
        }
      }

      // 2. Save to Firebase Firestore
      await addDoc(collection(db, 'complaints'), {
        bookingId: booking.id,
        technicianId: booking.technician_id,
        technicianName: booking.technician_name,
        customerId: booking.customer_id,
        customerName: booking.customer_name,
        category: booking.category,
        description: description.trim(),
        imageUrl: imageUrl,
        status: 'Open',
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setDescription('');
        setFile(null);
        setPreviewUrl(null);
      }, 2000);

    } catch (err: any) {
      console.error('Complaint submission error:', err);
      setError(err.response?.data?.error || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

            <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#0a0f1d]/40 border border-white/[0.08] rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-[50px] mx-4"
            style={{ boxShadow: 'inset 0 1px 1px 0 rgba(255,255,255,0.05), 0 40px 100px -20px rgba(0,0,0,0.5)' }}
          >
            {/* Cinematic Accent Top Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500/50 via-white/30 to-blue-500/50" />

            {/* Header Area */}
            <div className="px-6 sm:px-10 pt-8 sm:pt-10 pb-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                   <div className="size-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                   <span className="text-[9px] font-black text-rose-400/80 uppercase tracking-[0.3em]">Issue Protocol</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                  File <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">Report.</span>
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1.5">Booking ID: {booking.id.slice(-8).toUpperCase()}</p>
              </div>
              <button
                onClick={onClose}
                className="group size-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white/30 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-500 active:scale-90"
              >
                <X className="size-6 transition-transform duration-500 group-hover:rotate-90" />
              </button>
            </div>

            {success ? (
              <div className="p-12 sm:p-20 flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                  <div className="relative size-24 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center">
                    <CheckCircle2 className="size-12 text-emerald-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Incident Logged</h3>
                  <p className="text-slate-400 text-xs font-medium max-w-[240px] leading-relaxed">Your report has been successfully transmitted to the resolution core.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 sm:px-10 pb-8 sm:pb-12 space-y-6 sm:space-y-8">
                {/* Deployment Context Card */}
                <div className="grid grid-cols-2 gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/[0.05] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                     <AlertCircle className="size-20" />
                  </div>
                  <div className="space-y-1 relative z-10">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Target Asset</p>
                    <p className="text-sm font-black text-white uppercase italic">{booking.technician_name}</p>
                  </div>
                  <div className="space-y-1 text-right relative z-10">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Operation Category</p>
                    <p className="text-sm font-black text-cyan-400 uppercase italic">{booking.category}</p>
                  </div>
                </div>

                {/* Description Narrative */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                      <span className="size-1 bg-white/20 rounded-full" /> Narrative Log
                    </label>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Manual Entry</span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed account of the discrepancy..."
                    className="w-full h-32 sm:h-40 px-6 py-5 bg-white/[0.03] border border-white/[0.08] rounded-[1.5rem] text-white placeholder:text-white/10 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all duration-500 resize-none text-sm font-medium leading-relaxed"
                  />
                </div>

                {/* Visual Evidence Area */}
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                      <span className="size-1 bg-white/20 rounded-full" /> Visual Evidence
                    </label>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Optional</span>
                  </div>
                  
                  {previewUrl ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group rounded-[1.5rem] overflow-hidden border border-white/10 bg-black/40 aspect-[16/10] sm:aspect-video shadow-2xl"
                    >
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => { setFile(null); setPreviewUrl(null); }}
                          className="px-6 py-3 bg-rose-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-400 transition-all active:scale-95 shadow-xl"
                        >
                          Purge Evidence
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <label className="relative flex flex-col items-center justify-center w-full h-32 sm:h-40 bg-white/[0.02] border-2 border-dashed border-white/[0.08] rounded-[1.5rem] cursor-pointer hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500 group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                        <div className="size-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-white/[0.08] transition-all duration-500">
                          <Camera className="size-6 text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-white transition-colors">Capture or Upload Sample</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4 text-rose-400 text-[10px] font-black uppercase tracking-widest shadow-lg"
                  >
                    <AlertCircle className="size-5 shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Submission Control */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full h-16 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center gap-4 font-black uppercase tracking-[0.3em] text-[11px] sm:text-xs transition-all duration-500 group/btn shadow-2xl relative overflow-hidden",
                    isSubmitting 
                      ? "bg-white/10 text-white/20 cursor-not-allowed" 
                      : "bg-white text-slate-950 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] shadow-white/5"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Transmitting Data...
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                      <Send className="size-4 sm:size-5 transition-transform duration-500 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                      Initialize Resolution
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
