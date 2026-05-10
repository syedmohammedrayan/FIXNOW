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
          className={`w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-all ${showDeclined ? "rotate-180" : ""}`}
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
              <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs border border-slate-100 rounded-3xl glass-panel border-white/10 shadow-sm">
                No declined bookings
              </div>
            ) : (
              declinedJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel border-white/10 border border-slate-200 rounded-3xl p-6 group shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex gap-5">
                      <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-xl shrink-0">
                        <Ban className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          {job.category} Request
                        </h3>
                        <p className="text-indigo-300 text-sm mt-1">
                          {job.address || "No address provided"}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {job.estimatedCostRange && (
                            <span className="text-indigo-300 font-medium text-xs">
                              ₹{job.estimatedCostRange}
                            </span>
                          )}
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
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
                      <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest">
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
          className="px-6 py-2 glass-panel border-white/50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:glass-panel border-white/10 transition-all"
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
            className="glass-neon-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="glass-panel border-white/10 text-indigo-300 font-bold uppercase text-[9px] tracking-[0.2em] border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="hover:glass-panel border-white/10 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                        {txn.id.slice(0, 10)}...
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase tracking-widest",
                              txn.type === "service_payment"
                                ? "text-emerald-600"
                                : "text-rose-600",
                            )}
                          >
                            {txn.type.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-bold">
                            REF: {txn.bookingId || txn.orderId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-indigo-300 font-medium">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        className={cn(
                          "px-6 py-4 text-right font-black",
                          txn.type === "service_payment"
                            ? "text-emerald-600"
                            : "text-rose-600",
                        )}
                      >
                        {txn.type === "service_payment" ? "+" : "-"}₹
                        {txn.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  No transaction history available
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

