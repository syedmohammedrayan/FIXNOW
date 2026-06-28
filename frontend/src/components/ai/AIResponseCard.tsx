'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Clock, IndianRupee, Wrench, Database, CheckCircle2, AlertTriangle, Info, Package, FileText, Calendar, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { slideUp } from '@/lib/animations';
import dynamic from 'next/dynamic';

const ConfidenceGauge = dynamic(() => import('./ConfidenceGauge'), { ssr: false });

interface AIResponseCardProps {
  /** Problem identified by AI */
  problem: string;
  /** AI confidence 0-100 */
  confidence: number;
  /** Category of technician needed */
  category: string;
  /** Urgency level */
  urgency: 'Low' | 'Medium' | 'High';
  /** Estimated cost range string */
  estimatedCost: string;
  /** AI reasoning summary */
  reasoning?: string;
  /** Recommended repair action */
  recommendedRepair?: string;
  /** Estimated repair time */
  estimatedTime?: string;
  /** Whether Hindsight memory was used */
  memoryUsed?: boolean;
  /** Number of previous repairs found in memory */
  previousRepairsCount?: number;
  /** Array of required tools */
  requiredTools?: string[];
  /** Array of required materials */
  requiredMaterials?: string[];
  /** Document specific extracted details */
  documentDetails?: {
    isFixNow?: boolean;
    productType?: string;
    warrantyDate?: string;
    warrantyValid?: boolean;
    amount?: number;
    specs?: string[];
  };
  /** Additional className */
  className?: string;
}

