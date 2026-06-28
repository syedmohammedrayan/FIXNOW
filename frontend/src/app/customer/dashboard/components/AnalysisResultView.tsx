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
const AIResponseCard = dynamic(() => import('@/components/ai/AIResponseCard'), { ssr: false });

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

const getCategoryIcon = (category: string | undefined) => {
  const cat = (category || '').toLowerCase();
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
      <AIResponseCard
        problem={analysisResult.summary}
        confidence={analysisResult.confidence ?? 85}
        category={analysisResult.category}
        urgency={(analysisResult.urgency as any) || 'Medium'}
        estimatedCost={analysisResult.estimatedCostRange}
        reasoning={analysisResult.reasoning || `Analyzed ${analysisResult.category} specifications and symptoms to determine the most likely root cause. The issue requires specialized attention to prevent further component damage.`}
        recommendedRepair={analysisResult.recommendedRepair}
        estimatedTime={analysisResult.estimatedTime || '1-2 hours'}
        memoryUsed={analysisResult.memoryUsed ?? true}
        previousRepairsCount={analysisResult.previousRepairsCount ?? 3}
        requiredTools={analysisResult.requiredTools}
        requiredMaterials={analysisResult.requiredMaterials || analysisResult.recommendedMaterials}
        documentDetails={analysisResult.documentDetails}
      />

      {/* Book Expert button - only show when idle */}
      {broadcastStatus === 'idle' && (
        <div className="mt-8">
          <button 
            onClick={onBroadcastBook}
            className="group relative w-full px-8 py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs transition-all duration-300 active:scale-[0.98] shadow-2xl shadow-black/40 overflow-hidden flex items-center justify-center gap-4 btn-press"
          >
            <div className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-slate-900/10 flex items-center justify-center group-hover:bg-slate-900/20 transition-colors">
                <Activity className="w-4 h-4 text-slate-900" />
              </div>
              <span>
                {analysisResult.category === 'Document / Invoice' && analysisResult.documentDetails?.recommendedTechnicianCategory
                  ? `Initiate Booking for ${analysisResult.documentDetails.recommendedTechnicianCategory}`
                  : `Initiate Booking for ${analysisResult.category}`}
              </span>
            </div>
            <div className="absolute right-8 opacity-0 group-hover:opacity-30 group-hover:translate-x-2 transition-all duration-500">
              <MousePointer2 className="w-5 h-5 text-slate-900" />
            </div>
          </button>
        </div>
      )}

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
