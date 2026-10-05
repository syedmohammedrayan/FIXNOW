'use client';

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Wrench, Zap, Hammer } from "lucide-react";
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
        <h2 className="text-xl font-semibold text-white flex items-center gap-3">
          Dispatch Queue
          <span className="px-2.5 py-0.5 bg-white/10 border border-white/10 text-slate-300 text-xs rounded-lg font-medium">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all shadow-sm"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-5 sm:gap-4 sm:items-center">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-300 shrink-0">
                    {job.category === "Electrical" ? <Zap className="w-5 h-5" /> : job.category === "Plumbing" ? <Wrench className="w-5 h-5" /> : <Hammer className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base font-semibold text-white">
                      {job.category} Service
                    </h3>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {job.address || "Fetching address..."}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-emerald-400 font-medium text-sm">
                        ₹{job.estimatedCostRange}
                      </span>
                      <span className="w-1 h-1 bg-white/20 rounded-full" />
                      <span className="text-slate-500 text-xs font-medium">
                        Estimated
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => (profile.online ? acceptJob(job) : null)}
                    disabled={!profile.online}
                    className={cn(
                      "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                      profile.online
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                        : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                    )}
                  >
                    <Check className="w-4 h-4" />
                    {profile.online ? "Accept" : "Offline"}
                  </button>
                  <button
                    onClick={() => declineJob(job.id)}
                    className="w-11 h-11 bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {activeJobs.length === 0 && (
          <div className="py-12 text-center text-slate-500 font-medium text-sm bg-white/[0.02] border border-white/5 rounded-2xl">
            No active requests in your queue.
          </div>
        )}
      </div>
    </section>
  );
}
