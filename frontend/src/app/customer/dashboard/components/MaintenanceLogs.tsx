'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Calendar, Wind, Bike, Droplets, Tv, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reminder } from '../types';

interface MaintenanceLogsProps {
  reminders: Reminder[];
  onBookUrgent: (appliance: string) => void;
}

export default function MaintenanceLogs({ reminders, onBookUrgent }: MaintenanceLogsProps) {
  return (
    <div
      className="bg-white/[0.04] backdrop-blur-2xl p-5 sm:p-7 md:p-10 relative overflow-hidden mt-6 sm:mt-8 border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl"
      style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.3)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
          <Bell className="size-5 sm:size-6 text-white" /> Maintenance Logs
        </h2>
      </div>
      {reminders.length === 0 ? (
        <div className="text-center py-10 sm:py-12 px-4 sm:px-6 border-2 border-dashed border-white/[0.06] rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.02]">
          <Calendar className="size-8 sm:size-10 text-white/20 mx-auto mb-3 sm:mb-4" />
          <p className="text-white/50 font-black uppercase tracking-widest text-xs sm:text-sm">No Scheduled Protocols</p>
          <p className="text-white/30 font-medium text-[10px] sm:text-xs mt-2">Maintain your appliances with automated alerts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {reminders.map(r => {
            const icon = r.appliance === 'AC' ? <Wind className="size-5 sm:size-6 text-white" /> : 
                         r.appliance === 'Bike' ? <Bike className="size-5 sm:size-6 text-white" /> : 
                         r.appliance === 'Water Purifier' ? <Droplets className="size-5 sm:size-6 text-white" /> : 
                         r.appliance === 'TV' ? <Tv className="size-5 sm:size-6 text-white" /> : 
                         <Smartphone className="size-5 sm:size-6 text-white" />;
            
            const diffTime = new Date(r.nextServiceDate).getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isUrgent = diffDays <= 7 && diffDays >= 0;
            const isOverdue = diffDays < 0;
            
            return (
              <motion.div 
                initial={{opacity:0, y:10}} 
                animate={{opacity:1, y:0}} 
                key={r.id} 
                className={cn(
                  "p-4 sm:p-6 rounded-[1.25rem] sm:rounded-[1.5rem] border flex items-center gap-3 sm:gap-5 transition hover:shadow-md cursor-pointer", 
                  isUrgent ? 'bg-rose-500/[0.06] border-rose-500/20' : 
                  isOverdue ? 'bg-white/[0.02] border-white/[0.06] opacity-60' : 
                  'bg-white/[0.03] border-white/[0.06]'
                )}
                style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.03)' }}
                onClick={() => isUrgent && onBookUrgent(r.appliance)}
              >
                <div className="size-11 sm:size-14 rounded-xl sm:rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="font-black text-white text-base sm:text-lg tracking-tight leading-none">{r.appliance}</p>
                  <p className={cn(
                    "text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-2 sm:mt-3", 
                    isUrgent ? 'text-rose-500' : 
                    isOverdue ? 'text-white/40' : 
                    'text-emerald-500'
                  )}>
                    {isOverdue ? `Expired • ${Math.abs(diffDays)} Days` : `Due in ${diffDays} Days`}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
