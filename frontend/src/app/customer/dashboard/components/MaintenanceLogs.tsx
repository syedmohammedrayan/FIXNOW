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
    <div className="glass-neon-card p-5 sm:p-10 relative overflow-hidden mt-6 sm:mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <Bell className="w-6 h-6 text-indigo-500" /> Maintenance Logs
        </h2>
      </div>
      {reminders.length === 0 ? (
        <div className="text-center py-12 px-6 border-2 border-dashed border-slate-700 rounded-[2rem] bg-slate-800/20">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No Scheduled Protocols</p>
          <p className="text-slate-500 font-medium text-xs mt-2">Maintain your appliances with automated alerts</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reminders.map(r => {
            const icon = r.appliance === 'AC' ? <Wind className="w-6 h-6 text-indigo-500" /> : 
                         r.appliance === 'Bike' ? <Bike className="w-6 h-6 text-indigo-500" /> : 
                         r.appliance === 'Water Purifier' ? <Droplets className="w-6 h-6 text-indigo-500" /> : 
                         r.appliance === 'TV' ? <Tv className="w-6 h-6 text-indigo-500" /> : 
                         <Smartphone className="w-6 h-6 text-indigo-500" />;
            
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
                  "p-6 rounded-[1.5rem] border flex items-center gap-5 transition hover:shadow-md cursor-pointer", 
                  isUrgent ? 'bg-rose-500/10 border-rose-500/30' : 
                  isOverdue ? 'bg-slate-800/30 border-slate-700 opacity-60' : 
                  'bg-slate-800/30 border-slate-700 shadow-sm'
                )}
                onClick={() => isUrgent && onBookUrgent(r.appliance)}
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center shadow-sm shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="font-black text-white text-lg tracking-tight leading-none">{r.appliance}</p>
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] mt-3", 
                    isUrgent ? 'text-rose-500' : 
                    isOverdue ? 'text-slate-500' : 
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
