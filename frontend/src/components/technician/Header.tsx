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
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Command Center
          </h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {profile.online ? (
              <div className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                  Console Active
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-1.5 bg-slate-100 rounded-full border border-black/5 shadow-inner">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Offline Node
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-500 text-[11px] font-black uppercase tracking-widest opacity-80">
              <span className="w-4 h-px bg-black/[0.05]" />
              Liaison: {profile.name}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-3 sm:gap-6">
          <div className="bg-[#0B0F1A]/80 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl rounded-full p-1.5 flex shrink-0 relative overflow-hidden group/toggle">
            {/* Ambient background glow based on state */}
            <div className={cn(
              "absolute inset-0 blur-2xl opacity-30 transition-all duration-1000",
              profile.online ? "bg-emerald-500" : "bg-rose-500"
            )} />

            <button
              onClick={async () => {
                setProfile({ ...profile, online: true });
                if (user) {
                  try {
                    const axios = (await import('axios')).default;
                    await axios.post(`${API_BASE}/api/users/${user.uid}/update-profile`, { online: true });
                  } catch (e) {
                    console.error("Online sync failed:", e);
                  }
                }
              }}
              className={cn(
                "relative z-10 px-5 sm:px-8 py-2.5 sm:py-3 rounded-full text-[10px] font-black transition-all duration-500 uppercase tracking-[0.2em] flex items-center gap-2.5",
                profile.online
                  ? "bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-105"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
              )}
            >
              {profile.online && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              )}
              Go Online
            </button>
            <button
              onClick={async () => {
                if (currentJob) {
                  alert("⚠️ ACTIVE PROTOCOL: Booking or service in progress. You cannot go offline until the current assignment is complete.");
                  return;
                }
                setProfile({ ...profile, online: false });
                if (user) {
                  try {
                    const axios = (await import('axios')).default;
                    await axios.post(`${API_BASE}/api/users/${user.uid}/update-profile`, { online: false });
                  } catch (e) {
                    console.error("Offline sync failed:", e);
                  }
                }
              }}
              className={cn(
                "relative z-10 px-5 sm:px-8 py-2.5 sm:py-3 rounded-full text-[10px] font-black transition-all duration-500 uppercase tracking-[0.2em] flex items-center gap-2.5",
                !profile.online
                  ? "bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.5)] scale-105"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
              )}
            >
              {!profile.online && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              )}
              Offline
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
