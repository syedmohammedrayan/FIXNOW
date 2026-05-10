"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle } from "lucide-react";
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
        <h2 className="text-xl font-black text-white flex items-center gap-3">
          Dispatch Queue{" "}
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-lg font-bold">
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
              className="glass-panel border-white/10 border border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 rounded-3xl p-6 transition-all group"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                <div className="flex gap-5">
                  <div className="w-14 h-14 glass-panel border-white/10 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {job.category === "Electrical"
                      ? "⚡"
                      : job.category === "Plumbing"
                        ? "🔧"
                        : "🛠️"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {job.category} Request
                    </h3>
                    <p className="text-indigo-300 text-sm mt-1">
                      {job.address || "Local Radius • 2.4km"}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-emerald-600 font-black text-sm">
                        {job.estimatedCostRange}
                      </span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                        Estimate
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (profile.online ? acceptJob(job) : null)}
                    disabled={!profile.online}
                    className={cn(
                      "flex-1 sm:flex-none px-8 py-3 rounded-2xl text-sm font-black transition-all shadow-lg",
                      profile.online
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
                        : "bg-slate-500/50 text-slate-300 cursor-not-allowed border border-white/5",
                    )}
                  >
                    {profile.online ? "Deploy" : "Offline"}
                  </button>
                  <button
                    onClick={() => declineJob(job.id)}
                    className="w-12 h-12 glass-panel border-white/10 hover:bg-rose-50 text-slate-400 hover:text-white border border-slate-100 rounded-2xl flex items-center justify-center transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {activeJobs.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border border-slate-100 rounded-3xl glass-panel border-white/10 shadow-sm">
            Queue Empty • Listening for signals
          </div>
        )}
      </div>
    </section>
  );
}
