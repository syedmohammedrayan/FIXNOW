'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Languages, Check, Mic, Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AITriagePanelProps {
  analyzing: boolean;
  issueText: string;
  setIssueText: (val: string) => void;
  voiceLang: string;
  setVoiceLang: (val: string) => void;
  showLangMenuVoice: boolean;
  setShowLangMenuVoice: (val: boolean) => void;
  isListening: boolean;
  startListening: () => void;
  imageFile: File | null;
  imagePreview: string | null;
  imageInputRef: React.RefObject<HTMLInputElement>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: () => void;
  handleAnalyze: () => void;
  langs: { code: string; label: string }[];
}

export default function AITriagePanel({
  analyzing,
  issueText,
  setIssueText,
  voiceLang,
  setVoiceLang,
  showLangMenuVoice,
  setShowLangMenuVoice,
  isListening,
  startListening,
  imageFile,
  imagePreview,
  imageInputRef,
  handleImageChange,
  removeImage,
  handleAnalyze,
  langs
}: AITriagePanelProps) {
  return (
    <motion.div 
      id="diagnose-box"
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "bg-white/[0.04] backdrop-blur-2xl p-5 sm:p-7 md:p-10 relative overflow-hidden space-y-6 sm:space-y-8 border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl"
      )}
      style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.3)' }}
    >
      {analyzing && (
        <div className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-md border border-white/10 flex items-center justify-center rounded-[2rem] sm:rounded-[2.5rem]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Scanning Core Systems...</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-black text-white flex items-center gap-2 sm:gap-3">
            <Sparkles className="size-4 sm:size-5 text-white" /> AI Scan & Diagnose
          </h2>
          <p className="text-[9px] sm:text-[10px] text-white/35 font-black uppercase tracking-widest mt-1">Instant voice & visual diagnosis powered by Gemini 1.5 & Groq</p>
        </div>
        <div className="flex gap-1.5">
          {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/10" />)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1 sm:px-2 min-h-[36px] sm:min-h-[44px]">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Voice Language:
            </span>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenuVoice(!showLangMenuVoice)}
                className="flex items-center gap-2 sm:gap-3 bg-white/[0.04] backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06] transition shadow-sm h-9 sm:h-11 active:scale-95"
              >
                <Languages className="size-3.5 sm:size-4 text-white/40" />
                <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider cursor-pointer select-none">
                  {langs.find(l => l.code === voiceLang)?.label || 'English'}
                </span>
              </button>

              <AnimatePresence>
                {showLangMenuVoice && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenuVoice(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-y-auto max-h-60 z-50 py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                    >
                      {langs.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            setVoiceLang(l.code);
                            setShowLangMenuVoice(false);
                          }}
                          className={cn(
                            "w-full px-5 py-3 text-left text-[11px] font-bold tracking-wider uppercase transition flex items-center justify-between",
                            voiceLang === l.code 
                              ? "bg-white/[0.06] text-white border-l-2 border-white" 
                              : "text-white/40 hover:bg-white/[0.04] hover:text-white"
                          )}
                        >
                          <span>{l.label}</span>
                          {voiceLang === l.code && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={startListening}
            className={cn(
              "p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 flex items-center gap-4 sm:gap-6 text-left group shadow-sm backdrop-blur-md w-full h-full min-h-[100px] sm:min-h-[128px]",
              isListening 
                ? "bg-rose-500/20 border-rose-500/40 text-rose-100 animate-pulse shadow-lg shadow-rose-500/20" 
                : "bg-slate-900/60 border-white/[0.1] hover:border-white/30 hover:bg-slate-900/80 shadow-2xl"
            )}
            style={{ boxShadow: isListening ? undefined : 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.4)' }}
          >
            <div className={cn(
              "p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-all flex-shrink-0 duration-300",
              isListening 
                ? "bg-rose-500/30 border-rose-400/40 text-rose-100" 
                : "bg-slate-800/60 border-white/[0.1] text-white/50 group-hover:scale-110 group-hover:bg-slate-700/60 group-hover:border-white/30 group-hover:text-white"
            )}>
              <Mic className="size-6 sm:size-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-white transition uppercase tracking-wider">
                {isListening ? 'Listening your voice...' : 'Speak Issue'}
              </h3>
              <p className="text-[10px] sm:text-xs text-white/30 font-medium mt-0.5 leading-relaxed group-hover:text-white/50">Describe the issue out loud to diagnose instantly</p>
            </div>
          </motion.button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1 sm:px-2 h-[36px] sm:h-[34px]">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" /> Visual Diagnosis:
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={imageInputRef}
            onChange={handleImageChange}
          />
          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (analyzing) return;
              imageInputRef.current?.click();
            }}
            disabled={analyzing}
            className={cn(
              "p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-300 flex items-center gap-4 sm:gap-6 text-left group shadow-sm backdrop-blur-md w-full h-full min-h-[100px] sm:min-h-[128px]",
              imageFile 
                ? "bg-slate-900/80 border-white/30 text-white shadow-2xl" 
                : "bg-slate-900/60 border-white/[0.1] hover:border-white/30 hover:bg-slate-900/80 shadow-2xl",
              analyzing && "opacity-50 cursor-not-allowed"
            )}
            style={{ boxShadow: imageFile ? undefined : 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.4)' }}
          >
            <div className={cn(
              "p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-all flex-shrink-0 duration-300",
              imageFile 
                ? "bg-slate-800/80 border-white/30 text-white" 
                : "bg-slate-800/60 border-white/[0.1] text-white/50 group-hover:scale-110 group-hover:bg-slate-700/60 group-hover:border-white/30 group-hover:text-white"
            )}>
              <Camera className="size-6 sm:size-8" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-white transition uppercase tracking-wider">
                  {imageFile ? 'Image Received' : 'Visual Photo Scan'}
                </h3>
                {imagePreview && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative group w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden border border-white/15 shadow-md cursor-pointer ml-2 sm:ml-3 flex-shrink-0"
                  >
                    <img src={imagePreview} className="w-full h-full object-cover" />
                    <div 
                      onClick={(e) => { e.stopPropagation(); removeImage(); }}
                      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
                    </div>
                  </motion.div>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-white/50 font-bold mt-0.5 leading-relaxed group-hover:text-white/80">
                {imageFile ? 'Click to change or replace visual sample' : 'Take or upload photo of the broken item'}
              </p>
            </div>
          </motion.button>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[9px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest">Or Type Description Manually</h4>
          <div className="h-[1px] flex-1 bg-white/[0.04] ml-3 sm:ml-4" />
        </div>

        <textarea
          className="w-full h-28 sm:h-36 rounded-[1.25rem] sm:rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] px-5 sm:px-8 py-4 sm:py-6 text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition text-sm sm:text-md leading-relaxed font-medium resize-none"
          style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
          placeholder="Describe your micro-service or problem manually..."
          value={issueText}
          onChange={(e) => setIssueText(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap justify-end items-center gap-4 sm:gap-6">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={(!issueText.trim() && !imageFile) || analyzing}
          className="px-6 sm:px-10 py-4 sm:py-5 rounded-[1.25rem] sm:rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] text-slate-900 bg-white shadow-2xl shadow-black/20 hover:bg-slate-100 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-3 relative z-20 w-full sm:w-auto justify-center"
        >
          {analyzing ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing Request...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {imageFile ? 'Execute Diagnosis' : 'Start Triage'}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
