'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles } from 'lucide-react';
import { Technician } from '../types';

interface TechnicianListProps {
  technicians: Technician[];
  onSelect: (tech: Technician) => void;
  analyzing?: boolean;
}

export default function TechnicianList({ technicians, onSelect, analyzing }: TechnicianListProps) {
  return (
    <div className="lg:col-span-4 sticky top-24">
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-xl font-black text-white tracking-tight">Active Dispatch</h2>
        {analyzing && <div className="radar-ring" />}
      </div>
      
      <div className="space-y-4 max-h-[75vh] overflow-y-auto px-2 pb-8 custom-scrollbar">
        {technicians.length > 0 ? (
          technicians.map((tech, idx) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-900/90 backdrop-blur-3xl p-6 cursor-pointer border border-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-black/20 transition-all relative group overflow-hidden shadow-xl rounded-3xl"
              onClick={() => onSelect(tech)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-500" />
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="size-16 rounded-[1.25rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  {tech.avatar && (tech.avatar.startsWith('data:image') || tech.avatar.startsWith('http') || tech.avatar.startsWith('/')) ? (
                    <div className="relative size-full">
                      <img 
                        src={tech.avatar} 
                        className="w-full h-full object-cover transition-all duration-500" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl transition-all duration-500">👷</span>';
                        }}
                      />
                      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />
                    </div>
                  ) : (
                    <span className="text-4xl transition-all duration-500">{tech.avatar || '👷'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-black text-white truncate tracking-tight group-hover:text-white transition-colors">{tech.name}</h4>
                    {tech.online !== false ? (
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                         <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                         <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Unit Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 shrink-0">
                         <span className="size-1.5 rounded-full bg-slate-600" />
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inactive</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{tech.category}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-white" />
                    <span className="text-xs font-black text-white">{tech.rating}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tech.distance}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-12 text-center glass-panel border-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No matching units in vicinity</p>
          </div>
        )}
      </div>
    </div>
  );
}
