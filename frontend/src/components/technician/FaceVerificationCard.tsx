"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, ShieldCheck, UserCheck, RefreshCw } from "lucide-react";
import FaceVerificationModal from "./FaceVerificationModal";
import { cn } from "@/lib/utils";

interface FaceVerificationCardProps {
  onSuccess: (url: string) => void;
  existingSelfieUrl?: string;
}

export default function FaceVerificationCard({ onSuccess, existingSelfieUrl }: FaceVerificationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(existingSelfieUrl || null);

  const handleSuccess = (url: string) => {
    setSelfieUrl(url);
    onSuccess(url);
  };

  return (
    <div className="group relative h-full">
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

      <div className="relative h-full bg-white/5 border border-white/10 rounded-[2rem] p-6 transition-all duration-500 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Camera className="size-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-widest">Face Verification</h4>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">Biometric Selfie Capture</p>
          </div>
          {selfieUrl && (
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <CheckCircle2 className="size-3 text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!selfieUrl ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-6"
              >
                <div className="size-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform relative">
                  <Camera className="size-8 text-slate-400 group-hover:text-white" />
                  <div className="absolute inset-0 bg-blue-400/5 rounded-[2rem] animate-pulse" />
                </div>
                <h3 className="text-white font-bold text-sm mb-2 uppercase tracking-tight italic">Biometric Identification</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed mb-6">
                  live face capture required to prevent fraudulent registrations
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-4 bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                >
                  Start Verification
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="verified"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="relative rounded-2xl overflow-hidden aspect-[4/2.5] bg-black/40 border border-white/10 group/img">
                  <img src={selfieUrl} alt="Selfie Preview" className="w-full h-full object-cover grayscale-[0.2]" />
                  <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />
                  
                  {/* Verification Badge Overlay */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-lg">
                    <UserCheck className="size-3.5 text-emerald-400" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Identity Match 100%</span>
                  </div>

                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-slate-950 rounded-full font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
                    >
                      <RefreshCw className="size-3" />
                      Retake Selfie
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                  <ShieldCheck className="size-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verification Complete</p>
                    <p className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-tight">Biometric handshake successful</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <FaceVerificationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess} 
        />
      </div>
    </div>
  );
}
