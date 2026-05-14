"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle2, FileText, AlertCircle, Loader2, Trash2, ShieldCheck } from "lucide-react";
import axios from "axios";
import { getImageUrl } from "@/lib/image-utils";
import { API_BASE } from "@/lib/config";
import { cn } from "@/lib/utils";

interface IdUploadCardProps {
  onSuccess: (url: string) => void;
  existingIdUrl?: string;
}

export default function IdUploadCard({ onSuccess, existingIdUrl }: IdUploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(getImageUrl(existingIdUrl, 'id') || null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(!!existingIdUrl);

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
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload an image (JPG/JPEG/PNG).");
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

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("govId", file);

    try {
      // Use existing temporary ID upload endpoint
      const res = await axios.post(`${API_BASE}/api/users/upload-temp-id`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setSuccess(true);
        onSuccess(res.data.govIdUrl);
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
    onSuccess(""); // Clear URL in parent
  };

  return (
    <div className="group relative">
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative bg-white/5 border border-white/10 rounded-[2rem] p-6 transition-all duration-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FileText className="size-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-widest">Identity Document</h4>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">Aadhaar / Driving License / Gov ID</p>
          </div>
          {success && (
            <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <CheckCircle2 className="size-3 text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Stored</span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={cn(
                "relative cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300",
                isDragging 
                  ? "border-cyan-500/50 bg-cyan-500/5" 
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              )}
            >
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                accept="image/jpeg,image/png"
              />
              <div className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="size-6 text-slate-400 group-hover:text-white" />
              </div>
              <p className="text-white font-bold text-sm mb-1 uppercase tracking-tight italic">Click or drag to upload</p>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">JPG, JPEG or PNG • Max 5MB</p>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[4/2.5] bg-black/40 border border-white/10 group/img">
                <img src={preview} alt="ID Preview" className="w-full h-full object-contain" />
                {!success && !uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <button 
                      onClick={removeFile}
                      className="p-3 bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 rounded-full transition-all"
                    >
                      <Trash2 className="size-6" />
                    </button>
                  </div>
                )}
                {success && (
                  <button 
                    onClick={removeFile}
                    className="absolute top-3 right-3 p-2 bg-slate-950/80 text-white hover:bg-rose-500 rounded-lg transition-all"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              {!success && (
                <button
                  disabled={uploading}
                  onClick={handleUpload}
                  className="w-full py-4 bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Encrypting...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      <span>Process ID Document</span>
                    </>
                  )}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="size-4 text-rose-400 shrink-0" />
              <p className="text-rose-400 text-[10px] font-bold uppercase tracking-tight">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
