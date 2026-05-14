'use client';

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  category: string;
  status: string;
  address?: string;
  contactNumber?: string;
  estimatedCostRange?: string;
  rating?: number;
  technicianId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  declinedAt?: string;
  paymentStatus?: string;
}

export function DeclinedHistory({
  declinedJobs,
  showDeclined,
  setShowDeclined,
}: {
  declinedJobs: Job[];
  showDeclined: boolean;
  setShowDeclined: (val: boolean) => void;
}) {
  return (
    <section>
      <button
        onClick={() => setShowDeclined(!showDeclined)}
        className="flex justify-between items-center mb-6 w-full group"
      >
        <h2 className="text-xl font-black text-white flex items-center gap-3">
          Declined History
          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-xs rounded-lg">
            {declinedJobs.length}
          </span>
        </h2>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 group-hover:text-white transition-all ${showDeclined ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {showDeclined && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid gap-4 overflow-hidden"
          >
            {declinedJobs.length === 0 ? (
              <div className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest text-xs bg-white/5 border border-white/10 rounded-3xl shadow-sm">
                No declined bookings
              </div>
            ) : (
              declinedJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 group shadow-sm transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex flex-col xs:flex-row gap-4 sm:gap-5">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl shrink-0">
                        <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {job.category} Request
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                          {job.address || "No address provided"}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {job.estimatedCostRange && (
                            <span className="text-slate-400 font-medium text-xs">
                              ₹{job.estimatedCostRange}
                            </span>
                          )}
                          <span className="w-1 h-1 bg-white/10 rounded-full" />
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                            Declined{" "}
                            {job.createdAt
                              ? new Date(job.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  },
                                )
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                        Declined
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function TransactionLedger({
  transactions,
  showTransactions,
  setShowTransactions,
}: {
  transactions: any[];
  showTransactions: boolean;
  setShowTransactions: (val: boolean) => void;
}) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-[0.2em]">
          Transaction Ledger
        </h2>
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white"
        >
          {showTransactions ? "Hide Details" : "Open Ledger"}
        </button>
      </div>

      <AnimatePresence>
        {showTransactions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden"
          >
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-white/10 text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                        {txn.id.slice(0, 10).toUpperCase()}...
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              txn.type === "service_payment"
                                ? "text-emerald-400"
                                : "text-rose-400",
                            )}
                          >
                            {txn.type.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 font-bold">
                            REF: {txn.bookingId || txn.orderId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        className={cn(
                          "px-6 py-4 text-right font-black",
                          txn.type === "service_payment"
                            ? "text-emerald-400"
                            : "text-rose-400",
                        )}
                      >
                        {txn.type === "service_payment" ? "+" : "-"}₹
                        {txn.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-white/5">
              {transactions.map((txn) => (
                <div key={txn.id} className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        txn.type === "service_payment" ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {txn.type.replace("_", " ")}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold">REF: {txn.bookingId || txn.orderId}</span>
                    </div>
                    <span className={cn(
                      "text-sm font-black",
                      txn.type === "service_payment" ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {txn.type === "service_payment" ? "+" : "-"}₹{txn.amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span>{new Date(txn.createdAt).toLocaleDateString()}</span>
                    <span className="font-mono">{txn.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>

            {transactions.length === 0 && (
              <div className="p-12 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                No transaction history available
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
