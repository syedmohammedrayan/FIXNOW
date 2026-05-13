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
import { useJsApiLoader } from "@react-google-maps/api";

const LIBRARIES: ("places" | "geometry" | "visualization")[] = ["places", "geometry", "visualization"];

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const { isLoaded: googleReady } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: currentKey,
    libraries: LIBRARIES,
  });

  // Re-geocode on key rotation failure
  useEffect(() => {
    if (!googleReady && currentKey) {
      // Logic handled by useJsApiLoader internal retry or rotateKey in other hooks
    }
  }, [googleReady, currentKey]);

  useEffect(() => {
    const runGeocode = () => {
      if (!window.google?.maps?.Geocoder) return;
      
      const loc = customerLocation || (currentJob?.customerLocation) || (currentJob?.customerLat ? { lat: currentJob.customerLat, lng: currentJob.customerLng } : null);
      if (!loc) return;
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: loc }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          setLiveAddress(results[0].formatted_address);
        } else {
          console.warn("Dashboard Geocode Status:", status);
          if (!liveAddress) setLiveAddress(`${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
        }
      });
    };

    if (googleReady) {
      runGeocode();
    }
  }, [customerLocation, currentJob?.id, googleReady, liveAddress]);

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
    
    // 1. Optimistic Update with local preview
    const previewUrl = URL.createObjectURL(file);
    const previousAvatar = profile.avatar;
    setProfile((prev: any) => ({ ...prev, avatar: previewUrl }));
    
    setUploadingAvatar(true);
    setAvatarMenuOpen(false);
    
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await axios.post(`${API_BASE}/api/users/${user.uid}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        // 2. Final Update with server URL
        const finalUrl = getAvatarUrl(res.data.avatar) || res.data.avatar;
        setProfile((prev: any) => ({ ...prev, avatar: finalUrl }));
        // Clean up the local preview URL
        URL.revokeObjectURL(previewUrl);
      }
    } catch (err) {
      console.error("Failed to upload avatar", err);
      // Rollback on failure
      setProfile((prev: any) => ({ ...prev, avatar: previousAvatar }));
      URL.revokeObjectURL(previewUrl);
      alert("Failed to upload avatar. Protocol interrupted.");
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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Cinematic Background Atmosphere */}
      <div className="fixed top-0 right-0 w-[50vw] h-[50vw] bg-indigo-500/[0.03] blur-[150px] rounded-full pointer-events-none -mr-[10vw] -mt-[10vw] z-0" />
      <div className="fixed bottom-0 left-0 w-[40vw] h-[40vw] bg-cyan-500/[0.03] blur-[120px] rounded-full pointer-events-none -ml-[10vw] -mb-[10vw] z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-slate-500/[0.01] blur-[180px] rounded-full pointer-events-none z-0" />

      <TechnicianSidebar profile={profile} onOpenChange={setIsSidebarOpen} />
      
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 30, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className={cn(
              "fixed top-0 left-1/2 z-[9999] px-4 sm:px-8 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex items-center gap-3 sm:gap-5 border font-black text-xs sm:text-sm uppercase tracking-wider w-[calc(100%-2rem)] sm:w-auto sm:min-w-[450px] max-w-[95vw] backdrop-blur-3xl",
              notification.type === 'success' ? "bg-emerald-600/80 text-white border-emerald-400/30" :
              notification.type === 'error' ? "bg-rose-600/80 text-white border-rose-400/30" :
              "bg-slate-900/80 text-white border-white/10"
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner shrink-0">
              {notification.type === 'success' ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <Activity className="w-7 h-7 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="opacity-50 text-[9px] mb-1 font-black text-slate-400 uppercase tracking-[0.2em]">Broadcast Signal</p>
              <p className="leading-tight truncate sm:whitespace-normal">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={cn(
        "pl-0 md:pl-[78px] lg:pl-[280px] pt-20 md:pt-0 min-h-screen transition-all duration-700 relative z-10",
        isSidebarOpen ? "hidden md:block" : "block"
      )}>
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
              {/* Stats Section — Improved Depth */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-10">
                <StatCard 
                  icon={<DollarSign className="w-5 h-5" />} 
                  label="Gross Earnings" 
                  value={`₹${(profile.earnings || 0).toLocaleString()}`} 
                  trend={profile.earnings > 0 ? "Verified Revenue" : "No earnings yet"} 
                  color="cyan" 
                />
                <StatCard 
                  icon={<Star className="w-5 h-5" />} 
                  label="Service Rating" 
                  value={`${(profile.rating || 5.0).toFixed(1)}`} 
                  trend="Verified Profile" 
                  color="emerald" 
                />
                <StatCard 
                  icon={<Briefcase className="w-5 h-5" />} 
                  label="Total Tasks" 
                  value={(profile.totalJobs || 0).toString()} 
                  trend="Total Completed" 
                  color="slate" 
                />
                <StatCard 
                  icon={<Clock className="w-5 h-5" />} 
                  label="Current Availability" 
                  value={profile.online ? "ONLINE" : "OFFLINE"} 
                  trend={profile.online ? "Ready for jobs" : "Duty Paused"} 
                  color={profile.online ? "emerald" : "slate"} 
                />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-10">
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
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        className="h-[350px] bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] flex flex-col items-center justify-center text-center p-10 relative overflow-hidden group/empty shadow-2xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 opacity-50" />
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="size-24 rounded-[2.5rem] bg-slate-900 border border-white/10 flex items-center justify-center mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative group-hover/empty:scale-110 transition-transform duration-700">
                            <div className="absolute inset-0 bg-white/5 rounded-[2.5rem] animate-ping opacity-20" />
                            <Activity className="w-12 h-12 text-slate-400 group-hover/empty:text-white transition-colors duration-500" />
                          </div>
                          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Console Synchronized</h3>
                          <p className="text-slate-500 mt-4 max-w-xs mx-auto text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed opacity-60">Scanning for incoming professional requests across the network...</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-6">
                    <AnimatePresence>
                      {availableBroadcasts.map((broadcast) => {
                        const elapsedSec = broadcast.receivedAt ? Math.floor((Date.now() - broadcast.receivedAt) / 1000) : 0;
                        const elapsedMin = Math.floor(elapsedSec / 60);
                        const elapsedStr = elapsedMin > 0 ? `${elapsedMin}m ago` : `${elapsedSec}s ago`;
                        
                        return (
                          <motion.div 
                            key={broadcast.id}
                            initial={{ opacity: 0, x: -20, scale: 0.98 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/[0.03] backdrop-blur-3xl p-6 sm:p-10 border border-white/[0.08] rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-white/20 transition-all duration-500"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-4 mb-5 flex-wrap">
                                  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-cyan-500/10">
                                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                                    Tactical Broadcast
                                  </div>
                                  <div className="inline-flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <Clock className="size-3.5" />
                                    {elapsedStr}
                                  </div>
                                </div>

                                <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tighter italic uppercase">
                                  {broadcast.customerName || broadcast.customer_name || 'Valued Customer'}
                                </h3>
                                
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="size-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <Briefcase className="size-4 text-slate-300" />
                                  </div>
                                  <p className="text-slate-300 text-sm font-black uppercase tracking-tight italic">{broadcast.category}</p>
                                </div>

                                <div className="space-y-3 mb-8">
                                  {broadcast.address && (
                                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                      <p className="text-slate-400 text-xs font-bold leading-relaxed">{broadcast.address}</p>
                                    </div>
                                  )}
                                  {broadcast.issueDescription && (
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] italic">
                                      <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                      <p className="text-slate-300 text-sm font-medium leading-relaxed truncate-2-lines">"{broadcast.issueDescription}"</p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-3 flex-wrap">
                                  <div className="flex flex-col gap-1 p-3 px-5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Est. Revenue</span>
                                    <span className="text-cyan-400 text-sm font-black tracking-tighter italic">₹{broadcast.estimatedCostRange || 'Standard'}</span>
                                  </div>
                                  <div className="flex flex-col gap-1 p-3 px-5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Priority</span>
                                    <span className={cn(
                                      "text-sm font-black tracking-tighter italic uppercase",
                                      broadcast.urgency === 'High' ? 'text-rose-400' : 'text-emerald-400'
                                    )}>{broadcast.urgency || 'Standard'}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => acceptBroadcast(broadcast.id)}
                                className="px-10 py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-[0.25em] text-xs hover:bg-cyan-50 hover:scale-[1.02] transition-all active:scale-[0.98] shadow-[0_20px_50px_rgba(255,255,255,0.2)] lg:self-end group-hover:shadow-[0_25px_60px_rgba(34,211,238,0.2)]"
                              >
                                Accept Protocol
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Notification Popups — Refined visuals */}
                  <AnimatePresence>
                    {missedBroadcast && (
                      <motion.div
                        initial={{ opacity: 0, x: 60, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-[100] max-w-sm w-full"
                      >
                        <div className="bg-slate-900/95 backdrop-blur-2xl p-6 rounded-[2rem] border border-rose-500/30 shadow-[0_30px_100px_rgba(244,63,94,0.15)] flex items-start gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-6 h-6 text-rose-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-black text-white mb-1 uppercase tracking-tight italic">Protocol Missed</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                              This assignment was successfully intercepted by <span className="text-white font-black">{missedBroadcast.acceptedBy}</span>.
                            </p>
                          </div>
                          <button onClick={() => setMissedBroadcast(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                            <X className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {cancelledBooking && (
                      <motion.div
                        initial={{ opacity: 0, x: 60, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.9 }}
                        className="fixed bottom-28 right-6 z-[100] max-w-sm w-full"
                      >
                        <div className="bg-slate-900/95 backdrop-blur-2xl p-6 rounded-[2rem] border border-orange-500/30 shadow-[0_30px_100px_rgba(249,115,22,0.15)] flex items-start gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-6 h-6 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-black text-white mb-1 uppercase tracking-tight italic">Deployment Aborted</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                              <span className="text-white font-black">{cancelledBooking.customerName}</span> has terminated the mission request.
                            </p>
                            <div className="mt-3 py-2 px-3 rounded-xl bg-white/5 border border-white/10 italic">
                              <p className="text-[10px] text-orange-300 font-bold uppercase tracking-widest opacity-80">Reason: {cancelledBooking.reason || 'Not specified'}</p>
                            </div>
                          </div>
                          <button onClick={() => setCancelledBooking(null)} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                            <X className="w-4 h-4 text-slate-500" />
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
                  <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="size-32" /></div>
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-3 italic">
                      <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      Network Metrics
                    </h3>
                    <div className="space-y-8">
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
