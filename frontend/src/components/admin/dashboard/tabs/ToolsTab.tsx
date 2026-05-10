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
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="space-y-8"
    >
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">LOGISTICS & SUPPLY</h2>
          <p className="text-indigo-300 font-medium mt-1">Real-time tool and material request management center</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel border-white/10 px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Flow</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <StatItem icon={<Package />} label="Total Requisitions" value={toolOrders.length} color="indigo" />
        <StatItem icon={<Clock />} label="Awaiting Approval" value={toolOrders.filter(o => o.status === 'Pending').length} color="amber" trend="Critical Action" />
        <StatItem icon={<CheckCircle2 />} label="In Transit" value={toolOrders.filter(o => o.status === 'Approved').length} color="emerald" trend="Active Deliveries" />
        <StatItem icon={<Zap />} label="Inventory Value" value={`₹${toolOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0)}`} color="sky" />
      </div>

      <div className="space-y-4">
        {toolOrders.map(order => (
          <ToolOrderCard 
            key={order.id} 
            order={order} 
            onUpdate={updateToolOrderStatus} 
            onVerify={handleVerifyPayment} 
            setSelectedOrder={setSelectedOrder} 
          />
        ))}
        {toolOrders.length === 0 && (
          <div className="text-center py-32 glass-panel border-white/10 rounded-[3rem] border-2 border-dashed border-slate-100">
            <Package className="w-20 h-20 text-slate-100 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-300">No Requisition Logs Found</h3>
          </div>
        )}
      </div>
    </motion.div>
  );
}
