'use client';

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobQueueProps {
  activeJobs: any[];
  profile: any;
  acceptJob: (job: any) => void;
  declineJob: (id: string) => void;
}

export default function JobQueue({
  activeJobs,
  profile,
  acceptJob,
  declineJob,
}: JobQueueProps) {
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
          Dispatch Queue{" "}
          <span className="px-3 py-1 bg-white/5 border border-white/10 text-white text-xs rounded-full font-black">
            {activeJobs.length}
          </span>
        </h2>
      </div>
      <div className="grid gap-4">
        <AnimatePresence initial={false}>
          {activeJobs.map((job) => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 hover:border-cyan-500/50 rounded-[2rem] p-4 sm:p-6 transition-all group"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xl group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-xl shrink-0">
                    {job.category === "Electrical"
                      ? "⚡"
                      : job.category === "Plumbing"
                        ? "🔧"
                        : "🛠️"}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      {job.category} Request
                    </h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                      {job.address || "Local Radius • Syncing..."}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-cyan-400 font-black text-sm">
                        {job.estimatedCostRange}
                      </span>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em]">
                        Valuation
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (profile.online ? acceptJob(job) : null)}
                    disabled={!profile.online}
                    className={cn(
                      "flex-1 sm:flex-none px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2",
                      profile.online
                        ? "bg-white text-slate-950 hover:bg-slate-100 shadow-white/10"
                        : "bg-white/5 text-slate-700 cursor-not-allowed border border-white/5",
                    )}
                  >
                    <Zap className={cn("size-3.5", profile.online ? "text-cyan-500" : "text-slate-700")} />
                    {profile.online ? "Deploy" : "Offline"}
                  </button>
                  <button
                    onClick={() => declineJob(job.id)}
                    className="w-14 h-14 bg-white/5 border border-white/10 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all group-hover:border-rose-500/30"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {activeJobs.length === 0 && (
          <div className="p-16 text-center text-slate-600 font-black uppercase tracking-[0.3em] text-[10px] border-2 border-dashed border-white/5 rounded-[3rem] bg-white/2">
            Queue Empty • Scanning for Signals
          </div>
        )}
      </div>
    </section>
  );
}
