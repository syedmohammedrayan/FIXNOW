"use client";

import React from "react";
import { Bell, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Technician Dashboard
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {profile.online ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Online / Active
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Offline / Inactive
                </span>
              </div>
            )}
            <span className="text-indigo-300 text-sm font-medium">
              Hello, {profile.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="glass-panel border-white/10 border border-slate-200 shadow-sm rounded-2xl p-1 flex shrink-0">
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
                "px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                profile.online
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-indigo-300 hover:text-white",
              )}
            >
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
                "px-4 sm:px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider",
                !profile.online
                  ? "bg-slate-800/40 backdrop-blur-md text-white"
                  : "text-indigo-300 hover:text-white",
              )}
            >
              Offline
            </button>
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => setBellMenuOpen(!bellMenuOpen)}
              className="relative w-10 h-10 sm:w-12 sm:h-12 glass-panel border-white/10 border border-slate-200 rounded-2xl flex items-center justify-center hover:glass-panel transition group shadow-sm shrink-0"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-indigo-600 transition" />
              {bellNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>
            <AnimatePresence>
              {bellMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-64 sm:w-80 glass-panel bg-slate-900/90 border-white/10 border border-slate-200 rounded-2xl p-2 shadow-xl z-50 max-h-[400px] overflow-y-auto"
                >
                  <h3 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Notifications</h3>
                  {bellNotifications.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-slate-500 text-center">No new notifications</div>
                  ) : (
                    bellNotifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => {
                          if (!notif.read) markNotificationRead(notif.id);
                        }}
                        className={cn("p-3 sm:p-4 rounded-xl mb-1 transition-colors cursor-pointer", !notif.read ? "bg-indigo-500/10 border border-indigo-500/20" : "hover:bg-slate-50/10")}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-sm font-bold text-slate-200">{notif.title}</div>
                          {!notif.read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />}
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed">{notif.message}</div>
                        <div className="text-[10px] text-slate-500 mt-2 text-right font-medium">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-slate-200 hover:border-indigo-500 transition shadow-sm relative bg-slate-800/40 backdrop-blur-md"
            >
              {uploadingAvatar && (
                <div className="absolute inset-0 glass-panel border-white/80 flex items-center justify-center z-10">
                  <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {profile.avatar && profile.avatar.length > 2 ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-xl">
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
                  className="absolute right-0 mt-3 w-48 glass-panel border-white/10 border border-slate-200 rounded-2xl p-2 shadow-xl z-50"
                >
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-indigo-600 hover:glass-panel border-white/10 rounded-xl transition"
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
    </header>
  );
}
