'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, XCircle, CheckCheck, X } from 'lucide-react';
import { Notification } from '../types';

interface NotificationsPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onShowHistory: () => void;
  onClose: () => void;
}

export default function NotificationsPanel({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onShowHistory,
  onClose
}: NotificationsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-20 sm:top-auto mt-0 sm:mt-3 w-auto sm:w-[420px] bg-slate-900/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.6)] z-50 overflow-hidden"
      style={{
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 30px 80px rgba(0,0,0,0.6)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 sm:px-7 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <Bell className="size-4 text-white/70" />
          </div>
          <div>
            <h3 className="font-black text-white text-sm tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{unreadCount} unread</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition px-3 py-2 rounded-xl hover:bg-white/[0.04]"
            >
              <CheckCheck className="size-3.5" />
              <span className="hidden sm:inline">Read all</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/[0.06] text-white/30 hover:text-white transition sm:hidden"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {notifications.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <div className="size-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Bell className="size-6 text-white/20" />
            </div>
            <p className="text-sm text-white/40 font-bold">No notifications yet</p>
            <p className="text-[11px] text-white/20 font-medium mt-1">You'll see updates here when activity occurs</p>
          </div>
        ) : (
          notifications.slice(0, 15).map(notif => (
            <div
              key={notif.id}
              onClick={() => { 
                onMarkRead(notif.id); 
                if (notif.type === 'booking_declined') onShowHistory(); 
                onClose(); 
              }}
              className={`px-6 sm:px-7 py-5 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.03] transition-all duration-200 relative ${
                !notif.read ? 'bg-white/[0.03]' : ''
              }`}
            >
              {/* Unread accent bar */}
              {!notif.read && (
                <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-cyan-400 rounded-r-full" />
              )}

              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  notif.type === 'booking_declined' 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' 
                    : 'bg-white/[0.05] text-white/60 border border-white/[0.06]'
                }`}>
                  {notif.type === 'booking_declined' ? (
                    <XCircle className="size-4.5" />
                  ) : (
                    <Bell className="size-4.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-bold leading-snug ${
                    !notif.read ? 'text-white' : 'text-white/50'
                  }`}>
                    {notif.title}
                  </p>
                  <p className="text-[12px] text-white/35 mt-1.5 leading-relaxed line-clamp-2 font-medium">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-white/25 mt-2.5 font-bold uppercase tracking-wider">
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(notif.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                {!notif.read && (
                  <span className="size-2 bg-cyan-400 rounded-full mt-2 shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
