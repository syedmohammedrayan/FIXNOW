import React from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, DollarSign, ShieldCheck, Clock, Zap, ShoppingCart } from 'lucide-react';
import { StatItem } from '../shared/StatItem';
import { HealthRow } from '../shared/HealthRow';
import { statusColor } from '../shared/utils';

interface OverviewTabProps {
  allTechs: any[];
  bookings: any[];
  transactions: any[];
  techs: any[];
  toolOrders: any[];
  setActiveTab: (tab: any) => void;
}

export function OverviewTab({ allTechs, bookings, transactions, techs, toolOrders, setActiveTab }: OverviewTabProps) {
  return (
    <motion.div 
      key="overview" 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      className="space-y-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
        <StatItem icon={<Users />} label="Technicians" value={allTechs.length} trend="+4 today" color="white" />
        <StatItem icon={<Activity />} label="Active Jobs" value={bookings.filter(b => b.status !== 'Completed' && b.status !== 'Refused').length} trend="Live" color="white" />
        <StatItem icon={<DollarSign />} label="Daily Revenue" value={`₹${transactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0)}`} trend="+12% vs avg" color="white" />
        <StatItem icon={<ShieldCheck />} label="Pending Verifications" value={techs.length} trend="Critical" color="white" />
        <StatItem icon={<Clock />} label="System Uptime" value="99.9%" trend="Stable" color="white" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem]">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-white" /> Platform Activity
          </h3>
          <div className="space-y-4">
            {bookings.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{b.category} Service</p>
                    <p className="text-xs text-slate-400">ID: {b.id.slice(0, 8)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${statusColor(b.status)}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] text-center flex flex-col items-center">
            <ShieldCheck className="w-12 h-12 text-white mb-4" />
            <h4 className="font-bold text-white mb-2">Technician Onboarding</h4>
            <p className="text-sm text-slate-400 mb-4">There are {techs.length} technicians waiting for your approval.</p>
            <button onClick={() => setActiveTab('approvals')} className="w-full py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold transition">View Pending</button>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] text-center flex flex-col items-center">
            <ShoppingCart className="w-12 h-12 text-white mb-4" />
            <h4 className="font-bold text-white mb-2">Tools & Materials</h4>
            <p className="text-sm text-slate-400 mb-4">There are {toolOrders.filter(o => o.status === 'Pending').length} pending tool requisitions.</p>
            <button onClick={() => setActiveTab('approvals')} className="w-full py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 text-white font-bold transition">Manage Requisitions</button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
