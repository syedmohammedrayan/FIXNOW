'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bell, User, Camera, Trash2, Settings, LogOut, ShieldAlert, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAvatarUrl } from '@/lib/image-utils';
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
    <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-start sm:items-center gap-5 sm:gap-8 mb-6 sm:mb-12">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 sm:gap-10 w-full sm:w-auto">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-slate-950 tracking-tighter italic">Customer Interface</h1>
          <div className="flex items-center gap-3 mt-2 sm:mt-3">
            <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[9px] sm:text-[10px]">AI-Powered Dispatch Network</p>
          </div>
        </motion.div>

        {activeJob && activeJob.status !== 'Completed' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="group relative w-full sm:w-auto"
          >
            <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-2xl sm:rounded-[1.5rem] shadow-lg hover:border-white/20 transition-all duration-500"
              style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="size-9 sm:size-10 rounded-xl bg-slate-950 flex items-center justify-center border border-white/10 shadow-lg group-hover:scale-110 transition-transform shrink-0">
                  <Activity className="size-4 sm:size-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: {activeJob.status}</p>
                  </div>
                  <h4 className="text-[10px] sm:text-[11px] font-black text-white tracking-tight mt-1 truncate max-w-[120px] sm:max-w-[150px]">{activeJob.category} Ongoing</h4>
                </div>
              </div>
                <button 
                  onClick={() => onTrack && onTrack(activeJob.id)}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-slate-900 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-xl transition shadow-lg hover:bg-slate-100 active:scale-95 shrink-0"
                >
                  Track Live
                </button>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="flex items-center gap-2.5 sm:gap-4 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={onShowHistory}
          className="group flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.5rem] bg-white/[0.06] border border-white/[0.08] backdrop-blur-md hover:border-white/20 text-slate-950 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 shadow-lg active:scale-95"
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)' }}
        >
          <Calendar className="size-4 sm:size-5 text-slate-950 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Service Logs</span>
          <span className="sm:hidden">Logs</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative p-3 sm:p-4 rounded-2xl sm:rounded-[1.5rem] bg-white/[0.06] border border-white/[0.08] backdrop-blur-md hover:border-white/20 transition-all duration-300 shadow-lg text-slate-950 hover:text-cyan-600 active:scale-95"
            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)' }}
          >
            <Bell className="size-5 sm:size-6" />
            {unreadCount > 0 && (
              <span className="absolute top-2 sm:top-3 right-2 sm:right-3 w-4 sm:w-5 h-4 sm:h-5 bg-rose-600 text-white text-[8px] sm:text-[10px] font-black rounded-full flex items-center justify-center border border-white/20 shadow-xl animate-pulse">
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
            className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/[0.06] border border-white/[0.08] hover:border-white/20 transition-all shadow-lg active:scale-95 group overflow-hidden relative"
            title="Identity Hub"
          >
            {uploadingAvatar ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : userProfile.avatar ? (
              <img src={getAvatarUrl(userProfile.avatar)!} className="w-5 sm:w-6 h-5 sm:h-6 object-cover rounded-full" alt="User Avatar" />
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
                  className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-auto bottom-4 sm:bottom-auto mt-0 sm:mt-3 w-auto sm:w-64 bg-slate-900/90 backdrop-blur-3xl border border-white/[0.08] rounded-[1.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.6)] z-[70] overflow-hidden p-2"
                  style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 30px 80px rgba(0,0,0,0.6)' }}
                >
                  <div className="p-5 border-b border-white/[0.06] mb-2">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Identity Protocol</p>
                    <p className="text-xs font-black text-white truncate">{userProfile.name || 'Citizen User'}</p>
                  </div>

                  <div className="space-y-1">
                    <button 
                      onClick={() => document.getElementById('dash-avatar-up')?.click()}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/[0.04] text-white transition-all group"
                    >
                      <Camera className="w-4 h-4 group-hover:scale-110 transition-transform text-white/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Update Identity</span>
                    </button>

                    {userProfile.avatar && (
                      <button 
                        onClick={onAvatarDelete}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-rose-500/10 text-white transition-all group"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform text-rose-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Purge Photo</span>
                      </button>
                    )}

                    <div className="h-px bg-white/[0.06] my-2 mx-4" />

                    <button 
                      onClick={() => router.push('/customer/account')}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-white/[0.04] text-white transition-all group"
                    >
                      <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform text-white/40" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Profile Settings</span>
                    </button>

                    <button 
                      onClick={onSignOut}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-rose-500/10 text-white transition-all group"
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
          className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition shadow-sm"
          title="Delete Account Permanently"
        >
          <ShieldAlert className="size-4 sm:size-5" />
        </button>
      </div>
    </div>
  );
}
