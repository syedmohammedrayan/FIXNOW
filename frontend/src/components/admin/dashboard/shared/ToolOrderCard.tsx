import React from 'react';
import { Package, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusColor } from './utils';

interface ToolOrderCardProps {
  order: any;
  onUpdate: (id: string, status: string) => void;
  onVerify: (id: string) => void;
  setSelectedOrder: (order: any) => void;
}

export function ToolOrderCard({ order, onUpdate, onVerify, setSelectedOrder }: ToolOrderCardProps) {
  return (
    <div className="glass-panel border-white/10 p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
      <div className="flex gap-6 items-start w-full md:w-auto">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform duration-500">
          <Package className="w-8 h-8" />
        </div>
        <div className="w-full">
          <div className="flex justify-between items-center w-full md:block">
            <h4 className="font-black text-white text-lg">Order #{order.id.slice(-6).toUpperCase()}</h4>
            <span className="text-[10px] text-slate-400 font-bold ml-2 md:hidden">Tech: {order.technicianName}</span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest hidden md:block mt-1">Technician: <span className="text-indigo-600">{order.technicianName}</span></p>

          <div className="flex gap-4 mt-2">
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Method</span>
               <span className="text-[11px] font-bold text-slate-300 capitalize">{order.paymentMethod?.replace(/_/g, ' ') || 'Deduction'}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment</span>
               <span className={cn("text-[11px] font-bold", order.paymentStatus === 'Verified' ? 'text-emerald-600' : 'text-amber-600')}>{order.paymentStatus || 'Pending'}</span>
             </div>
          </div>

          {/* Items List */}
          <div className="mt-4 space-y-2">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="text-xs text-indigo-300 flex justify-between gap-4 items-center">
                <span className="font-medium">{item.quantity || item.qty || 1}x {item.name}</span>
                <span className="font-black text-white">₹{(item.price * (item.quantity || item.qty || 1)) || 0}</span>
              </div>
            ))}
            {order.customTool && (
              <div className="mt-4 p-4 glass-panel border-white/10 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-widest">Special Requisition</p>
                <p className="text-sm text-white font-black">{order.customTool.name}</p>
                {order.customTool.description && <p className="text-xs text-indigo-300 mt-1 font-medium">{order.customTool.description}</p>}
                {order.customTool.image && (
                  <img src={order.customTool.image} alt="Custom Tool" className="mt-3 w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 md:gap-4 border-t border-slate-50 pt-6 md:pt-0 md:border-0 shrink-0">
        <div className="text-left md:text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Valuation</p>
          <p className="font-black text-white text-2xl">₹{order.totalAmount}</p>
          <div className="mt-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusColor(order.status)}`}>{order.status}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          {order.paymentMethod === 'pay_now' && order.paymentStatus !== 'Verified' && (
            <button
              onClick={() => onVerify(order.id)}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-amber-500/20"
            >
              Verify Payment
            </button>
          )}

          {order.status === 'Pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedOrder(order);
                  onUpdate(order.id, 'Approved');
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => onUpdate(order.id, 'Rejected')}
                className="px-6 py-3 glass-panel border-white/10 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center gap-2 shadow-sm"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
