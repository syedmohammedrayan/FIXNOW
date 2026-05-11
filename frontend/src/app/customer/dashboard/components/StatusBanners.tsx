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
          className="mb-6 sm:mb-8 w-full bg-white/[0.04] backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between border border-amber-500/15 gap-4"
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-start sm:items-center gap-3 sm:gap-5">
            <div className="p-3 sm:p-4 bg-amber-500/10 border border-amber-500/15 rounded-xl sm:rounded-2xl backdrop-blur-md shrink-0">
              <BellRing className="size-6 sm:size-8 text-amber-500" />
            </div>
            <div>
              <p className="font-black text-lg sm:text-2xl tracking-tight leading-tight">Service Protocol Update</p>
              <p className="text-xs sm:text-sm font-bold opacity-80 text-amber-50/70 mt-1 uppercase tracking-wider sm:tracking-widest line-clamp-2">
                {declineNotifications.length === 1 
                  ? declineNotifications[0].message 
                  : `${declineNotifications.length} units unavailable. Re-initialize matching for alternatives.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
            <button 
              onClick={() => { setShowHistory(true); onMarkAllRead(); }}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 bg-white text-slate-900 font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl hover:bg-slate-100 transition shadow-md active:scale-95 text-center"
            >
              View Bookings
            </button>
            <button 
              onClick={() => { setDismissedBanner(true); onMarkAllRead(); }}
              className="p-2.5 sm:p-3 bg-white/[0.04] border border-white/[0.06] rounded-xl sm:rounded-2xl hover:bg-white/[0.08] transition"
            >
              <X className="size-4 sm:size-5 text-white" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Urgent Reminders Banner */}
      {urgentReminders.length > 0 && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          className="mb-6 sm:mb-8 w-full bg-white/[0.04] backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between border border-rose-500/15 gap-4"
          style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-start sm:items-center gap-3 sm:gap-5">
            <div className="p-2.5 sm:p-3 bg-rose-500/10 border border-rose-500/15 rounded-xl sm:rounded-2xl shrink-0">
              <ShieldAlert className="size-6 sm:size-8 text-rose-500" />
            </div>
            <div>
              <p className="font-extrabold text-lg sm:text-2xl leading-tight">Service Required Soon!</p>
              <p className="text-xs sm:text-base font-medium text-white/50 mt-1 flex flex-wrap items-center gap-1">
                {urgentReminders.length} appliance(s) need maintenance: <strong className="text-white">{urgentReminders.map(r => r.appliance).join(', ')}</strong>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setIssueText(`I need a technician for my ${urgentReminders[0].appliance} servicing.`); window.scrollTo(0, 0); }} 
            className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 bg-white text-slate-900 shrink-0 font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl hover:bg-slate-100 transition shadow-md active:scale-95 text-center"
          >
            Book Tech Instantly
          </button>
        </motion.div>
      )}


    </>
  );
}
