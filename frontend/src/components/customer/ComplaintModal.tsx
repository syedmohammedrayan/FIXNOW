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
            className="relative w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Raise Complaint</h2>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1">Booking #{booking.id.slice(-8)}</p>
              </div>
              <button
                onClick={onClose}
                className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="size-5" />
              </button>
            </div>

            {success ? (
              <div className="p-12 flex flex-col items-center text-center space-y-4">
                <div className="size-20 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <CheckCircle2 className="size-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">Complaint Filed</h3>
                <p className="text-white/60 text-sm">We've received your complaint. Our team will review it shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
                {/* Info Card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30">
                    <span>Technician</span>
                    <span>Service</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span>{booking.technician_name}</span>
                    <span className="text-cyan-400">{booking.category}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">What went wrong?</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    className="w-full h-32 px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none text-sm"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">Attach Visual Proof (Optional)</label>
                  
                  {previewUrl ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-video">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => { setFile(null); setPreviewUrl(null); }}
                          className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/40 transition-all"
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="size-8 text-white/20 group-hover:text-cyan-400 transition-colors mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Click to upload photo</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-bold">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] text-sm transition-all",
                    isSubmitting 
                      ? "bg-white/10 text-white/30 cursor-not-allowed" 
                      : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Filing Report...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Submit Complaint
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
