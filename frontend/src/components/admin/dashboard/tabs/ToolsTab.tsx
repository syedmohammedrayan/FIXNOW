'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle2, Zap } from 'lucide-react';
import { StatItem } from '../shared/StatItem';
import { ToolOrderCard } from '../shared/ToolOrderCard';

interface ToolsTabProps {
  toolOrders: any[];
  updateToolOrderStatus: (id: string, status: string) => void;
  handleVerifyPayment: (id: string) => void;
  setSelectedOrder: (order: any) => void;
}

export function ToolsTab({ toolOrders, updateToolOrderStatus, handleVerifyPayment, setSelectedOrder }: ToolsTabProps) {
  return (
    <motion.div
      key="tools"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 sm:space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Logistics & Supply</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Real-time supply chain management center</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl self-start sm:self-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Flow</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatItem icon={<Package />}      label="Total Requisitions" value={toolOrders.length}                                                        color="white" />
        <StatItem icon={<Clock />}        label="Awaiting Approval"  value={toolOrders.filter(o => o.status === 'Pending').length}                    color="amber"   trend="Action needed" />
        <StatItem icon={<CheckCircle2 />} label="In Transit"         value={toolOrders.filter(o => o.status === 'Approved').length}                   color="emerald" trend="Active deliveries" />
        <StatItem icon={<Zap />}          label="Inventory Value"    value={`₹${toolOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0).toLocaleString()}`} color="cyan" />
      </div>

      {/* Orders */}
      <div className="space-y-3 sm:space-y-4">
        {toolOrders.length === 0 ? (
          <div className="text-center py-20 sm:py-28 bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] border-dashed">
            <Package className="w-14 h-14 sm:w-16 sm:h-16 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No Requisition Logs Found</p>
          </div>
        ) : (
          toolOrders.map(order => (
            <ToolOrderCard
              key={order.id}
              order={order}
              onUpdate={updateToolOrderStatus}
              onVerify={handleVerifyPayment}
              setSelectedOrder={setSelectedOrder}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
