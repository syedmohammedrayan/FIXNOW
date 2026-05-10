'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BellRing, X, ShieldAlert, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Notification, Reminder } from '../types';

interface StatusBannersProps {
  dismissedBanner: boolean;
  setDismissedBanner: (val: boolean) => void;
  declineNotifications: Notification[];
  onMarkAllRead: () => void;
  setShowHistory: (val: boolean) => void;
  urgentReminders: Reminder[];
  setIssueText: (val: string) => void;
  activeJob: any;
}

export default function StatusBanners({
  dismissedBanner,
  setDismissedBanner,
  declineNotifications,
  onMarkAllRead,
  setShowHistory,
  urgentReminders,
  setIssueText,
  activeJob
}: StatusBannersProps) {
  return (
    <>
      {/* Declined Booking Notification Banner */}
      {!dismissedBanner && declineNotifications.length > 0 && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-8 w-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 shadow-xl shadow-amber-500/20 text-white flex flex-col md:flex-row items-start md:items-center justify-between border-2 border-amber-400 gap-4"
        >
          <div className="flex items-center gap-5">
            <div className="p-4 glass-panel border-white/20 rounded-2xl backdrop-blur-md">
              <BellRing className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-black text-2xl tracking-tight leading-tight">Service Protocol Update</p>
              <p className="text-sm font-black opacity-90 text-amber-50 mt-1 uppercase tracking-widest">
                {declineNotifications.length === 1 
                  ? declineNotifications[0].message 
                  : `Automated matching found ${declineNotifications.length} unavailable units. Re-initialize matching for alternative options.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => { setShowHistory(true); onMarkAllRead(); }}
              className="px-6 py-4 glass-panel border-white/10 text-amber-600 font-extrabold text-sm rounded-2xl hover:bg-amber-50 transition shadow-md active:scale-95"
            >
              View Bookings
            </button>
            <button 
              onClick={() => { setDismissedBanner(true); onMarkAllRead(); }}
              className="p-3 glass-panel border-white/20 rounded-2xl hover:border-white/40 transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Urgent Reminders Banner */}
      {urgentReminders.length > 0 && (
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 w-full bg-rose-500 rounded-3xl p-6 shadow-xl shadow-rose-500/20 text-white flex flex-col md:flex-row items-start md:items-center justify-between border-2 border-rose-400 gap-4">
          <div className="flex items-center gap-5">
            <div className="p-3 glass-panel border-white/20 rounded-2xl">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-display font-extrabold text-2xl leading-tight">Service Required Soon!</p>
              <p className="text-base font-medium opacity-90 text-rose-50 mt-1 flex items-center gap-1">
                You have {urgentReminders.length} appliance(s) requiring maintenance: <strong>{urgentReminders.map(r => r.appliance).join(', ')}</strong>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setIssueText(`I need a technician for my ${urgentReminders[0].appliance} servicing.`); window.scrollTo(0, 0); }} 
            className="px-6 py-4 glass-panel border-white/10 text-rose-600 shrink-0 font-extrabold text-sm rounded-2xl hover:bg-rose-50 transition shadow-md active:scale-95"
          >
            Book Tech Instantly
          </button>
        </motion.div>
      )}


    </>
  );
}
