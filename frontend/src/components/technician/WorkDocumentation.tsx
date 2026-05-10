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
          <div className="glass-neon-card p-10 space-y-8 glass-panel border-white/40">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
              <div className="size-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileText className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Work Documentation
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Detail the service provided
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mb-2 px-1">
                  Describe Performed Work
                </label>
                <textarea
                  value={servicesDone}
                  onChange={(e) => setServicesDone(e.target.value)}
                  placeholder="E.g., Replaced faulty capacitor, tested voltage levels, cleaned air filters..."
                  className="w-full h-40 glass-panel border-white/10 border border-slate-200 rounded-2xl p-5 text-sm text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block px-1">
                  Spare Parts & Accessories
                </label>
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <div className="relative flex-1">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-indigo-300" />
                    <input
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      placeholder="Item Name"
                      className="w-full glass-panel border-white/10 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="relative w-full sm:w-32">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={newAccPrice}
                      onChange={(e) => setNewAccPrice(e.target.value)}
                      placeholder="Price"
                      className="w-full glass-panel border-white/10 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={addAccessory}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-lg transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="size-6" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessories.map((acc, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i}
                      className="flex justify-between items-center p-4 glass-panel border-white/10 rounded-2xl border border-slate-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-2 rounded-full bg-indigo-500" />
                        <span className="text-sm text-indigo-200 font-medium">
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
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
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
          <div className="sticky top-8 glass-panel border-white/10 rounded-[2.5rem] p-1 shadow-2xl overflow-hidden">
            <div className="glass-panel border-white/10 p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white">
                    SERVICE RECEIPT
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {currentJob.id}
                  </p>
                </div>
                <Printer className="size-6 text-slate-300" />
              </div>
              <div className="space-y-4 py-6 border-y border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-300 font-medium">
                    Base Service Fee
                  </span>
                  <span className="text-sm font-black text-white">
                    ₹{getBasePrice()}
                  </span>
                </div>
                {accessories.map((acc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-indigo-300 font-medium">
                      {acc.name}
                    </span>
                    <span className="text-sm font-black text-white">
                      ₹{acc.price}
                    </span>
                  </motion.div>
                ))}
                <div className="flex justify-between items-center text-slate-400 italic text-[10px]">
                  <span>GST (Integrated)</span>
                  <span>Included</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Total Amount
                  </span>
                  <span className="text-4xl font-black text-white">
                    ₹{calculateTotal()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleComplete()}
                disabled={completing || !servicesDone}
                className={cn(
                  "w-full py-6 rounded-[1.5rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95",
                  !servicesDone
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                )}
              >
                {completing ? (
                  <Loader2 className="animate-spin size-6" />
                ) : (
                  <>
                    <CheckCircle2 className="size-6" /> COMPLETE SERVICE
                  </>
                )}
              </button>
              {!servicesDone && (
                <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-wider">
                  Please document the work before finalizing
                </p>
              )}
            </div>
            <div className="bg-indigo-600 p-4 text-center">
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">
                Technician Signature Required Upon Success
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

