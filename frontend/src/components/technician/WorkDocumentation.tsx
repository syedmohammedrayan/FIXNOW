'use client';

import React from "react";
import { motion } from "framer-motion";
import { FileText, Package, Plus, X, Printer, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkDocumentationProps {
  currentJob: any;
  servicesDone: string;
  setServicesDone: (val: string) => void;
  newAccName: string;
  setNewAccName: (val: string) => void;
  newAccPrice: string;
  setNewAccPrice: (val: string) => void;
  addAccessory: () => void;
  accessories: { name: string; price: number }[];
  setAccessories: (accs: { name: string; price: number }[]) => void;
  getBasePrice: () => number;
  calculateTotal: () => number;
  handleComplete: () => void;
  completing: boolean;
}

export default function WorkDocumentation({
  currentJob,
  servicesDone,
  setServicesDone,
  newAccName,
  setNewAccName,
  newAccPrice,
  setNewAccPrice,
  addAccessory,
  accessories,
  setAccessories,
  getBasePrice,
  calculateTotal,
  handleComplete,
  completing,
}: WorkDocumentationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-8"
    >
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-[1.5] space-y-8">
          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-5 sm:p-10 rounded-[2.5rem] shadow-2xl">
            <div className="flex items-center gap-3 pb-6 border-b border-white/5">
              <div className="size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                <FileText className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  Work Documentation
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Detail the service provided
                </p>
              </div>
            </div>
            <div className="space-y-6 mt-8">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">
                  Describe Performed Work
                </label>
                <textarea
                  value={servicesDone}
                  onChange={(e) => setServicesDone(e.target.value)}
                  placeholder="E.g., Replaced faulty capacitor, tested voltage levels, cleaned air filters..."
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-white outline-none resize-none transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">
                  Spare Parts & Components
                </label>
                <div className="flex flex-wrap sm:flex-nowrap gap-3">
                  <div className="relative flex-1">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <input
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      placeholder="Item Name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-white outline-none"
                    />
                  </div>
                  <div className="relative w-full sm:w-32">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={newAccPrice}
                      onChange={(e) => setNewAccPrice(e.target.value)}
                      placeholder="Price"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-white outline-none"
                    />
                  </div>
                  <button
                    onClick={addAccessory}
                    className="p-3 bg-white hover:bg-slate-100 rounded-xl text-slate-950 shadow-lg transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="size-6" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessories.map((acc, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={`${acc.name}-${i}`}
                      className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-2xl group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                        <span className="text-sm text-slate-300 font-bold">
                          {acc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-white">
                          ₹{acc.price}
                        </span>
                        <button
                          onClick={() =>
                            setAccessories(
                              accessories.filter((_, idx) => idx !== i)
                            )
                          }
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-500 transition-all"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="sticky top-8 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
                    SERVICE LEDGER
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
                    TXN-{currentJob.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <Printer className="size-6 text-slate-500" />
              </div>
              <div className="space-y-4 py-6 border-y border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400 font-bold">
                    Base Service Protocol
                  </span>
                  <span className="text-sm font-black text-white">
                    ₹{getBasePrice()}
                  </span>
                </div>
                {accessories.map((acc, i) => (
                  <motion.div
                    key={`ledger-${acc.name}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-slate-400 font-bold">
                      {acc.name}
                    </span>
                    <span className="text-sm font-black text-white">
                      ₹{acc.price}
                    </span>
                  </motion.div>
                ))}
                <div className="flex justify-between items-center text-slate-600 italic text-[10px] font-black uppercase tracking-widest">
                  <span>GST (Inclusive)</span>
                  <span>18.0%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Total Valuation
                  </span>
                  <span className="text-4xl font-black text-white tracking-tighter">
                    ₹{calculateTotal()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleComplete()}
                disabled={completing || !servicesDone}
                className={cn(
                  "w-full py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95",
                  !servicesDone
                    ? "bg-white/5 text-slate-700 cursor-not-allowed border border-white/5"
                    : "bg-white text-slate-950 hover:bg-slate-100 shadow-white/10"
                )}
              >
                {completing ? (
                  <Loader2 className="animate-spin size-6" />
                ) : (
                  <>
                    <CheckCircle2 className="size-6" /> Complete Service
                  </>
                )}
              </button>
              {!servicesDone && (
                <p className="text-[10px] text-center text-slate-600 font-black uppercase tracking-widest">
                  Documentation Required
                </p>
              )}
            </div>
            <div className="bg-white/5 border-t border-white/10 p-4 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                Secure Transmission Active
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
