'use client';

import React from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Navigation, 
  Zap, 
  Loader2, 
  Activity,
  ShieldCheck,
  AlertTriangle 
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const PaymentScreen = dynamic(() => import("./PaymentScreen"), { ssr: false });
const WorkDocumentation = dynamic(() => import("./WorkDocumentation"), { ssr: false });

interface ActiveJobCardProps {
  currentJob: any;
  jobStatus: string;
  actionDone: string | null;
  updateJobStatus: (s: string) => void;
  otpInput: string[];
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleOtpChange: (i: number, val: string) => void;
  handleVerifyOtp: () => void;
  otpPhase: string;
  otpError: string;
  showPaymentScreen: boolean;
  setShowPaymentScreen: (s: boolean) => void;
  calculateTotal: () => number;
  handleConfirmPayment: (method: "QR" | "Cash") => void;
  handleRequestDigitalPayment: () => void;
  paymentRequested: boolean;
  completing: boolean;
  servicesDone: string;
  setServicesDone: (s: string) => void;
  newAccName: string;
  setNewAccName: (s: string) => void;
  newAccPrice: string;
  setNewAccPrice: (s: string) => void;
  addAccessory: () => void;
  accessories: any[];
  setAccessories: (a: any[]) => void;
  getBasePrice: () => number;
  handleComplete: (paidOverride?: boolean) => void;
  techLocation: { lat: number; lng: number } | null;
  customerLocation: { lat: number; lng: number } | null;
  liveAddress?: string;
}

