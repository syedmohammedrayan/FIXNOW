"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle2, FileText, AlertCircle, Loader2, Trash2 } from "lucide-react";
import axios from "axios";
import { API_BASE } from "@/lib/config";

interface IdVerificationBoxProps {
  userId?: string;
  onUploadComplete?: (url: string) => void;
  onSuccess?: (url: string) => void;
  existingIdUrl?: string;
  isSignup?: boolean;
}

export default function IdVerificationBox({ userId, onSuccess, onUploadComplete, existingIdUrl, isSignup }: IdVerificationBoxProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existingIdUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload an image (JPG/PNG) or PDF.");
      return;
    }

    // Validate size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null); // For PDF
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("govId", file);

    try {
      const endpoint = isSignup 
        ? `${API_BASE}/api/users/upload-temp-id` 
        : `${API_BASE}/api/users/${userId}/upload-id`;

      const res = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setSuccess(true);
        if (onSuccess) onSuccess(res.data.govIdUrl);
        if (onUploadComplete) onUploadComplete(res.data.govIdUrl);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {!file && !preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`
              relative cursor-pointer group
              border-2 border-dashed rounded-[2.5rem] p-16 text-center transition-all duration-500
              ${isDragging 
                ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_50px_rgba(59,130,246,0.3)]' 
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08] shadow-xl'}
            `}
          >
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              accept="image/jpeg,image/png,application/pdf"
            />
            
            <div className="relative z-10">
              <div className="size-24 rounded-[2rem] bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl">
                <Upload className="size-10 text-blue-400 group-hover:animate-bounce" />
              </div>
              
              <h3 className="text-2xl font-black text-white mb-3 uppercase italic tracking-tight">Deploy Identity Document</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                Drag and drop your <span className="text-white font-bold">Aadhar</span> or <span className="text-white font-bold">PAN</span> card here, or <span className="text-blue-400 font-black underline underline-offset-4 decoration-blue-500/30 hover:decoration-blue-500 transition-all">browse files</span>
              </p>
              
              <div className="mt-10 flex justify-center items-center gap-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <span className="flex items-center gap-2"><div className="size-1 bg-blue-500 rounded-full" /> JPG</span>
                <span className="flex items-center gap-2"><div className="size-1 bg-blue-500 rounded-full" /> PNG</span>
                <span className="flex items-center gap-2"><div className="size-1 bg-blue-500 rounded-full" /> PDF</span>
                <span className="text-slate-700">|</span>
                <span>MAX 5MB</span>
              </div>
            </div>

            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]" />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel border-white/10 p-6 rounded-[2rem] relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <FileText className="size-6 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{file ? file.name : "Gov ID Document"}</p>
                <p className="text-slate-400 text-xs font-medium">{file ? (file.size / 1024 / 1024).toFixed(2) + " MB" : "Verified Document"}</p>
              </div>
              {!uploading && !success && (
                <button 
                  onClick={removeFile}
                  className="p-3 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-all"
                >
                  <Trash2 className="size-5" />
                </button>
              )}
            </div>

            {preview && (
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/40 border border-white/5 mb-6 group">
                <img src={preview} alt="ID Preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            {!preview && file && (
              <div className="py-12 bg-black/20 rounded-2xl border border-white/5 mb-6 flex flex-col items-center">
                <FileText className="size-16 text-slate-600 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">PDF Document Loaded</p>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 mb-6"
                >
                  <AlertCircle className="size-5 text-rose-400 shrink-0" />
                  <p className="text-rose-400 text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {success ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex flex-col items-center text-center">
                <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="size-10 text-emerald-400" />
                </div>
                <h4 className="text-emerald-400 font-bold text-lg mb-1">Upload Successful!</h4>
                <p className="text-slate-400 text-sm font-medium">Your identity verification has been sent to the admin panel.</p>
              </div>
            ) : (
              <button
                disabled={uploading || !file}
                onClick={handleUpload}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-5" />
                    <span>Confirm for ID Verification</span>
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
