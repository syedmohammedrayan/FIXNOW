"use client";

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
  AlertTriangle,
  Wrench
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
  if (!currentJob) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative group"
    >
      {actionDone === "completed" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center glass-panel border-white/90 backdrop-blur-sm rounded-[2rem]">
          <div className="text-center">
            <CheckCircle2 className="size-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-white">
              Service Completed!
            </h3>
          </div>
        </div>
      )}

      <div className="glass-neon-card p-0 shadow-2xl overflow-x-auto flex border-none glass-panel border-white/80 backdrop-blur-2xl">
        <div className="flex min-w-[900px] w-full">
          <div className="p-8 lg:p-10 flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-600">
                    Active Service Task
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  {currentJob.category} Service
                </h2>
                <p className="text-indigo-300 mt-1 font-medium text-sm">
                  Booking ID: {currentJob.id.toUpperCase()}
                </p>
              </div>
              <div className="px-5 py-2.5 rounded-2xl bg-indigo-50 border border-slate-800 text-indigo-300 text-sm font-bold uppercase tracking-wider">
                {jobStatus}
              </div>
            </div>

            {jobStatus !== "In Progress" ? (
              <>
                <div className="grid sm:grid-cols-2 gap-6 mb-10">
                  <div className="glass-panel border-white/40 backdrop-blur-md p-5 lg:p-6 rounded-[2rem] border border-white/60 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] lg:tracking-[0.2em] mb-4">
                      Service Protocol Location
                    </p>
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <MapPin className="size-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-xs lg:text-sm leading-relaxed line-clamp-2">
                          {liveAddress || currentJob.address || "Locating..."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <a 
                    href={`tel:${currentJob.contactNumber}`}
                    className="glass-panel border-white/40 backdrop-blur-md p-5 lg:p-6 rounded-[2rem] border border-white/60 shadow-sm hover:border-emerald-500/50 transition-all active:scale-[0.98] group/call flex flex-col justify-center"
                  >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] lg:tracking-[0.2em] mb-4">
                      Secure Client Line
                    </p>
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover/call:bg-emerald-500 group-hover/call:text-white transition-colors">
                        <Phone className="size-5 text-emerald-600 group-hover/call:text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-xs lg:text-sm tracking-wider truncate">
                          {currentJob.contactNumber || "Contact Encrypted"}
                        </p>
                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1 opacity-0 group-hover/call:opacity-100 transition-opacity truncate">
                          Click to Connect
                        </p>
                      </div>
                    </div>
                  </a>
                </div>

                <div className="flex flex-wrap gap-4">
                  {["On the Way", "Arrived"].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateJobStatus(s)}
                      className={cn(
                        "flex-1 min-w-[140px] py-5 rounded-[1.5rem] text-[10px] font-black transition-all uppercase tracking-[0.2em] border-2",
                        jobStatus === s
                          ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20"
                          : "glass-panel border-white/50 text-indigo-300 border-slate-200/60 hover:border-indigo-400 hover:text-indigo-600",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {jobStatus === "Arrived" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 p-10 bg-slate-900/50 border border-slate-700/50 rounded-[3rem] backdrop-blur-2xl relative overflow-hidden group/otp shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <ShieldCheck className="size-24 text-indigo-500" />
                    </div>
                    
                    <div className="relative z-10 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Secure Authorization</span>
                      </div>
                      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Enter Client Passcode</h3>
                      <p className="text-slate-400 text-xs font-bold mb-8 opacity-70">Verify the 4-digit security code from the client to start the session.</p>
                      
                      <div className="flex gap-4 justify-center mb-10">
                        {otpInput.map((digit, i) => (
                          <div key={i} className="relative">
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
                                "w-16 h-20 text-center text-4xl font-black rounded-2xl bg-slate-800/40 border-2 transition-all duration-300 focus:outline-none focus:scale-105",
                                digit ? "border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]" : "border-slate-700 text-slate-500 focus:border-indigo-400"
                              )}
                            />
                            {digit && (
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-500 rounded-full" />
                            )}
                          </div>
                        ))}
                      </div>

                      {otpError && (
                        <div className="mb-6 flex items-center justify-center gap-2 text-rose-500 bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">
                          <AlertTriangle className="size-4" />
                          <span className="text-xs font-black uppercase tracking-widest">{otpError}</span>
                        </div>
                      )}

                      <button
                        onClick={handleVerifyOtp}
                        disabled={otpPhase === "verifying"}
                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50"
                      >
                        {otpPhase === "verifying" ? (
                          <>
                            <Loader2 className="animate-spin size-5" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="size-5" />
                            <span>Authorize & Start Service</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {jobStatus !== "Arrived" && (
                  <div className="mt-8">
                    <Link
                      href={`/technician/service/${currentJob.id}`}
                      className="w-full py-5 glass-panel border-white/10 border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-300 font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3 active:scale-[0.98] text-base"
                    >
                      <Navigation className="size-5" />
                      Launch Service Map
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
            <div className="w-full xl:w-[400px] h-[350px] xl:h-auto bg-slate-800/40 backdrop-blur-md border-l border-slate-200 relative group/map flex items-center justify-center">
              {!techLocation ? (
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-slate-800 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                    Locating Expert...
                  </p>
                </div>
              ) : (
                <>
                  <div className="absolute top-4 left-4 z-10 px-3 py-1.5 glass-panel border-white/80 backdrop-blur-md rounded-xl border border-slate-200 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-indigo-600" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      Live Telemetry
                    </span>
                  </div>
                  <Map
                    center={[techLocation.lng, techLocation.lat]}
                    zoom={14}
                    styles={{
                      light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
                    }}
                  >
                    <MapControls position="top-right" showZoom showLocate className="mt-12 mr-2" />
                    <MapMarker longitude={techLocation.lng} latitude={techLocation.lat}>
                      <MarkerContent>
                        <div className="relative">
                          <div className="absolute -inset-4 bg-indigo-500/20 rounded-full animate-ping pointer-events-none" />
                          <div className="size-10 rounded-2xl bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center transform rotate-45 group-hover/map:scale-110 transition duration-300">
                            <Wrench className="w-5 h-5 text-white -rotate-45" />
                          </div>
                        </div>
                      </MarkerContent>
                    </MapMarker>
                    {customerLocation && (
                      <MapMarker longitude={customerLocation.lng} latitude={customerLocation.lat}>
                        <MarkerContent>
                          <div className="size-10 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center group-hover/map:scale-110 transition duration-300">
                            <MapPin className="w-5 h-5 text-white" />
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