export default function ActiveJobCard({
  currentJob,
  jobStatus,
  actionDone,
  updateJobStatus,
  otpInput,
  otpRefs,
  handleOtpChange,
  handleVerifyOtp,
  otpPhase,
  otpError,
  showPaymentScreen,
  setShowPaymentScreen,
  calculateTotal,
  handleConfirmPayment,
  handleRequestDigitalPayment,
  paymentRequested,
  completing,
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
  handleComplete,
  liveAddress,
}: ActiveJobCardProps) {
  if (!currentJob) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative group w-full max-w-4xl mx-auto"
    >
      {actionDone === "completed" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="size-24 rounded-[2rem] bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="size-12 text-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
              Mission Success
            </h3>
            <p className="text-emerald-400/80 text-xs font-bold uppercase tracking-[0.2em] mt-3">Protocol Terminated Successfully</p>
          </motion.div>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative z-10 w-full">
        {/* Decorative background effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="p-4 sm:p-8 lg:p-12 relative z-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                  <Zap className="size-4 text-cyan-400" />
                </div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-cyan-400">
                  Tactical Deployment
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                {currentJob.category}
              </h2>
              <div className="flex items-center gap-3 mt-3">
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                  <Activity className="size-3 text-slate-400" />
                  <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                    SIG-ID: #{currentJob.id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-black uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md flex items-center gap-2 sm:gap-3">
              <div className="size-2 sm:size-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              {jobStatus}
            </div>
          </div>

          {jobStatus !== "In Progress" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
                <div className="bg-slate-800/40 border border-white/10 p-5 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:bg-slate-800/60 hover:border-white/20 transition-all duration-300 group flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                    <MapPin className="size-24 text-white" />
                  </div>
                  <div className="flex items-center gap-3 mb-4 sm:mb-5 relative z-10">
                    <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                      <MapPin className="size-4 sm:size-5" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                      Target Coordinates
                    </p>
                  </div>
                  <p className="text-white font-medium text-sm sm:text-base lg:text-lg leading-relaxed relative z-10">
                    {liveAddress || currentJob.address || "Synchronizing Location..."}
                  </p>
                </div>
                
                <a 
                  href={`tel:${currentJob.contactNumber}`}
                  className="bg-slate-800/40 border border-white/10 p-5 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 active:scale-[0.98] group flex flex-col justify-center relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                    <Phone className="size-24 text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-3 mb-4 sm:mb-5 relative z-10">
                    <div className="size-8 sm:size-10 rounded-lg sm:rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Phone className="size-4 sm:size-5" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                      Client Comms
                    </p>
                  </div>
                  <p className="text-white font-bold text-base sm:text-lg lg:text-2xl tracking-[0.1em] relative z-10">
                    {currentJob.contactNumber || "ENCRYPTED"}
                  </p>
                </a>
              </div>

              <div className="mb-8 sm:mb-10 p-5 sm:p-7 rounded-[1.5rem] bg-slate-800/40 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                  <ShieldCheck className="size-32 text-white" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="size-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm uppercase tracking-widest">AI Work Plan</h4>
                      <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-0.5">Recommended repair sequence</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      `Inspect ${currentJob.category} core components`,
                      "Isolate primary fault domain",
                      "Execute targeted repair protocol",
                      "Run full diagnostic verification",
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                        <div className="size-5 rounded bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-white/50">{idx + 1}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10">
                {["On the Way", "Arrived"].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateJobStatus(s)}
                    className={cn(
                      "flex-1 py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] text-xs sm:text-[13px] font-bold transition-all uppercase tracking-[0.15em] border flex items-center justify-center gap-2 sm:gap-3",
                      jobStatus === s
                        ? "bg-gradient-to-r from-white to-slate-200 text-slate-900 border-white shadow-[0_10px_30px_rgba(255,255,255,0.2)] scale-[1.02]"
                        : "bg-slate-800/50 border-white/10 text-slate-400 hover:border-white/30 hover:text-white hover:bg-slate-800",
                    )}
                  >
                    {s === "On the Way" && <Navigation className="size-4" />}
                    {s === "Arrived" && <CheckCircle2 className="size-4" />}
                    {s} Protocol
                  </button>
                ))}
              </div>

              {jobStatus === "Arrived" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 sm:mb-10 p-6 sm:p-12 bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative overflow-hidden group/otp backdrop-blur-xl"
                >
                  <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-[0.02] group-hover/otp:opacity-[0.05] transition-opacity duration-1000 pointer-events-none">
                    <ShieldCheck className="size-32 sm:size-48 text-white" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
                    <div className="inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-1.5 sm:py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4 sm:mb-6">
                      <span className="size-1.5 sm:size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                      <span className="text-[10px] sm:text-xs font-bold text-cyan-400 uppercase tracking-[0.2em]">Identity Verification</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-3 sm:mb-4 uppercase tracking-tight">Client Passcode</h3>
                    <p className="text-slate-400 text-xs sm:text-sm mb-8 sm:mb-10 leading-relaxed max-w-sm">Enter the 4-digit security code provided by the client to initialize the mission protocol and commence work.</p>
                    
                    <div className="flex gap-4 sm:gap-6 justify-center mb-10">
                      {otpInput.map((digit, i) => (
                        <div key={i} className="relative group/field">
                          <input
                            ref={(el) => {
                              otpRefs.current[i] = el;
                            }}
                            type="text"
                            maxLength={1}
                            inputMode="numeric"
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            className={cn(
                              "w-12 h-16 sm:w-20 sm:h-24 text-center text-3xl sm:text-5xl font-black rounded-2xl bg-slate-950/50 border-2 transition-all duration-300 focus:outline-none focus:-translate-y-1",
                              digit ? "border-cyan-500 text-white shadow-[0_10px_20px_rgba(34,211,238,0.15)]" : "border-white/10 text-slate-500 focus:border-cyan-500/50 hover:border-white/20"
                            )}
                          />
                        </div>
                      ))}
                    </div>

                    {otpError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 w-full flex items-center justify-center gap-3 text-rose-400 bg-rose-500/10 py-4 rounded-xl border border-rose-500/20"
                      >
                        <AlertTriangle className="size-5" />
                        <span className="text-sm font-bold">{otpError}</span>
                      </motion.div>
                    )}

                    <button
                      onClick={handleVerifyOtp}
                      disabled={otpPhase === "verifying"}
                      className="w-full py-4 sm:py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold uppercase tracking-[0.15em] text-xs sm:text-sm rounded-xl sm:rounded-[1.5rem] transition-all shadow-[0_15px_30px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 sm:gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpPhase === "verifying" ? (
                        <>
                          <Loader2 className="animate-spin size-5" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-5" />
                          <span>Initialize Task Force</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {jobStatus !== "Arrived" && (
                <div className="mt-6 sm:mt-8 border-t border-white/10 pt-6 sm:pt-8">
                  <Link
                    href={`/technician/service/details?id=${currentJob.id}`}
                    className="w-full py-4 sm:py-6 bg-slate-800/40 border border-white/10 hover:bg-slate-700/60 hover:border-white/30 text-white font-bold rounded-xl sm:rounded-[1.5rem] transition-all duration-300 shadow-lg flex items-center justify-center gap-2 sm:gap-3 active:scale-[0.98] text-xs sm:text-sm uppercase tracking-[0.2em] group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="size-10 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/40 transition-colors border border-cyan-500/30 group-hover:scale-110">
                      <Navigation className="size-5 text-cyan-400" />
                    </div>
                    Initialize Tactical Map
                  </Link>
                </div>
              )}
            </>
          ) : showPaymentScreen ? (
            <PaymentScreen
              totalAmount={calculateTotal()}
              setShowPaymentScreen={setShowPaymentScreen}
              handleConfirmPayment={handleConfirmPayment}
              handleRequestDigitalPayment={handleRequestDigitalPayment}
              paymentRequested={paymentRequested}
              completing={completing}
            />
          ) : (
            <WorkDocumentation
              currentJob={currentJob}
              servicesDone={servicesDone}
              setServicesDone={setServicesDone}
              newAccName={newAccName}
              setNewAccName={setNewAccName}
              newAccPrice={newAccPrice}
              setNewAccPrice={setNewAccPrice}
              addAccessory={addAccessory}
              accessories={accessories}
              setAccessories={setAccessories}
              getBasePrice={getBasePrice}
              calculateTotal={calculateTotal}
              handleComplete={handleComplete}
              completing={completing}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

