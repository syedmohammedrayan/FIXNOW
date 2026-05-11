'use client';

import React from 'react';
import { Package, CheckCircle2, XCircle, CreditCard, Clock } from 'lucide-react';
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
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 rounded-[1.75rem] flex flex-col gap-5 group hover:border-white/[0.15] transition-all duration-300">
      {/* Top row: icon + info + amount */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-400 shrink-0 group-hover:scale-105 transition-transform duration-300">
          <Package className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 className="font-black text-white text-sm sm:text-base">Order #{order.id.slice(-6).toUpperCase()}</h4>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-widest truncate">
                Technician: <span className="text-slate-300">{order.technicianName}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-white text-lg sm:text-xl">₹{order.totalAmount}</p>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Payment + method badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <CreditCard className="size-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 capitalize">
                {order.paymentMethod?.replace(/_/g, ' ') || 'Deduction'}
              </span>
            </div>
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-bold',
              order.paymentStatus === 'Verified'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            )}>
              <Clock className="size-3" />
              {order.paymentStatus || 'Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      {order.items && order.items.length > 0 && (
        <div className="space-y-1.5 px-1">
          {order.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center text-xs gap-4">
              <span className="text-slate-400 font-medium truncate">{item.quantity || item.qty || 1}× {item.name}</span>
              <span className="font-black text-white shrink-0">₹{(item.price * (item.quantity || item.qty || 1)) || 0}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom Tool */}
      {order.customTool && (
        <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          <p className="text-[9px] font-black uppercase text-slate-500 mb-1.5 tracking-widest">Special Requisition</p>
          <p className="text-sm text-white font-black">{order.customTool.name}</p>
          {order.customTool.description && (
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{order.customTool.description}</p>
          )}
          {order.customTool.image && (
            <div className="mt-3 relative w-20 h-20 overflow-hidden rounded-xl border border-white/10">
              <img src={order.customTool.image} alt="Custom Tool" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-white/[0.05]">
        {order.paymentMethod === 'pay_now' && order.paymentStatus !== 'Verified' && (
          <button
            onClick={() => onVerify(order.id)}
            className="flex-1 sm:flex-none px-5 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Verify Payment
          </button>
        )}

        {order.status === 'Pending' && (
          <>
            <button
              onClick={() => { setSelectedOrder(order); onUpdate(order.id, 'Approved'); }}
              className="flex-1 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => onUpdate(order.id, 'Rejected')}
              className="flex-1 px-5 py-3 bg-white/[0.04] border border-white/[0.08] hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 active:scale-95"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}
