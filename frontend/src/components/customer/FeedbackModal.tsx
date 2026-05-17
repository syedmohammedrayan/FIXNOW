'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  X,
  Zap,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, arrayUnion, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    technicianId: string;
    technicianName: string;
    category: string;
  };
}

export default function FeedbackModal({ isOpen, onClose, booking }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      // 1. Update Booking with feedback
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        rating,
        feedback,
        feedbackSubmitted: true,
        feedbackAt: new Date()
      });

      // 2. Update Technician's rating stats
      const techRef = doc(db, 'users', booking.technicianId);
      const techSnap = await getDoc(techRef);
      
      if (techSnap.exists()) {
        const data = techSnap.data();
        const totalRatings = (data.totalRatings || 0) + 1;
        const currentSum = (data.ratingSum || (data.rating * (data.totalRatings || 1)) || 0);
        const newSum = currentSum + rating;
        const newAvg = newSum / totalRatings;

        const updateData = {
          rating: newAvg,
          ratingSum: newSum,
          totalRatings: totalRatings,
          reviews: arrayUnion({
            id: booking.id,
            rating,
            feedback,
            date: new Date(),
            customerName: 'Verified Customer'
          })
        };

        // Update the user profile
        await updateDoc(techRef, updateData);
        
        // Also update the public technicians directory for search ranking & ML
        try {
          const publicTechRef = doc(db, 'technicians', booking.technicianId);
          await updateDoc(publicTechRef, {
            rating: newAvg,
            ratingSum: newSum,
            totalRatings: totalRatings
          });
        } catch (e) {
          console.warn("Could not update public technician profile, might not exist yet:", e);
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setRating(0);
        setFeedback('');
      }, 3000);
    } catch (err) {
      console.error('Feedback Error:', err);
      alert('Failed to submit feedback. Tactical error.');
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
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[3rem] p-8 sm:p-12 overflow-hidden shadow-2xl"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            
            {isSuccess ? (
              <div className="text-center space-y-6 py-10">
                <div className="size-24 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="size-12 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Transmission Successful</h2>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                  Your mission report has been logged. We appreciate your contribution to the FixNow network.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Heart className="size-5 text-cyan-400" />
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Rate Your Tech</h2>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1">Post-Deployment Analysis</p>
                  </div>
                  <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-90">
                    <X className="size-4 text-white" />
                  </button>
                </div>

                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <ShieldCheck className="size-6 text-cyan-400" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Field Operative</p>
                        <p className="text-lg font-black text-white uppercase tracking-tight italic">{booking.technicianName}</p>
                     </div>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Protocol Satisfaction Score</p>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="group relative p-2 transition-all active:scale-90"
                      >
                        <Star 
                          className={cn(
                            "size-10 transition-all duration-300",
                            (hoveredRating || rating) >= star 
                              ? "fill-cyan-400 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" 
                              : "text-slate-700 hover:text-slate-500"
                          )} 
                        />
                        {(hoveredRating || rating) >= star && (
                          <motion.div 
                            layoutId="star-glow"
                            className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-center h-4">
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">
                      {rating === 1 && "Critical Issue"}
                      {rating === 2 && "Below Standard"}
                      {rating === 3 && "Protocol Nominal"}
                      {rating === 4 && "Superior Execution"}
                      {rating === 5 && "Exemplary Performance"}
                    </p>
                  </div>
                </div>

                {/* Feedback Text */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 ml-1">
                    <MessageSquare className="size-3 text-slate-500" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Field Comments (Optional)</p>
                  </div>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Describe your experience with the technician..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                  className={cn(
                    "w-full py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3",
                    rating > 0 
                      ? "bg-white text-slate-950 hover:bg-cyan-50 shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-[0.98]" 
                      : "bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <div className="size-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="size-4" />
                      Finalize Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