export default function AIResponseCard({
  problem,
  confidence,
  category,
  urgency,
  estimatedCost,
  reasoning,
  recommendedRepair,
  estimatedTime,
  memoryUsed = false,
  previousRepairsCount = 0,
  requiredTools = [],
  requiredMaterials = [],
  documentDetails,
  className,
}: AIResponseCardProps) {
  const urgencyConfig: Record<string, any> = {
    Critical: { color: 'text-rose-500', bg: 'bg-rose-600/20', border: 'border-rose-500/30', icon: AlertTriangle },
    High: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertTriangle },
    Medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Info },
    Low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
  };

  const uc = urgencyConfig[urgency] || urgencyConfig['Medium'];
  const UrgencyIcon = uc.icon;

  if (category === 'Document / Invoice') {
    return (
      <motion.div
        variants={slideUp}
        initial="initial"
        animate="animate"
        className={cn('card-elevated p-5 sm:p-7 md:p-8 space-y-6', className)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-overline text-white/50">Document Extracted</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="badge badge-ai">OCR Parsed</span>
                {documentDetails?.isFixNow && (
                  <span className="badge badge-success">
                    <CheckCircle2 className="w-3 h-3" /> FixNow
                  </span>
                )}
              </div>
            </div>
          </div>
          <ConfidenceGauge value={confidence} size={80} />
        </div>

        {/* Document Title / Product Type */}
        <div className="space-y-2">
          <p className="text-overline text-white/40">Product / Service Identified</p>
          <p className="text-white font-bold text-lg sm:text-xl leading-snug">
            {documentDetails?.productType || problem}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Warranty Status */}
          <div className={cn('card-stat flex flex-col gap-2', 
            documentDetails?.warrantyValid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
          )}>
            <div className="flex items-center gap-2">
              {documentDetails?.warrantyValid ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="text-overline text-white/40">Warranty</span>
            </div>
            <p className={cn('font-black text-xl', documentDetails?.warrantyValid ? 'text-emerald-400' : 'text-rose-400')}>
              {documentDetails?.warrantyValid ? 'VALID' : 'EXPIRED'}
            </p>
          </div>

          {/* Amount */}
          {(documentDetails?.amount && documentDetails.amount > 0) ? (
            <div className="card-stat flex flex-col gap-2 bg-slate-800/50 border-slate-700/50">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-3.5 h-3.5 text-white/40" />
                <span className="text-overline text-white/40">Amount</span>
              </div>
              <p className="font-black text-xl text-white">₹{documentDetails.amount.toLocaleString()}</p>
            </div>
          ) : (
            <div className="card-stat flex flex-col gap-2 bg-slate-800/50 border-slate-700/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-white/40" />
                <span className="text-overline text-white/40">Date</span>
              </div>
              <p className="font-black text-xl text-white">{documentDetails?.warrantyDate || 'N/A'}</p>
            </div>
          )}
        </div>

        {/* Specs / Extracted Details */}
        {documentDetails?.specs && documentDetails.specs.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-white/40" />
              <p className="text-overline text-white/40">Extracted Specifications</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {documentDetails.specs.map((spec, i) => (
                <div key={i} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80 flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning / Summary */}
        {reasoning && (
          <div className="space-y-2 pt-4 border-t border-white/[0.06]">
            <p className="text-overline text-white/40">Extraction Summary</p>
            <p className="text-body text-slate-300 leading-relaxed">{reasoning}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-overline text-white/30">Type</span>
            <span className="badge badge-neutral">{category}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Document Complete</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={slideUp}
      initial="initial"
      animate="animate"
      className={cn('card-elevated p-5 sm:p-7 md:p-8 space-y-6', className)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-overline text-white/50">AI Diagnosis</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="badge badge-ai">Powered by AI</span>
              {memoryUsed && (
                <span className="badge badge-info">
                  <Database className="w-3 h-3" /> Memory
                </span>
              )}
            </div>
          </div>
        </div>
        <ConfidenceGauge value={confidence} size={80} />
      </div>

      {/* Problem Statement */}
      <div className="space-y-2">
        <p className="text-overline text-white/40">Problem Identified</p>
        <p className="text-white font-bold text-lg sm:text-xl leading-snug">{problem}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Urgency */}
        <div className={cn('card-stat flex flex-col gap-2', uc.bg, uc.border)}>
          <div className="flex items-center gap-2">
            <UrgencyIcon className={cn('w-3.5 h-3.5', uc.color)} />
            <span className="text-overline text-white/40">Urgency</span>
          </div>
          <p className={cn('font-black text-xl uppercase', uc.color)}>{urgency}</p>
        </div>

        {/* Cost */}
        <div className="card-stat flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-3.5 h-3.5 text-white/40" />
            <span className="text-overline text-white/40">Est. Cost</span>
          </div>
          <p className="font-black text-xl text-white">₹{estimatedCost}</p>
        </div>

        {/* Time */}
        {estimatedTime && (
          <div className="card-stat flex flex-col gap-2 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/40" />
              <span className="text-overline text-white/40">Est. Time</span>
            </div>
            <p className="font-black text-xl text-white">{estimatedTime}</p>
          </div>
        )}
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="space-y-2 pt-4 border-t border-white/[0.06]">
          <p className="text-overline text-white/40">AI Reasoning Summary</p>
          <p className="text-body text-slate-300 leading-relaxed">{reasoning}</p>
        </div>
      )}

      {/* Recommended Repair */}
      {recommendedRepair && (
        <div className="space-y-2 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-white/40" />
            <p className="text-overline text-white/40">Recommended Repair</p>
          </div>
          <p className="text-body text-white font-semibold">{recommendedRepair}</p>
        </div>
      )}

      {/* Tools & Materials */}
      {(requiredTools?.length > 0 || requiredMaterials?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
          {requiredTools && requiredTools.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-white/40" />
                <p className="text-overline text-white/40">Required Tools</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {requiredTools.map((tool, i) => (
                  <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-white/80">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
          {requiredMaterials && requiredMaterials.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-white/40" />
                <p className="text-overline text-white/40">Required Materials</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {requiredMaterials.map((mat, i) => (
                  <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-xs text-white/80">
                    {mat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Memory Context */}
      {memoryUsed && previousRepairsCount > 0 && (
        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-caption text-emerald-400 font-bold">
              {previousRepairsCount} previous repair{previousRepairsCount > 1 ? 's' : ''} referenced
            </span>
          </div>
          <span className="badge badge-success">AI Enhanced</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-overline text-white/30">Category</span>
          <span className="badge badge-neutral">{category}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">AI Complete</span>
        </div>
      </div>
    </motion.div>
  );
}
