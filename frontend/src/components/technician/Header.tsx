"use client";

import React from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { getAvatarUrl } from "@/lib/image-utils";

interface TechnicianHeaderProps {
  profile: any;
  setProfile: (p: any) => void;
  user: any;
  API_BASE: string;
  avatarMenuOpen: boolean;
  setAvatarMenuOpen: (o: boolean) => void;
  uploadingAvatar: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleAvatarDelete: () => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  bellNotifications: any[];
  setBellNotifications: (n: any[]) => void;
  markNotificationRead: (id: string) => void;
  currentJob?: any;
}

export default function TechnicianHeader({
  profile,
  setProfile,
  user,
  API_BASE,
  avatarMenuOpen,
  setAvatarMenuOpen,
  uploadingAvatar,
  fileInputRef,
  handleAvatarDelete,
  handleAvatarUpload,
  bellNotifications,
  setBellNotifications,
  markNotificationRead,
  currentJob,
}: TechnicianHeaderProps) {
  const [bellMenuOpen, setBellMenuOpen] = React.useState(false);
  const bellRef = React.useRef<HTMLDivElement>(null);
  const avatarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Close bell menu if click is outside
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellMenuOpen(false);
      }
      // Close avatar menu if click is outside
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [setAvatarMenuOpen]);

  return (
    <header className="flex flex-col gap-6 mb-10 lg:mb-14 relative z-[100]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-[0_4px_15px_rgba(255,255,255,0.2)]">
            Command Center
          </h1>
          <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 group/tech-id">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl backdrop-blur-2xl shadow-2xl transition-all duration-500 group-hover/tech-id:bg-white/[0.05] group-hover/tech-id:border-white/20">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
              </div>
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] italic">Operational Node</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:block w-8 h-px bg-gradient-to-r from-white/20 to-transparent" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Authorized Personnel</span>
                  <div className="size-1 rounded-full bg-slate-800" />
                </div>
                <h2 className="text-sm sm:text-lg font-black text-white uppercase tracking-tighter sm:tracking-tight flex items-center gap-3 mt-0.5">
                  <span className="text-slate-400/80 font-bold tracking-[0.1em] text-[11px] sm:text-xs">Technician:</span>
                  <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-2xl">
                    {profile.name}
                  </span>
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-3 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-1">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] transition-colors duration-500",
                profile.online ? "text-emerald-500" : "text-slate-500"
              )}>
                {profile.online ? "Status: Online" : "Status: Offline"}
              </span>
              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">
                {profile.online ? "Ready for jobs" : "Standby Mode"}
              </span>
            </div>
            
            <button
              onClick={async () => {
                const nextState = !profile.online;
                if (!nextState && currentJob) {
                  alert("⚠️ ACTIVE PROTOCOL: Booking or service in progress. You cannot go offline until the current assignment is complete.");
                  return;
                }
                
                setProfile({ ...profile, online: nextState });
                if (user) {
                  try {
                    const axios = (await import('axios')).default;
                    await axios.post(`${API_BASE}/api/users/${user.uid}/update-profile`, { online: nextState });
                  } catch (e) {
                    console.error("Status sync failed:", e);
                  }
                }
              }}
              className={cn(
                "relative w-[68px] h-9 rounded-full transition-all duration-500 p-1.5 flex items-center cursor-pointer group/switch",
                profile.online 
                  ? "bg-[#10B981] shadow-[0_0_25px_rgba(16,185,129,0.5)]" 
                  : "bg-slate-800 border border-white/10"
              )}
            >
              {/* Sliding Handle */}
              <motion.div
                initial={false}
                animate={{ 
                  x: profile.online ? 32 : 0,
                  backgroundColor: "#ffffff",
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 30 
                }}
                className="size-6 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] z-10 flex items-center justify-center"
              />
              
              {/* Background Indicators */}
              <div className="absolute inset-0 flex items-center justify-between px-3 text-[8px] font-black text-white/20 uppercase tracking-tighter pointer-events-none">
                <span className={cn("transition-opacity duration-500", profile.online ? "opacity-0" : "opacity-100")}>OFF</span>
                <span className={cn("transition-opacity duration-500", profile.online ? "opacity-100" : "opacity-0")}>ON</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="relative shrink-0" ref={bellRef}>
              <button 
                onClick={() => setBellMenuOpen(!bellMenuOpen)}
                className="relative size-12 sm:size-14 bg-white border border-black/10 rounded-2xl flex items-center justify-center hover:border-black/20 hover:bg-slate-50 transition-all group shadow-xl backdrop-blur-3xl shrink-0 active:scale-95"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-slate-900 group-hover:scale-110 transition-all duration-500" />
                {bellNotifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-3.5 right-3.5 size-3 bg-indigo-500 rounded-full border-2 border-white animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                )}
              </button>
              
              <AnimatePresence>
                {bellMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="fixed left-4 right-4 top-24 sm:absolute sm:top-auto sm:left-auto sm:right-0 mt-4 sm:w-[420px] bg-slate-900/95 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-4 shadow-[0_40px_100px_rgba(0,0,0,0.8)] z-[100] max-h-[500px] overflow-y-auto scrollbar-hide"
                  >
                    <div className="px-5 pt-3 pb-5 mb-3 border-b border-white/[0.05] flex items-center justify-between">
                      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">System Intelligence</h3>
                      <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{bellNotifications.filter(n => !n.read).length} New Signal</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {bellNotifications.length === 0 ? (
                        <div className="px-4 py-12 text-sm text-slate-500 font-bold text-center flex flex-col items-center gap-5 italic uppercase tracking-widest opacity-50">
                          <div className="size-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10">
                            <Bell className="w-7 h-7 text-slate-600" />
                          </div>
                          No active signals detected.
                        </div>
                      ) : (
                        bellNotifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              if (!notif.read) markNotificationRead(notif.id);
                            }}
                            className={cn(
                              "p-5 rounded-[1.5rem] transition-all cursor-pointer group/notif relative overflow-hidden", 
                              !notif.read 
                                ? "bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08]" 
                                : "hover:bg-white/[0.02] border border-transparent"
                            )}
                          >
                            {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />}
                            <div className="flex justify-between items-start mb-2">
                              <div className={cn("text-xs font-black uppercase tracking-widest italic", !notif.read ? "text-white" : "text-slate-400")}>
                                {notif.title}
                              </div>
                              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0 mt-0.5 opacity-60">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 leading-relaxed font-medium group-hover/notif:text-slate-300 transition-colors">
                              {notif.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative shrink-0" ref={avatarRef}>
              <button
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="size-12 sm:size-14 rounded-2xl overflow-hidden border border-black/10 hover:border-black/20 hover:scale-105 transition-all duration-500 shadow-xl relative bg-white backdrop-blur-3xl group active:scale-95"
              >
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-10">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                {profile.avatar && profile.avatar.length > 2 ? (
                  <img
                    src={getAvatarUrl(profile.avatar)!}
                    alt="Avatar"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-2xl group-hover:bg-white/10 transition-colors">
                    👷
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <AnimatePresence>
                {avatarMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="absolute right-0 mt-4 w-56 bg-slate-900/95 backdrop-blur-3xl border border-white/[0.08] rounded-[1.5rem] p-2.5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] z-50"
                  >
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                      Update Identity
                    </button>
                    <button
                      onClick={handleAvatarDelete}
                      className="w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all mt-1"
                    >
                      Purge Avatar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
