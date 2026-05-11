"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Star,
  Clock,
  CheckCircle2,
  X,
  XCircle,
  Activity,
  Briefcase,
  MapPin,
  Radio,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Upload
} from "lucide-react";
import { getAvatarUrl } from "@/lib/image-utils";
import dynamic from "next/dynamic";
import { API_BASE } from "@/lib/config";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useRouter } from "next/navigation";
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { useTechnicianData } from "./hooks/useTechnicianData";

// Components
import TechnicianSidebar from "@/components/technician/Sidebar";
import { StatCard, MetricRow, ServiceManifest } from "@/components/technician/DashboardComponents";
import { DeclinedHistory, TransactionLedger } from "@/components/technician/LedgerComponents";
import IdVerificationBox from "@/components/technician/IdVerificationBox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Dynamic Components

const ProfileSettings = dynamic(() => import("@/components/technician/ProfileSettings"), { ssr: false });
const TechnicianHeader = dynamic(() => import("@/components/technician/Header"), { ssr: false });
const ActiveJobCard = dynamic(() => import("@/components/technician/ActiveJobCard"), { ssr: false });
const JobQueue = dynamic(() => import("@/components/technician/JobQueue"), { ssr: false });

export default function TechnicianDashboard() {
  const { currentKey, rotateKey } = useGoogleMapsKey();
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        // Only redirect if truly no user after a small grace period
        const t = setTimeout(() => {
          if (!auth.currentUser) router.push('/auth/login?role=technician');
        }, 2000);
        return () => clearTimeout(t);
      } else {
        try {
          const res = await fetch(`${API_BASE}/api/users/${u.uid}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user && data.user.role !== 'technician') {
              await auth.signOut();
              router.replace('/auth/login?role=technician');
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
    return () => unsub();
  }, [router]);

  const {
    user,
    profile, setProfile,
    activeJobs,
    currentJob, setCurrentJob,
    jobStatus, setJobStatus,
    declinedJobs,
    socket,
    techLocation, setTechLocation,
    customerLocation,
    transactions,
    notification, setNotification,
    availableBroadcasts,
    missedBroadcast, setMissedBroadcast,
    cancelledBooking, setCancelledBooking,
    acceptJob,
    acceptBroadcast,
    declineJob,
    updateJobStatus,
    bellNotifications, setBellNotifications,
    markNotificationRead
  } = useTechnicianData();

  const [currentView, setCurrentView] = useState("dashboard");
  const [showDeclined, setShowDeclined] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [otpPhase, setOtpPhase] = useState<"idle" | "verifying" | "verified">("idle");
  const [otpInput, setOtpInput] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [servicesDone, setServicesDone] = useState<string>("");
  const [accessories, setAccessories] = useState<{ name: string; price: number }[]>([]);
  const [newAccName, setNewAccName] = useState("");
  const [newAccPrice, setNewAccPrice] = useState("");
  const [completing, setCompleting] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [actionDone, setActionDone] = useState<"completed" | null>(null);
  const [liveAddress, setLiveAddress] = useState<string>("");
  const [googleReady, setGoogleReady] = useState(false);
  const [showIdVerification, setShowIdVerification] = useState(false);

  useEffect(() => {
    const handleHashAndSearch = () => {
      const hasProfile = typeof window !== 'undefined' && (window.location.hash === "#profile" || window.location.search.includes("view=profile"));
      if (hasProfile) setCurrentView("profile");
      else setCurrentView("dashboard");
    };
    handleHashAndSearch();
    const interval = setInterval(handleHashAndSearch, 200);
    window.addEventListener("hashchange", handleHashAndSearch);
    return () => {
      clearInterval(interval);
      window.removeEventListener("hashchange", handleHashAndSearch);
    };
  }, []);

  useEffect(() => {
    if (!profile.online || !socket || !user) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = { lat: latitude, lng: longitude };
        setTechLocation(loc);
        if (socket?.connected) {
          socket.emit("update_location", {
            bookingId: currentJob?.id || "idle",
            location: loc,
            techId: user.uid,
          });
        }
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [profile.online, socket, user, currentJob?.id, setTechLocation]);

  // Google Maps Script Loader for Geocoding
  useEffect(() => {
    if (window.google) {
      setGoogleReady(true);
      return;
    }
    const scriptId = 'google-maps-geocoder-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${currentKey}&libraries=places,geometry`;
      script.async = true;
      script.onload = () => setGoogleReady(true);
      script.onerror = () => {
        console.error("Google Maps script load failed. Rotating key...");
        rotateKey();
      };
      document.head.appendChild(script);
    }
  }, [currentKey, rotateKey]);

  // Reverse Geocoding for Dashboard
  useEffect(() => {
    const runGeocode = () => {
      if (!window.google?.maps?.Geocoder) return;
      
      // Use live location first, then fallback to current job's stored coords
      const loc = customerLocation || (currentJob?.customerLocation) || (currentJob?.customerLat ? { lat: currentJob.customerLat, lng: currentJob.customerLng } : null);
      
      if (!loc) return;
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: loc }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          setLiveAddress(results[0].formatted_address);
        } else {
          console.warn("Dashboard Geocode Status:", status);
          // If geocoding fails but we have coords, show coords as last resort
          if (!liveAddress) setLiveAddress(`${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
        }
      });
    };

    if (googleReady) {
      runGeocode();
    } else {
      const t = setTimeout(runGeocode, 1000);
      return () => clearTimeout(t);
    }
  }, [customerLocation, currentJob?.id, googleReady]);

  // ─── Approval Gate ───
  if (profile.name !== "Loading..." && profile.approved !== true) {
    const isUploaded = profile.verificationStatus === 'uploaded';
    const isRejected = profile.verificationStatus === 'rejected';

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-10 sm:p-16 rounded-[3rem] shadow-2xl relative z-10"
        >
          <div className="size-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
            {isRejected ? (
              <XCircle className="size-12 text-rose-400 animate-pulse" />
            ) : isUploaded ? (
              <Activity className="size-12 text-white animate-pulse" />
            ) : (
              <ShieldAlert className="size-12 text-amber-400 animate-bounce" />
            )}
          </div>
          
          <h1 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase italic">
            {isRejected ? 'Verification Failed' : isUploaded ? 'Review In Progress' : 'Identity Protocol Required'}
          </h1>
          <p className="text-slate-400 font-medium leading-relaxed mb-12 max-w-lg mx-auto">
            {isRejected 
              ? `Your credentials were not verified: ${profile.rejectionReason || 'Please re-upload a clear ID.'}`
              : isUploaded 
                ? "Your professional profile is currently being reviewed by our command center. Expect access within 2-4 hours."
                : `Welcome to the elite network, ${profile.name}. Your account is locked until we verify your professional standing.`}
          </p>

          {!isUploaded ? (
            <div className="mb-12">
              <IdVerificationBox 
                userId={user?.uid || ""} 
                onSuccess={(url) => {
                  setProfile((prev: any) => ({ ...prev, govIdUrl: url, verificationStatus: 'uploaded' }));
                }}
                existingIdUrl={profile.govIdUrl}
              />
            </div>
          ) : (
            <div className="space-y-4 mb-10 max-w-md mx-auto">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-left">
                <div className="size-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Document Status</p>
                  <p className="text-sm text-emerald-400 font-black mt-0.5 uppercase tracking-tighter">Securely Uploaded</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 text-left">
                <div className="size-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Activity className="size-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Approval Queue</p>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">Estimated activation: 2-4 business hours</p>
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => window.location.href = '/'}
            className="px-12 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] text-sm"
          >
            Return to Fleet Hangar
          </button>
        </motion.div>
        
        <p className="mt-12 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] relative z-10">
          FixNow Pro • Secure Infrastructure • Alpha-v4.0.2
        </p>
      </div>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    setUploadingAvatar(true);
    setAvatarMenuOpen(false);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.post(`${API_BASE}/api/users/${user.uid}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        setProfile((prev: any) => ({ ...prev, avatar: getAvatarUrl(res.data.avatar) || res.data.avatar }));
      }
    } catch (err) {
      console.error("Failed to upload avatar", err);
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!user || !profile.avatar) return;
    setUploadingAvatar(true);
    setAvatarMenuOpen(false);
    try {
      setProfile((prev: any) => ({ ...prev, avatar: undefined }));
      // Use backend API to clear avatar (consistent with upload path)
      await axios.post(`${API_BASE}/api/users/${user.uid}/update-profile`, { avatar: null });
    } catch (err) {
      console.error("Failed to delete avatar", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpInput];
    next[i] = val.slice(-1);
    setOtpInput(next);
    if (val && i < 3) otpRefs.current[i + 1]?.focus();
    if (!val && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    if (!currentJob) return;
    const otp = otpInput.join("");
    if (otp.length < 4) {
      setOtpError("Enter 4 digits");
      return;
    }
    setOtpPhase("verifying");
    setOtpError("");
    try {
      const res = await axios.post(`${API_BASE}/api/bookings/verify-otp`, {
        bookingId: currentJob.id,
        otp,
        technicianId: user?.uid,
      });
      if (res.data.success) {
        setOtpPhase("verified");
        setJobStatus("In Progress");
      } else {
        setOtpError("Invalid OTP");
        setOtpPhase("idle");
      }
    } catch (e: any) {
      setOtpError(e.response?.data?.error || "Verification failed");
      setOtpPhase("idle");
    }
  };

  const BASE_PRICES: Record<string, number> = {
    'Plumbing': 599,
    'Electrician': 499,
    'HVAC / AC Technician': 799,
    'Carpentry': 699,
    'Cleaning Services': 899,
    'Painter': 1499,
    'Renovation Service': 1299,
    'Kitchen Services Technician': 649,
    'Refrigerator Technician': 749,
    'Washing Machine Technician': 699,
    'Water Systems Technician': 549,
    'Electronics & Smart Home': 699,
    'Gas & Utilities': 599,
    'Bike Mechanics': 449,
    'Car Mechanics': 899,
    'Moving & Misc': 1199,
    'Rural Area Technicians': 499,
    'Pest Control': 999,
    'Installation Services Technician': 399,
    'General': 499
  };

  const getBasePrice = () => {
    if (!currentJob) return 499;
    if (currentJob.estimatedCostRange) {
      const parts = currentJob.estimatedCostRange.split("-");
      const firstPart = parts[0].replace(/[^\d]/g, "");
      const parsed = parseFloat(firstPart);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return BASE_PRICES[currentJob.category] || BASE_PRICES["General"];
  };

  const calculateTotal = () => {
    const base = getBasePrice();
    const extra = accessories.reduce((sum, acc) => sum + acc.price, 0);
    return base + extra;
  };

  const addAccessory = () => {
    if (!newAccName || !newAccPrice) return;
    setAccessories([...accessories, { name: newAccName, price: parseFloat(newAccPrice) }]);
    setNewAccName("");
    setNewAccPrice("");
  };

  const handleComplete = async (paidOverride?: boolean) => {
    if (!currentJob) return;
    const finalIsPaid = paidOverride ?? isPaid;
    if (!finalIsPaid && currentJob.paymentStatus !== "Paid") {
      setShowPaymentScreen(true);
      return;
    }
    setCompleting(true);
    try {
      await axios.post(`${API_BASE}/api/bookings/update-status`, {
        bookingId: currentJob.id,
        status: "Completed",
        servicesDone,
        accessories,
        totalAmount: calculateTotal(),
        isPaid: finalIsPaid,
        technicianId: user?.uid,
      });
      setActionDone("completed");
      setShowPaymentScreen(false);
      setTimeout(() => {
        setCurrentJob(null);
        setActionDone(null);
        setServicesDone("");
        setAccessories([]);
        setIsPaid(false);
      }, 3000);
    } catch (e) {
      console.error("Complete error:", e);
      alert("Failed to complete job.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <TechnicianSidebar />
      
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 30, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className={cn(
              "fixed top-0 left-1/2 z-[9999] px-4 sm:px-8 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl flex items-center gap-3 sm:gap-5 border-2 font-black text-xs sm:text-sm uppercase tracking-wider w-[calc(100%-2rem)] sm:w-auto sm:min-w-[450px] max-w-[95vw] backdrop-blur-xl",
              notification.type === 'success' ? "bg-emerald-600/90 text-white border-emerald-400" :
              notification.type === 'error' ? "bg-rose-600/90 text-white border-rose-400" :
              "bg-slate-900/90 text-white border-white/10"
            )}
          >
            <div className="w-12 h-12 rounded-2xl glass-panel border-white/20 flex items-center justify-center shadow-inner">
              {notification.type === 'success' ? <CheckCircle2 className="w-7 h-7" /> : <Activity className="w-7 h-7" />}
            </div>
            <div className="flex-1">
              <p className="opacity-70 text-[10px] mb-1 font-bold text-slate-400 uppercase tracking-widest">System Broadcast</p>
              <p className="leading-tight">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="p-2 hover:glass-panel border-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pl-0 md:pl-[78px] lg:pl-[280px] pt-20 md:pt-0 min-h-screen transition-all duration-500">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto overflow-x-hidden">
          <TechnicianHeader 
            profile={profile}
            setProfile={setProfile}
            user={user}
            API_BASE={API_BASE}
            avatarMenuOpen={avatarMenuOpen}
            setAvatarMenuOpen={setAvatarMenuOpen}
            uploadingAvatar={uploadingAvatar}
            fileInputRef={fileInputRef}
            handleAvatarDelete={handleAvatarDelete}
            handleAvatarUpload={handleAvatarUpload}
            bellNotifications={bellNotifications}
            setBellNotifications={setBellNotifications}
            markNotificationRead={markNotificationRead}
            currentJob={currentJob}
          />

          {currentView === "profile" ? (
            <ProfileSettings user={user} profile={profile} setProfile={setProfile} />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
                <StatCard icon={<DollarSign className="w-5 h-5" />} label="Gross Earnings" value={`₹${profile.earnings.toLocaleString()}`} trend="+12% from last week" color="cyan" />
                <StatCard icon={<Star className="w-5 h-5" />} label="Service Rating" value={`${profile.rating.toFixed(1)}`} trend="Highly Rated" color="emerald" />
                <StatCard icon={<Briefcase className="w-5 h-5" />} label="Total Tasks" value={profile.totalJobs.toString()} trend="+3 completed today" color="slate" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Current Availability" value={profile.online ? "ONLINE" : "OFFLINE"} trend={profile.online ? "Ready for assignments" : "Not accepting jobs"} color={profile.online ? "emerald" : "slate"} />
              </div>

              <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <AnimatePresence mode="wait">
                    {currentJob ? (
                      <ActiveJobCard 
                        currentJob={currentJob}
                        jobStatus={jobStatus}
                        actionDone={actionDone}
                        updateJobStatus={updateJobStatus}
                        otpInput={otpInput}
                        otpRefs={otpRefs}
                        handleOtpChange={handleOtpChange}
                        handleVerifyOtp={handleVerifyOtp}
                        otpPhase={otpPhase}
                        otpError={otpError}
                        showPaymentScreen={showPaymentScreen}
                        setShowPaymentScreen={setShowPaymentScreen}
                        calculateTotal={calculateTotal}
                        handleConfirmPayment={(method) => {
                          setIsPaid(true);
                          setShowPaymentScreen(false);
                          handleComplete(true);
                        }}
                        completing={completing}
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
                        handleComplete={handleComplete}
                        techLocation={techLocation}
                        customerLocation={customerLocation}
                        liveAddress={liveAddress}
                       />
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[300px] bg-slate-900/50 backdrop-blur-3xl border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-10 relative overflow-hidden group/empty">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
                        <div className="relative z-10">
                          <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl border border-white/10 relative group">
                            <div className="absolute inset-0 bg-white/10 rounded-[2rem] animate-ping opacity-20" />
                            <Activity className="w-12 h-12 text-white transition-transform duration-500 group-hover:scale-110" />
                          </div>
                          <h3 className="text-2xl font-black text-white tracking-tight">No Active Assignments</h3>
                          <p className="text-slate-500 mt-2 max-w-xs mx-auto text-[11px] font-bold uppercase tracking-widest leading-relaxed opacity-80">Your console is synchronized. Incoming requests will appear here in real-time.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {availableBroadcasts.map((broadcast) => {
                      const elapsedSec = broadcast.receivedAt ? Math.floor((Date.now() - broadcast.receivedAt) / 1000) : 0;
                      const elapsedMin = Math.floor(elapsedSec / 60);
                      const elapsedStr = elapsedMin > 0 ? `${elapsedMin}m ago` : `${elapsedSec}s ago`;
                      
                      return (
                        <motion.div 
                          key={broadcast.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-slate-900/90 backdrop-blur-3xl p-6 sm:p-8 mb-6 border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent animate-pulse" />
                          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                  <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
                                  Live Broadcast
                                </span>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{elapsedStr}</span>
                              </div>
                              <h3 className="text-xl font-black text-white mb-1">
                                {broadcast.customerName || broadcast.customer_name || 'Valued Customer'} • {broadcast.category}
                              </h3>
                              {broadcast.address && (
                                <div className="flex items-center gap-1.5 mb-2">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <p className="text-slate-300 text-sm font-medium truncate">{broadcast.address}</p>
                                </div>
                              )}
                              {broadcast.issueDescription && (
                                <p className="text-slate-400 text-xs font-medium italic mb-3 line-clamp-2">"{broadcast.issueDescription}"</p>
                              )}
                              <div className="flex gap-3 flex-wrap">
                                <span className="text-cyan-400 text-[11px] font-bold uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-lg">Est: {broadcast.estimatedCostRange || 'Standard'}</span>
                                <span className={cn(
                                  "text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg",
                                  broadcast.urgency === 'High' ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10'
                                )}>{broadcast.urgency || 'Standard'} Priority</span>
                                <span className="text-amber-400 text-[11px] font-bold uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-lg">Pay After Service</span>
                              </div>
                            </div>
                            <button
                              onClick={() => acceptBroadcast(broadcast.id)}
                              className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-50 transition-all active:scale-[0.98] shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)] whitespace-nowrap shrink-0"
                            >
                              Accept Now
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Booking Missed Popup */}
                  <AnimatePresence>
                    {missedBroadcast && (
                      <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        className="fixed bottom-6 right-6 z-[100] max-w-sm w-full"
                      >
                        <div className="bg-gradient-to-r from-rose-950 to-slate-950 p-5 rounded-2xl border border-rose-500/30 shadow-2xl shadow-rose-500/20 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-rose-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-white mb-1">Booking Missed</h4>
                            <p className="text-xs text-rose-300/80 font-medium">
                              This request was accepted by <strong className="text-white">{missedBroadcast.acceptedBy}</strong>. Better luck next time!
                            </p>
                          </div>
                          <button onClick={() => setMissedBroadcast(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                            <X className="w-4 h-4 text-white/50" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Booking Cancelled Popup */}
                  <AnimatePresence>
                    {cancelledBooking && (
                      <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60 }}
                        className="fixed bottom-28 right-6 z-[100] max-w-sm w-full"
                      >
                        <div className="bg-gradient-to-r from-orange-950 to-slate-950 p-5 rounded-2xl border border-orange-500/30 shadow-2xl shadow-orange-500/20 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-5 h-5 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-white mb-1">Booking Cancelled</h4>
                            <p className="text-xs text-orange-300/80 font-medium leading-relaxed">
                              <strong className="text-white">{cancelledBooking.customerName}</strong> cancelled the request.
                              <br />
                              <span className="text-[10px] opacity-60 mt-1 block italic">Reason: {cancelledBooking.reason}</span>
                            </p>
                          </div>
                          <button onClick={() => setCancelledBooking(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                            <X className="w-4 h-4 text-white/50" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <JobQueue 
                    activeJobs={activeJobs} 
                    profile={profile} 
                    acceptJob={acceptJob} 
                    declineJob={declineJob} 
                  />
                  
                  <DeclinedHistory declinedJobs={declinedJobs} showDeclined={showDeclined} setShowDeclined={setShowDeclined} />
                  <TransactionLedger transactions={transactions} showTransactions={showTransactions} setShowTransactions={setShowTransactions} />
                </div>

                <div className="space-y-8">
                  <ServiceManifest activeJobsCount={activeJobs.length} />
                  <div className="glass-neon-card p-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Network Performance</h3>
                    <div className="space-y-6">
                      <MetricRow label="Avg Response" value="4.2m" progress={85} />
                      <MetricRow label="Success Rate" value="98%" progress={98} />
                      <MetricRow label="Service Rating" value="4.9" progress={92} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>


    </div>
  );
}
