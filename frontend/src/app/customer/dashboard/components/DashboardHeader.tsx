'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bell, User, Camera, Trash2, Settings, LogOut, ShieldAlert, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NotificationsPanel from './NotificationsPanel';
import { Notification } from '../types';

interface DashboardHeaderProps {
  onShowHistory: () => void;
  showNotifPanel: boolean;
  setShowNotifPanel: (val: boolean) => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  avatarMenuOpen: boolean;
  setAvatarMenuOpen: (val: boolean) => void;
  uploadingAvatar: boolean;
  userProfile: { name?: string; avatar?: string };
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarDelete: () => void;
  onSignOut: () => void;
  onShowDeleteConfirm: () => void;
  activeJob?: any;
  onTrack?: (id: string) => void;
}

export default function DashboardHeader({
  onShowHistory,
  showNotifPanel,
  setShowNotifPanel,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  avatarMenuOpen,
  setAvatarMenuOpen,
  uploadingAvatar,
  userProfile,
  onAvatarUpload,
  onAvatarDelete,
  onSignOut,
  onShowDeleteConfirm,
  activeJob,
  onTrack
}: DashboardHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap justify-between items-center gap-6 sm:gap-8 mb-8 sm:mb-12">
      <div className="flex flex-wrap items-center gap-6 sm:gap-10">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tighter italic">Customer Interface</h1>
          <div className="flex items-center gap-3 mt-3">
            <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[10px]">AI-Powered Dispatch Network</p>
          </div>
        </motion.div>

        {activeJob && activeJob.status !== 'Completed' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="group relative"
          >
            <div className="flex items-center gap-4 px-5 py-3.5 bg-white/10 backdrop-blur-xl border border-white/40 rounded-[1.5rem] shadow-2xl shadow-white/5 hover:border-white/60 transition-all duration-500">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-950 flex items-center justify-center border border-white/10 shadow-lg group-hover:scale-110 transition-transform">
                  <Activity className="size-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: {activeJob.status}</p>
                  </div>
                  <h4 className="text-[11px] font-black text-white tracking-tight mt-1 truncate max-w-[150px]">{activeJob.category} Ongoing</h4>
                </div>
              </div>
                <button 
                  onClick={() => onTrack && onTrack(activeJob.id)}
                  className="px-4 py-2.5 bg-white text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-xl transition shadow-lg hover:bg-slate-100 active:scale-95 shrink-0"
                >
                  Track Live
                </button>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onShowHistory}
          className="group flex items-center gap-3 sm:gap-4 px-5 sm:px-8 py-3 sm:py-4 rounded-[1.5rem] bg-white/10 border border-white/40 backdrop-blur-md hover:border-white/60 text-slate-950 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-xl active:scale-95"
        >
          <Calendar className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
          Service Logs
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative p-4 rounded-[1.5rem] bg-white/10 border border-white/40 backdrop-blur-md hover:border-white/60 transition-all duration-300 shadow-xl text-slate-950 hover:text-cyan-600 active:scale-95"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border border-white/20 shadow-xl animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifPanel && (
              <NotificationsPanel 
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkRead={onMarkRead}
                onMarkAllRead={onMarkAllRead}
                onShowHistory={onShowHistory}
                onClose={() => setShowNotifPanel(false)}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button 
            type="button"
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className="p-3.5 rounded-2xl bg-white/10 border border-white/40 hover:border-white/60 transition-all shadow-xl active:scale-95 group overflow-hidden relative"
            title="Identity Hub"
          >
            {uploadingAvatar ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : userProfile.avatar ? (
              <img src={userProfile.avatar} className="w-6 h-6 object-cover rounded-full" alt="User Avatar" />
            ) : (
              <User className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            )}
          </button>

          <AnimatePresence>
            {avatarMenuOpen && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setAvatarMenuOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-64 bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] shadow-2xl z-[70] overflow-hidden p-2"
                >
                  <div className="p-5 border-b border-white/10 mb-2">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Identity Protocol</p>
                    <p className="text-xs font-black text-white truncate">{userProfile.name || 'Citizen User'}</p>
                  </div>

                  <div className="space-y-1">
                    <button 
                      onClick={() => document.getElementById('dash-avatar-up')?.click()}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 text-white transition-all group"
                    >
                      <Camera className="w-4 h-4 group-hover:scale-110 transition-transform text-white/60" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Update Identity</span>
                    </button>

                    {userProfile.avatar && (
                      <button 
                        onClick={onAvatarDelete}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-rose-500/20 text-white transition-all group"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform text-rose-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Purge Photo</span>
                      </button>
                    )}

                    <div className="h-px bg-white/10 my-2 mx-4" />

                    <button 
                      onClick={() => router.push('/customer/account')}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/5 text-white transition-all group"
                    >
                      <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform text-white/60" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Profile Settings</span>
                    </button>

                    <button 
                      onClick={onSignOut}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-rose-500/20 text-white transition-all group"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Terminate</span>
                    </button>
                  </div>

                  <input 
                    type="file" 
                    id="dash-avatar-up" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={onAvatarUpload} 
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={onShowDeleteConfirm}
          className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition shadow-sm"
          title="Delete Account Permanently"
        >
          <ShieldAlert className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
