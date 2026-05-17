'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, BrainCircuit } from 'lucide-react';
import { Technician } from '../types';

import { getAvatarUrl } from '@/lib/image-utils';

interface TechnicianListProps {
  technicians: Technician[];
  onSelect: (tech: Technician) => void;
  analyzing?: boolean;
}

export default function TechnicianList({ technicians, onSelect, analyzing }: TechnicianListProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 sm:mb-8 px-1 sm:px-2">
        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Active Dispatch</h2>
        {analyzing && <div className="radar-ring" />}
      </div>
      
      <div className="space-y-3 sm:space-y-4 max-h-[60vh] lg:max-h-[75vh] overflow-y-auto px-1 sm:px-2 pb-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {Array.isArray(technicians) && technicians.length > 0 ? (
          technicians.map((tech, idx) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/[0.04] backdrop-blur-2xl p-4 sm:p-6 cursor-pointer border border-white/[0.08] hover:border-white/20 hover:shadow-2xl hover:shadow-black/20 transition-all relative group overflow-hidden shadow-xl rounded-2xl sm:rounded-3xl"
              style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.2)' }}
              onClick={() => onSelect(tech)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] blur-[40px] -mr-16 -mt-16 group-hover:bg-white/[0.06] transition-all duration-500" />
              
              <div className="flex items-center gap-3 sm:gap-5 relative z-10">
                <div className="size-12 sm:size-16 rounded-xl sm:rounded-[1.25rem] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  {tech.avatar && (tech.avatar.startsWith('data:image') || tech.avatar.startsWith('http') || tech.avatar.startsWith('/') || tech.avatar.length > 5) ? (
                    <img 
                      src={getAvatarUrl(tech.avatar)!} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl sm:text-4xl transition-all duration-500">👷</span>';
                      }}
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl transition-all duration-500">{tech.avatar || '👷'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-black text-white truncate tracking-tight text-sm sm:text-base group-hover:text-white transition-colors">{tech.name}</h4>
                    {tech.online !== false ? (
                      <div className="flex items-center gap-1 sm:gap-1.5 bg-emerald-500/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-500/15 shrink-0">
                         <span className="size-1 sm:size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                         <span className="text-[7px] sm:text-[8px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 sm:gap-1.5 bg-white/[0.03] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-white/[0.06] shrink-0">
                         <span className="size-1 sm:size-1.5 rounded-full bg-slate-600" />
                         <span className="text-[7px] sm:text-[8px] font-black text-white/30 uppercase tracking-widest">Offline</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{tech.category}</p>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/[0.05] flex flex-col gap-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1 sm:gap-1.5" title="Customer Rating">
                      <Sparkles className="size-3 sm:size-3.5 text-yellow-400" />
                      <span className="text-[10px] sm:text-xs font-black text-white">{tech.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5" title="Distance from you">
                      <MapPin className="size-3 sm:size-3.5 text-cyan-400" />
                      <span className="text-[9px] sm:text-[10px] font-black text-white/70 uppercase tracking-widest">{tech.distance}</span>
                    </div>
                  </div>
                  
                  {tech.xgbScore !== undefined && (
                    <div className="flex items-center gap-1.5 bg-indigo-500/20 px-2 py-1 rounded-full border border-indigo-500/30">
                      <BrainCircuit className="size-3.5 text-indigo-400" />
                      <span className="text-[10px] font-black text-indigo-300 tracking-widest">
                        {(tech.xgbScore * 100).toFixed(0)}% SUCCESS RATE
                      </span>
                    </div>
                  )}
                </div>

                {tech.xgbScore !== undefined && (
                  <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${tech.xgbScore * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                      className={`h-full rounded-full ${
                        tech.xgbScore > 0.8 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                        tech.xgbScore > 0.5 ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                        'bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      }`}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-8 sm:p-12 text-center bg-white/[0.02] border-white/[0.05] rounded-2xl sm:rounded-3xl border border-dashed border-white/[0.08]">
            <p className="text-xs sm:text-sm text-white/30 font-bold uppercase tracking-widest">No matching units in vicinity</p>
          </div>
        )}
      </div>
    </div>
  );
}
