import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, CheckCircle, ChevronDown, Award, TrendingDown, DollarSign } from 'lucide-react';

export default function TechnicianMatchCard({ 
  technician, 
  onBook 
}: { 
  technician: any, 
  onBook: (techId: string) => void 
}) {
  const [expanded, setExpanded] = useState(false);
  const score = Math.round((technician.matchScore || 0) * 100);
  const xgbScore = Math.round((technician.xgbScore || 0) * 100);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-duration-500 pointer-events-none" />

      <div className="flex gap-6 relative z-10">
        {/* Avatar & Score Ring */}
        <div className="relative shrink-0 flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-[1.5rem] bg-slate-800 border-2 border-cyan-500/30 overflow-hidden relative shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            {technician.avatar ? (
              <img src={technician.avatar} alt={technician.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 font-bold text-2xl uppercase">
                {technician.name ? technician.name.substring(0, 2) : "TK"}
              </div>
            )}
            
            {/* Online Indicator */}
            {technician.online && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            )}
          </div>
          
          <div className="bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 text-xs font-black tracking-widest flex items-center gap-1 shadow-inner shadow-cyan-500/20">
            <Award className="w-3 h-3" />
            {score}% MATCH
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight italic truncate">{technician.name}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">{technician.category}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-emerald-400 font-black text-lg">
                <Star className="w-4 h-4 fill-emerald-400" />
                {technician.rating?.toFixed(1) || "5.0"}
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{technician.experience || 2} YRS EXP</p>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-slate-300 text-sm font-medium bg-slate-800/50 px-3 py-1.5 rounded-xl border border-white/5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              {technician.distance?.toFixed(1) || "2.5"} km away
            </div>
            
            <div className="flex items-center gap-1.5 text-slate-300 text-sm font-medium bg-slate-800/50 px-3 py-1.5 rounded-xl border border-white/5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Est. ₹{technician.basePrice || 500}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <div className="mt-5 relative z-10">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 rounded-2xl text-xs font-black text-slate-300 uppercase tracking-widest transition-colors"
        >
          View AI Reasoning
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3">
                {/* Confidence Bar */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XGBoost Success Probability</span>
                    <span className="text-emerald-400 font-black text-sm">{xgbScore}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${xgbScore}%` }} 
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400" 
                    />
                  </div>
                </div>

                {/* Bullets */}
                <ul className="space-y-2">
                  {technician.explanation?.map((bullet: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Negotiation */}
                {technician.negotiation && (
                  <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Pricing Suggestion</span>
                    </div>
                    <p className="text-sm text-slate-300 italic mb-2">"{technician.negotiation.reasoning}"</p>
                    <p className="text-lg font-black text-white">Suggested: ₹{technician.negotiation.suggestedPrice}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => onBook(technician.uid || technician.id)}
        className="w-full mt-4 py-4 bg-white text-slate-950 font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_10px_30px_rgba(255,255,255,0.1)] relative z-10"
      >
        Deploy Protocol
      </button>
    </motion.div>
  );
}
