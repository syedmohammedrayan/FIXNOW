'use client';

import React, { useState } from "react";
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
  AlertTriangle, 
  Wrench,
  Maximize2,
  Minimize2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/ui/map").then(mod => mod.Map), { ssr: false });
const MapControls = dynamic(() => import("@/components/ui/map").then(mod => mod.MapControls), { ssr: false });
const MapMarker = dynamic(() => import("@/components/ui/map").then(mod => mod.MapMarker), { ssr: false });
const MarkerContent = dynamic(() => import("@/components/ui/map").then(mod => mod.MarkerContent), { ssr: false });
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
  techLocation,
  customerLocation,
  liveAddress,
}: ActiveJobCardProps) {
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  if (!currentJob) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative group"
    >
      {actionDone === "completed" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-3xl rounded-[3rem] border border-white/10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="size-20 rounded-[2rem] bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="size-10 text-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              Mission Success
            </h3>
            <p className="text-emerald-400/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Protocol Terminated Successfully</p>
          </motion.div>
        </div>
      )}

      <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col xl:flex-row relative">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] blur-[100px] pointer-events-none" />

        <div className="flex flex-col w-full xl:flex-row">
          <div className="p-8 lg:p-12 flex-1 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  <span className="text-[11px] font-black tracking-[0.3em] uppercase text-emerald-400 italic">
                    Tactical Deployment
                  </span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase italic">
                  {currentJob.category}
                </h2>
                <div className="flex items-center gap-2 mt-2 opacity-50">
                  <Activity className="size-3 text-slate-400" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">
                    SIG-ID: #{currentJob.id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] italic shadow-xl">
                {jobStatus}
              </div>
            </div>

            {jobStatus !== "In Progress" ? (
              <>
                <div className="grid sm:grid-cols-2 gap-6 mb-12">
                  <div className="bg-white/[0.03] border border-white/[0.05] p-6 lg:p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center group/loc hover:border-white/10 transition-colors">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                      <MapPin className="size-3 text-cyan-400" />
                      Target Coordinates
                    </p>
                    <div className="flex items-center gap-4">
                      <p className="text-white font-bold text-sm lg:text-base leading-relaxed line-clamp-2 italic">
                        {liveAddress || currentJob.address || "Synchronizing Location..."}
                      </p>
                    </div>
                  </div>
                  
                  <a 
                    href={`tel:${currentJob.contactNumber}`}
                    className="bg-white/[0.03] border border-white/[0.05] p-6 lg:p-8 rounded-[2.5rem] shadow-2xl hover:bg-white/[0.05] hover:border-white/20 transition-all active:scale-[0.98] group/call flex flex-col justify-center"
                  >
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                      <Phone className="size-3 text-emerald-400" />
                      Client Comms
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-white font-black text-sm lg:text-lg tracking-[0.1em] truncate italic">
                        {currentJob.contactNumber || "ENCRYPTED"}
                      </p>
                      <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/call:bg-white group-hover/call:text-slate-950 transition-all duration-500">
                        <Phone className="size-4" />
                      </div>
                    </div>
                  </a>
                </div>

                <div className="flex flex-wrap gap-4 mb-8">
                  {["On the Way", "Arrived"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateJobStatus(s)}
                      className={cn(
                        "flex-1 min-w-[160px] py-6 rounded-[2rem] text-[11px] font-black transition-all uppercase tracking-[0.25em] border italic",
                        jobStatus === s
                          ? "bg-white text-slate-950 border-white shadow-[0_15px_40px_rgba(255,255,255,0.2)] scale-[1.02]"
                          : "bg-white/5 border border-white/10 text-slate-500 hover:border-white/30 hover:text-white",
                      )}
                    >
                      {s} Protocol
                    </button>
                  ))}
                </div>

                {jobStatus === "Arrived" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 p-8 sm:p-12 bg-white/[0.02] border border-white/[0.08] rounded-[3rem] backdrop-blur-3xl relative overflow-hidden group/otp shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover/otp:opacity-[0.08] transition-opacity duration-1000">
                      <ShieldCheck className="size-40 text-white" />
                    </div>
                    
                    <div className="relative z-10 text-center">
                      <div className="inline-flex items-center justify-center gap-3 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
                        <span className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Identity Verification</span>
                      </div>
                      <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter italic">Enter Client Passcode</h3>
                      <p className="text-slate-500 text-xs font-bold mb-10 opacity-60 tracking-wide">Enter the 4-digit security code provided by the client to initialize the mission.</p>
                      
                      <div className="flex gap-3 sm:gap-5 justify-center mb-10 sm:mb-12">
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
                                "w-14 h-20 sm:w-20 sm:h-24 text-center text-4xl sm:text-5xl font-black rounded-2xl bg-white/5 border-2 transition-all duration-500 focus:outline-none focus:scale-105 italic",
                                digit ? "border-cyan-500 text-white shadow-[0_0_30px_rgba(34,211,238,0.2)]" : "border-white/10 text-slate-800 focus:border-cyan-500/50"
                              )}
                            />
                            {digit && (
                              <motion.div 
                                layoutId="otp-accent"
                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" 
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {otpError && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-8 flex items-center justify-center gap-3 text-rose-500 bg-rose-500/10 py-4 rounded-2xl border border-rose-500/20"
                        >
                          <AlertTriangle className="size-5" />
                          <span className="text-xs font-black uppercase tracking-[0.2em]">{otpError}</span>
                        </motion.div>
                      )}

                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpPhase === "verifying"}
                        className="w-full py-6 bg-white text-slate-950 font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] transition-all shadow-[0_20px_50px_rgba(255,255,255,0.2)] flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 hover:bg-cyan-50"
                      >
                        {otpPhase === "verifying" ? (
                          <>
                            <Loader2 className="animate-spin size-5" />
                            <span>Authenticating Node...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="size-5" />
                            <span>Initialize Task Force</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {jobStatus !== "Arrived" && (
                  <div className="mt-10">
                    <Link
                      href={`/technician/service/${currentJob.id}`}
                      className="w-full py-6 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] hover:border-white/30 text-white font-black rounded-[2rem] transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] text-[11px] uppercase tracking-[0.3em] italic"
                    >
                      <Navigation className="size-5 text-cyan-400" />
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

          {jobStatus !== "In Progress" && (
            <div className={cn(
              "bg-slate-900/60 backdrop-blur-2xl relative group/map flex items-center justify-center transition-all duration-700 ease-in-out",
              isMapFullscreen 
                ? "fixed inset-0 z-[200] w-full h-full bg-slate-950" 
                : "w-full xl:w-[480px] min-h-[400px] xl:h-auto border-l border-white/10"
            )}>
              <button
                onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                className="absolute top-6 right-6 z-[110] p-4 bg-slate-900/90 border border-white/20 rounded-2xl text-white hover:bg-white hover:text-slate-950 transition-all shadow-2xl backdrop-blur-3xl active:scale-95 group-hover/map:scale-110"
              >
                {isMapFullscreen ? <Minimize2 className="size-6" /> : <Maximize2 className="size-6" />}
              </button>

              {!techLocation ? (
                <div className="text-center p-10">
                  <div className="size-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="size-8 text-slate-500 animate-spin" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                    Synchronizing Satellite Uplink...
                  </p>
                </div>
              ) : (
                <>
                  <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-slate-950/90 backdrop-blur-3xl rounded-2xl border border-white/10 flex items-center gap-3 shadow-2xl">
                    <span className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">
                      Live Telemetry Feed
                    </span>
                  </div>
                  <Map
                    center={[techLocation.lng, techLocation.lat]}
                    zoom={14}
                    className="w-full h-full"
                    styles={{
                      light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
                    }}
                  >
                    <MapControls position="top-right" showZoom showLocate className="mt-20 mr-4" />
                    <MapMarker longitude={techLocation.lng} latitude={techLocation.lat}>
                      <MarkerContent>
                        <div className="relative group/marker">
                          <div className="absolute -inset-6 bg-cyan-500/20 rounded-full animate-ping pointer-events-none" />
                          <div className="size-12 rounded-[1.25rem] bg-white border-2 border-slate-950 shadow-2xl flex items-center justify-center transform rotate-45 group-hover/marker:scale-110 transition-all duration-500">
                            <Wrench className="size-6 text-slate-950 -rotate-45" />
                          </div>
                        </div>
                      </MarkerContent>
                    </MapMarker>
                    {customerLocation && (
                      <MapMarker longitude={customerLocation.lng} latitude={customerLocation.lat}>
                        <MarkerContent>
                          <div className="relative">
                            <div className="absolute -inset-4 bg-emerald-500/20 rounded-full animate-pulse" />
                            <div className="size-10 rounded-full bg-emerald-500 border-2 border-white shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-500">
                              <MapPin className="size-5 text-white" />
                            </div>
                          </div>
                        </MarkerContent>
                      </MapMarker>
                    )}
                  </Map>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
