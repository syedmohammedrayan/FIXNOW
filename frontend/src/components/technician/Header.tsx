"use client";

import React from "react";
import { Bell, BellRing } from "lucide-react";
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

  return (
    <header className="flex flex-col gap-4 mb-8 lg:mb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
            Technician Dashboard
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {profile.online ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  Active Console
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Offline
                </span>
              </div>
            )}
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-tight">
              Liaison: {profile.name}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-2 sm:gap-4">
          <div className="bg-white/5 border border-white/10 shadow-xl backdrop-blur-md rounded-2xl p-1.5 flex shrink-0">
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
                "px-3 sm:px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                profile.online
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white",
              )}
            >
              Online
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
                "px-3 sm:px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
                !profile.online
                  ? "bg-slate-700 text-white shadow-inner"
                  : "text-slate-400 hover:text-white",
              )}
            >
              Offline
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative shrink-0">
            <button 
              onClick={() => setBellMenuOpen(!bellMenuOpen)}
              className="relative w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:border-white/30 hover:bg-white/10 transition group shadow-xl backdrop-blur-md shrink-0"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 group-hover:text-white group-hover:scale-110 transition" />
              {bellNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-950 animate-pulse shadow-lg" />
              )}
            </button>
            <AnimatePresence>
              {bellMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 sm:right-0 mt-4 w-[320px] sm:w-[380px] bg-[#0B0F17]/95 backdrop-blur-[40px] border border-white/[0.08] rounded-[1.5rem] p-3 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] z-[100] max-h-[400px] overflow-y-auto"
                >
                  <div className="px-4 pt-2 pb-4 mb-2 border-b border-white/[0.05] flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Alerts</h3>
                    <div className="px-2 py-0.5 bg-white/[0.05] rounded-full">
                      <span className="text-[9px] font-bold text-white/50">{bellNotifications.filter(n => !n.read).length} New</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    {bellNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-sm text-slate-500 font-medium text-center flex flex-col items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                          <Bell className="w-4 h-4 text-slate-600" />
                        </div>
                        All clear. No active alerts.
                      </div>
                    ) : (
                      bellNotifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            if (!notif.read) markNotificationRead(notif.id);
                          }}
                          className={cn(
                            "p-4 rounded-2xl transition-all cursor-pointer group/notif relative overflow-hidden", 
                            !notif.read 
                              ? "bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06]" 
                              : "hover:bg-white/[0.02] border border-transparent"
                          )}
                        >
                          {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
                          <div className="flex justify-between items-start mb-2">
                            <div className={cn("text-xs font-black uppercase tracking-wider", !notif.read ? "text-white" : "text-slate-300")}>
                              {notif.title}
                            </div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest shrink-0 mt-0.5">
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

          <div className="relative shrink-0">
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-white/40 hover:border-white/60 transition shadow-xl relative bg-white/10 backdrop-blur-md"
            >
              {uploadingAvatar && (
                <div className="absolute inset-0 glass-panel border-white/80 flex items-center justify-center z-10">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {profile.avatar && profile.avatar.length > 2 ? (
                <img
                  src={getAvatarUrl(profile.avatar)!}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-xl">
                  👷
                </div>
              )}
            </button>

            <AnimatePresence>
              {avatarMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-48 bg-slate-900/95 backdrop-blur-3xl border-white/10 border rounded-2xl p-2 shadow-2xl z-50"
                >
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition"
                  >
                    Upload Photo
                  </button>
                  <button
                    onClick={handleAvatarDelete}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition mt-1"
                  >
                    Remove Photo
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
