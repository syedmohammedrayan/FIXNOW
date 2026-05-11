'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Zap, Wind, Snowflake, Droplets, UtensilsCrossed, 
  Hammer, Paintbrush, Layers, Truck, Bike, Car, 
  Bug, Sparkles, Monitor, Flame, Wrench, ShieldCheck, MapPin,
  RefreshCw, MousePointer2, Plus, Box
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { AnalysisResult } from '../types';
import { BroadcastStatus } from '../hooks/useBooking';
import dynamic from 'next/dynamic';

const BroadcastWaitingOverlay = dynamic(() => import('./BroadcastWaitingOverlay'), { ssr: false });

interface AnalysisResultViewProps {
  analysisResult: AnalysisResult;
  onBroadcastBook: () => void;
  isWaitingForBroadcast: boolean;
  // New broadcast props
  broadcastStatus: BroadcastStatus;
  broadcastTimerEnd: number | null;
  onCancelBroadcast: () => void;
  onRetryBroadcast: () => void;
}

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('hvac')) return <Wind className="w-8 h-8" />;
  if (cat.includes('electrician')) return <Zap className="w-8 h-8" />;
  if (cat.includes('washing')) return <RefreshCw className="w-8 h-8" />;
  if (cat.includes('water')) return <Droplets className="w-8 h-8" />;
  if (cat.includes('refrigerator')) return <Snowflake className="w-8 h-8" />;
  if (cat.includes('kitchen')) return <UtensilsCrossed className="w-8 h-8" />;
  if (cat.includes('installation')) return <Box className="w-8 h-8" />;
  if (cat.includes('gas')) return <Flame className="w-8 h-8" />;
  if (cat.includes('carpentry')) return <Hammer className="w-8 h-8" />;
  if (cat.includes('plumbing')) return <Droplets className="w-8 h-8" />;
  if (cat.includes('electronics')) return <Monitor className="w-8 h-8" />;
  if (cat.includes('pest')) return <Bug className="w-8 h-8" />;
  if (cat.includes('cleaning')) return <Sparkles className="w-8 h-8" />;
  if (cat.includes('painter')) return <Paintbrush className="w-8 h-8" />;
  if (cat.includes('renovation')) return <Layers className="size-8" />;
  if (cat.includes('moving')) return <Truck className="w-8 h-8" />;
  if (cat.includes('bike')) return <Bike className="w-8 h-8" />;
  if (cat.includes('car')) return <Car className="w-8 h-8" />;
  if (cat.includes('rural')) return <MapPin className="w-8 h-8" />;
  return <Wrench className="w-8 h-8" />;
};

export default function AnalysisResultView({ 
  analysisResult, 
  onBroadcastBook, 
  isWaitingForBroadcast,
  broadcastStatus,
  broadcastTimerEnd,
  onCancelBroadcast,
  onRetryBroadcast
}: AnalysisResultViewProps) {
  const showBroadcastOverlay = broadcastStatus === 'waiting' || broadcastStatus === 'expired';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6"
    >
      {/* Diagnostic Assessment Card */}
      <div className="bg-white/[0.04] backdrop-blur-2xl p-5 sm:p-7 md:p-10 relative overflow-hidden border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/[0.02] blur-[80px] -ml-32 -mb-32 pointer-events-none" />
        
        <div className="flex items-center gap-3 sm:gap-5 mb-6 sm:mb-10">
          <div className="size-10 sm:size-14 rounded-xl sm:rounded-2xl bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
            <Activity className="size-5 sm:size-7 text-white" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[10px] sm:text-[11px]">Diagnostic Assessment</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] sm:text-[10px] text-white/30 uppercase font-black tracking-[0.2em] sm:tracking-[0.3em]">Core Intelligence Protocol</span>
              <div className="h-1 w-1 rounded-full bg-white/30 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Required Unit Card - Redesigned */}
          <div className="group relative p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.04] border border-white/[0.06] shadow-xl overflow-hidden min-h-[130px] sm:min-h-[160px] flex flex-col justify-between" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.03)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-[0.1] group-hover:opacity-[0.2] transition-opacity duration-500">
              {getCategoryIcon(analysisResult.category)}
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase font-black text-white/25 mb-3 sm:mb-4 tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-white/30" /> Required Unit
              </p>
              <h2 className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-tight tracking-tight">
                {analysisResult.category}
              </h2>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Specialist Assigned</p>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.04] border border-white/[0.06] flex flex-col justify-between min-h-[130px] sm:min-h-[160px]" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.03)' }}>
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase font-black text-white/25 mb-3 sm:mb-4 tracking-[0.2em]">Threat Level</p>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-3 rounded-full animate-pulse",
                  analysisResult.urgency === 'High' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
                  analysisResult.urgency === 'Medium' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 
                  'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                )} />
                <p className={cn(
                  "font-black text-xl sm:text-2xl md:text-3xl leading-none tracking-tight uppercase",
                  analysisResult.urgency === 'High' ? 'text-rose-500' : 
                  analysisResult.urgency === 'Medium' ? 'text-amber-500' : 
                  'text-emerald-500'
                )}>{analysisResult.urgency}</p>
              </div>
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-white/25 uppercase tracking-widest mt-3 sm:mt-4">Calculated from issue analysis</p>
          </div>

          <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.04] border border-white/[0.06] flex flex-col justify-between min-h-[130px] sm:min-h-[160px]" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.03)' }}>
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase font-black text-white/25 mb-3 sm:mb-4 tracking-[0.2em]">Budget Forecast</p>
              <p className="text-white font-black text-xl sm:text-2xl md:text-3xl leading-none tracking-tight">₹{analysisResult.estimatedCostRange}</p>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest px-2 py-0.5 bg-white/[0.06] rounded border border-white/[0.06]">Market Rate</span>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-10 pt-6 sm:pt-10 border-t border-white/[0.06]">
          <p className="text-[9px] sm:text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-4 sm:mb-5 flex items-center gap-2">
            <Plus className="w-3 h-3 text-white/30" /> Material Logistics Required
          </p>
          <div className="flex flex-wrap gap-3">
            {analysisResult.recommendedMaterials.map((m, i) => (
              <span key={i} className="px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white/35 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:border-white/20 transition-colors cursor-default">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Book Expert button - only show when idle */}
        {broadcastStatus === 'idle' && (
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-10 border-t border-white/[0.06]">
            <button 
              onClick={onBroadcastBook}
              className="group relative w-full px-8 py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs transition-all duration-300 active:scale-[0.98] shadow-2xl shadow-black/40 overflow-hidden flex items-center justify-center gap-4"
            >
              <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-slate-900/10 flex items-center justify-center group-hover:bg-slate-900/20 transition-colors">
                  <Activity className="w-4 h-4 text-slate-900" />
                </div>
                <span>Initiate Booking for {analysisResult.category}</span>
              </div>
              <div className="absolute right-8 opacity-0 group-hover:opacity-30 group-hover:translate-x-2 transition-all duration-500">
                <MousePointer2 className="w-5 h-5 text-slate-900" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Broadcast Waiting/Expired Overlay */}
      {showBroadcastOverlay && (
        <BroadcastWaitingOverlay
          category={analysisResult.category}
          timerEnd={broadcastTimerEnd}
          status={broadcastStatus as 'waiting' | 'expired'}
          onCancel={onCancelBroadcast}
          onRetry={onRetryBroadcast}
        />
      )}
    </motion.div>
  );
}
