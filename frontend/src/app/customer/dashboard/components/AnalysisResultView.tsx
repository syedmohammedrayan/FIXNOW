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
      <div className="bg-slate-900/90 backdrop-blur-3xl p-8 sm:p-10 relative overflow-hidden border border-white/10 rounded-[2.5rem] shadow-2xl">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/[0.02] blur-[80px] -ml-32 -mb-32 pointer-events-none" />
        
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">Diagnostic Assessment</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em]">Core Intelligence Protocol</span>
              <div className="h-1 w-1 rounded-full bg-white/40 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Required Unit Card - Redesigned */}
          <div className="group relative p-6 rounded-[2rem] bg-white/5 border border-white/10 shadow-xl overflow-hidden min-h-[160px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-[0.1] group-hover:opacity-[0.2] transition-opacity duration-500">
              {getCategoryIcon(analysisResult.category)}
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-white/50" /> Required Unit
              </p>
              <h2 className="text-white font-black text-2xl sm:text-3xl leading-tight tracking-tight drop-shadow-sm">
                {analysisResult.category}
              </h2>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Specialist Assigned</p>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 shadow-inner flex flex-col justify-between min-h-[160px]">
            <div>
              <p className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-[0.2em]">Threat Level</p>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-3 rounded-full animate-pulse",
                  analysisResult.urgency === 'High' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
                  analysisResult.urgency === 'Medium' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 
                  'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                )} />
                <p className={cn(
                  "font-black text-2xl sm:text-3xl leading-none tracking-tight uppercase",
                  analysisResult.urgency === 'High' ? 'text-rose-500' : 
                  analysisResult.urgency === 'Medium' ? 'text-amber-500' : 
                  'text-emerald-500'
                )}>{analysisResult.urgency}</p>
              </div>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4">Calculated from issue analysis</p>
          </div>

          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 shadow-inner flex flex-col justify-between min-h-[160px]">
            <div>
              <p className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-[0.2em]">Budget Forecast</p>
              <p className="text-white font-black text-2xl sm:text-3xl leading-none tracking-tight">₹{analysisResult.estimatedCostRange}</p>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-[9px] font-black text-white uppercase tracking-widest px-2 py-0.5 bg-white/10 rounded border border-white/10">Market Rate</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-10 border-t border-white/10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
            <Plus className="w-3 h-3 text-white/50" /> Material Logistics Required
          </p>
          <div className="flex flex-wrap gap-3">
            {analysisResult.recommendedMaterials.map((m, i) => (
              <span key={i} className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-white/30 transition-colors cursor-default">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Book Expert button - only show when idle */}
        {broadcastStatus === 'idle' && (
          <div className="mt-12 pt-10 border-t border-white/10">
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
