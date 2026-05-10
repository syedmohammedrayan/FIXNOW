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
        "glass-neon-card p-5 sm:p-10 relative overflow-hidden space-y-6 sm:space-y-8"
      )}
    >
      {analyzing && (
        <div className="absolute inset-0 z-50 glass-panel border-white/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Scanning Core Systems...</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600" /> Advanced AI Scan & Diagnose
          </h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Instant voice & visual diagnosis powered by Gemini 1.5 & Groq</p>
        </div>
        <div className="flex gap-1.5">
          {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200" />)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 min-h-[44px]">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Voice Language:
            </span>
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenuVoice(!showLangMenuVoice)}
                className="flex items-center gap-3 bg-indigo-950/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-900/60 transition shadow-sm h-11 active:scale-95"
              >
                <Languages className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px] font-black text-white uppercase tracking-wider cursor-pointer select-none">
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
                      className="absolute right-0 top-full mt-2 w-48 bg-indigo-950/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.25)] overflow-y-auto max-h-60 z-50 py-2 custom-scrollbar"
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
                              ? "bg-indigo-500/20 text-indigo-300 border-l-2 border-indigo-500" 
                              : "text-indigo-200/80 hover:bg-indigo-500/10 hover:text-white"
                          )}
                        >
                          <span>{l.label}</span>
                          {voiceLang === l.code && <Check className="w-3.5 h-3.5 text-indigo-400" />}
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
              "p-8 rounded-[2rem] border transition-all duration-300 flex items-center gap-6 text-left group shadow-sm backdrop-blur-md w-full h-full min-h-[128px]",
              isListening 
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse shadow-lg shadow-rose-500/20" 
                : "bg-indigo-950/60 border-white/10 hover:border-indigo-500/50 hover:bg-indigo-900/40 shadow-inner"
            )}
          >
            <div className={cn(
              "p-5 rounded-2xl border transition-all flex-shrink-0 duration-300",
              isListening 
                ? "bg-rose-500/30 border-rose-400/40 text-rose-300" 
                : "bg-indigo-900/50 border-indigo-500/30 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:border-indigo-400/40 group-hover:text-indigo-300"
            )}>
              <Mic className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-white group-hover:text-indigo-300 transition uppercase tracking-wider">
                {isListening ? 'Listening your voice...' : 'Speak Issue'}
              </h3>
              <p className="text-xs text-indigo-200/60 font-medium mt-0.5 leading-relaxed group-hover:text-indigo-200/80">Describe the issue out loud to diagnose instantly</p>
            </div>
          </motion.button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2 h-[34px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" /> Visual Diagnosis:
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
              "p-8 rounded-[2rem] border transition-all duration-300 flex items-center gap-6 text-left group shadow-sm backdrop-blur-md w-full h-full min-h-[128px]",
              imageFile 
                ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-300 shadow-lg shadow-indigo-500/20" 
                : "bg-indigo-950/60 border-white/10 hover:border-indigo-500/50 hover:bg-indigo-900/40 shadow-inner",
              analyzing && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "p-5 rounded-2xl border transition-all flex-shrink-0 duration-300",
              imageFile 
                ? "bg-indigo-500/30 border-indigo-400/40 text-indigo-300" 
                : "bg-indigo-900/50 border-indigo-500/30 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:border-indigo-400/40 group-hover:text-indigo-300"
            )}>
              <Camera className="w-8 h-8" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white group-hover:text-indigo-300 transition uppercase tracking-wider">
                  {imageFile ? 'Image Received' : 'Visual Photo Scan'}
                </h3>
                {imagePreview && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative group w-10 h-10 rounded-xl overflow-hidden border border-indigo-500/30 shadow-md cursor-pointer ml-3 flex-shrink-0"
                  >
                    <img src={imagePreview} className="w-full h-full object-cover" />
                    <div 
                      onClick={(e) => { e.stopPropagation(); removeImage(); }}
                      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </div>
                  </motion.div>
                )}
              </div>
              <p className="text-xs text-indigo-200/60 font-medium mt-0.5 leading-relaxed group-hover:text-indigo-200/80">
                {imageFile ? 'Click to change or replace visual sample' : 'Take or upload photo of the broken item'}
              </p>
            </div>
          </motion.button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Or Type Description Manually</h4>
          <div className="h-[1px] flex-1 bg-slate-800/40 backdrop-blur-md ml-4" />
        </div>

        <textarea
          className="w-full h-36 rounded-[1.75rem] border border-slate-100 glass-panel border-white/10 px-8 py-6 text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition text-md leading-relaxed shadow-inner font-medium resize-none"
          placeholder="Describe your micro-service or problem manually..."
          value={issueText}
          onChange={(e) => setIssueText(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap justify-end items-center gap-6">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={(!issueText.trim() && !imageFile) || analyzing}
          className="px-6 sm:px-10 py-4 sm:py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] text-white bg-indigo-600 shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-3 relative z-20 w-full sm:w-auto justify-center"
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
