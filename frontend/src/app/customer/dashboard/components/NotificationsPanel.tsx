'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, XCircle } from 'lucide-react';
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
      className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel border-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-white text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-200 uppercase tracking-widest transition"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
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
              className={`px-6 py-4 border-b border-slate-50 cursor-pointer hover:bg-slate-800/50 transition ${
                !notif.read ? 'bg-indigo-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${
                  notif.type === 'booking_declined' 
                    ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                    : 'glass-panel border-white/10 text-indigo-300 border border-slate-100'
                }`}>
                  {notif.type === 'booking_declined' ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${
                    !notif.read ? 'text-white' : 'text-indigo-300'
                  }`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-slate-300 mt-2 font-medium">
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(notif.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

