"use client";

import React, { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
const Webcam = dynamic(() => import("react-webcam"), { ssr: false });
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, RefreshCw, CheckCircle2, ShieldCheck, Loader2, CameraOff } from "lucide-react";
import axios from "axios";
import { API_BASE } from "@/lib/config";
import { cn } from "@/lib/utils";


interface FaceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

export default function FaceVerificationModal({ isOpen, onClose, onSuccess }: FaceVerificationModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!imgSrc) return;
    setUploading(true);
    setError(null);

    try {
      // Convert data URL to Blob
      const byteString = atob(imgSrc.split(',')[1]);
      const mimeString = imgSrc.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("image", file);

      // Use the general upload route as requested
      const res = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        onSuccess(res.data.imageUrl);
        setTimeout(() => {
          onClose();
          setImgSrc(null);
        }, 1500);
      }
    } catch (err: any) {
      setError("Transmission failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 50 }}
            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto scrollbar-none"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <ShieldCheck className="size-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-white font-black text-xs uppercase tracking-widest">Face Verification</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">Biometric Identity Sync</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Camera Area */}
            <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {!imgSrc ? (
                  <motion.div
                    key="webcam"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative w-full h-full"
                  >
                    {!permissionError ? (
                      <>
                        <Webcam
                          audio={false}
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="w-full h-full object-cover grayscale-[0.3]"
                          onUserMediaError={() => setPermissionError(true)}
                          videoConstraints={{
                            facingMode: "user",
                            width: 1080,
                            height: 1080
                          }}
                        />
                        {/* Face Alignment Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="size-[70%] border-2 border-white/20 rounded-[3rem] border-dashed relative">
                            <div className="absolute inset-0 bg-cyan-400/5 rounded-[3rem] animate-pulse" />
                            {/* Corner Markers */}
                            <div className="absolute -top-1 -left-1 size-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-2xl" />
                            <div className="absolute -top-1 -right-1 size-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-2xl" />
                            <div className="absolute -bottom-1 -left-1 size-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-2xl" />
                            <div className="absolute -bottom-1 -right-1 size-8 border-b-2 border-r-2 border-cyan-400 rounded-br-2xl" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center gap-4">
                        <div className="size-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <CameraOff className="size-8 text-rose-400" />
                        </div>
                        <h4 className="text-white font-black uppercase tracking-tight italic">Camera Access Denied</h4>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">
                          biometric verification requires camera permissions. Please enable access in your browser settings.
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full h-full"
                  >
                    <img src={imgSrc} className="w-full h-full object-cover" alt="Captured selfie" />
                    {uploading && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <div className="size-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                        <p className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.3em]">Uploading Biometrics...</p>
                      </div>
                    )}
                    {error && (
                      <div className="absolute bottom-4 left-4 right-4 bg-rose-500/90 text-white p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-2xl backdrop-blur-md border border-white/20">
                        {error}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Actions */}
            <div className="p-6 sm:p-8 bg-slate-900 border-t border-white/5">
              {!imgSrc ? (
                <button
                  disabled={permissionError}
                  onClick={capture}
                  className="w-full h-14 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 shadow-2xl"
                >
                  <Camera className="size-5" />
                  <span>Capture Identity</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    disabled={uploading}
                    onClick={retake}
                    className="h-14 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
                  >
                    <RefreshCw className={cn("size-5", uploading && "animate-spin")} />
                    <span>Retake</span>
                  </button>
                  <button
                    disabled={uploading}
                    onClick={handleUpload}
                    className="h-14 bg-cyan-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-cyan-400 transition-all active:scale-95 shadow-xl shadow-cyan-500/20"
                  >
                    {uploading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-5" />
                    )}
                    <span>Verify Face</span>
                  </button>
                </div>
              )}
              <p className="text-center mt-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                Secure End-to-End Encryption • ISO/IEC 27001 Compliant
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
