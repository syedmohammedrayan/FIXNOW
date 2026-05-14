import React from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, DollarSign, ShieldCheck, Clock, Zap, ShoppingCart, ArrowRight } from 'lucide-react';
import { StatItem } from '../shared/StatItem';
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
      className="space-y-6 sm:space-y-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 [&>*:nth-child(5)]:col-span-2 sm:[&>*:nth-child(5)]:col-span-1">
        <StatItem icon={<Users />}       label="Technicians"           value={allTechs.length}       trend="+4 today"    color="white" />
        <StatItem icon={<Activity />}    label="Active Jobs"           value={bookings.filter(b => b.status !== 'Completed' && b.status !== 'Refused').length} trend="Live" color="white" />
        <StatItem icon={<DollarSign />}  label="Revenue"               value={`₹${transactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0).toLocaleString()}`} trend="+12% avg" color="white" />
        <StatItem icon={<ShieldCheck />} label="Pending Verifications" value={techs.length}           trend="Action req." color="white" />
        <StatItem icon={<Clock />}       label="System Uptime"         value="99.9%"                  trend="Stable"      color="white" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2rem]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              Platform Activity
            </h3>
            <button
              onClick={() => setActiveTab('bookings')}
              className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition"
            >
              View All <ArrowRight className="size-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {bookings.length === 0 && (
              <div className="py-10 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">No bookings yet</div>
            )}
            {bookings.slice(0, 6).map(b => (
              <div key={b.id} className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-white/[0.03] border border-white/[0.05] rounded-xl sm:rounded-2xl hover:bg-white/[0.05] transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-xs sm:text-sm truncate">{b.category} Service</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono">#{b.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${statusColor(b.status)}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Technician Onboarding */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2rem] flex flex-col">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-slate-300" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-white text-sm">Technician Onboarding</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {techs.length > 0
                    ? <><span className="text-white font-bold">{techs.length}</span> waiting for approval</>
                    : 'All caught up!'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('approvals')}
              className="w-full py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-black text-[10px] uppercase tracking-widest transition active:scale-95 mt-auto"
            >
              View Pending
            </button>
          </div>

          {/* Tools & Materials */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2rem] flex flex-col">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5 text-slate-300" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-white text-sm">Tools & Materials</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  <span className="text-white font-bold">{toolOrders.filter(o => o.status === 'Pending').length}</span> pending requisitions
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('approvals')}
              className="w-full py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-black text-[10px] uppercase tracking-widest transition active:scale-95 mt-auto"
            >
              Manage Requisitions
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
