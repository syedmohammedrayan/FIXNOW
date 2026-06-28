'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, RefreshCcw } from 'lucide-react';
import { statusColor } from '../shared/utils';
import axios from 'axios';
import { API_BASE } from '@/lib/config';

interface BookingsTabProps {
  bookings: any[];
}

export function BookingsTab({ bookings }: BookingsTabProps) {
  const [processingRefundId, setProcessingRefundId] = useState<string | null>(null);

  const processRefund = async (bookingId: string) => {
    if (!confirm('Are you sure you want to process a refund for this booking?')) return;
    setProcessingRefundId(bookingId);
    try {
      const res = await axios.post(`${API_BASE}/api/payment/refund`, { bookingId });
      if (res.data.success) {
        alert('Refund processed successfully!');
        window.location.reload(); // Refresh to update data
      } else {
        alert(res.data.message || 'Refund failed');
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || 'Error processing refund');
    } finally {
      setProcessingRefundId(null);
    }
  };

  return (
    <motion.div key="bookings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Service Logs</h2>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{bookings.length} booking records</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] border-dashed">
          <ClipboardList className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No bookings recorded yet</p>
        </div>
      ) : (
        <>
          {/* ── Mobile Card List ── */}
          <div className="md:hidden space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-4 rounded-[1.5rem] hover:border-white/[0.15] transition-all duration-200">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-black text-white text-sm uppercase truncate">{b.category} Service</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">#{b.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${statusColor(b.status)}`}>
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-white/[0.05]">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Technician</p>
                    <p className="text-slate-300 font-medium truncate max-w-[140px]">{b.technicianName || b.technicianId || 'Unassigned'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Revenue</p>
                    <p className="font-black text-emerald-400">
                      {b.finalAmount ? `₹${b.finalAmount}` : (b.bookingAdvance ? `Adv: ₹${b.bookingAdvance}` : (b.estimatedCostRange || '₹0'))}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-[9px] text-slate-600 font-mono">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  {b.status === 'Cancelled' && (b.payment_status === 'Paid' || b.paymentStatus === 'Paid' || b.paymentStatus === 'Advance Paid') && (
                    <button
                      onClick={() => processRefund(b.id)}
                      disabled={processingRefundId === b.id}
                      className="px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-500/30 transition flex items-center gap-1"
                    >
                      {processingRefundId === b.id ? <RefreshCcw className="w-3 h-3 animate-spin" /> : null}
                      Process Refund
                    </button>
                  )}
                  {b.payment_status === 'Refunded' || b.paymentStatus === 'Refunded' ? (
                    <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[9px] font-bold uppercase border border-slate-700">Refunded</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden md:block bg-slate-900/50 backdrop-blur-xl rounded-[1.75rem] overflow-hidden border border-white/[0.08]">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <table className="w-full text-sm text-left min-w-[640px]">
                <thead className="bg-white/[0.04] text-slate-500 font-black uppercase text-[9px] tracking-widest border-b border-white/[0.06]">
                  <tr>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Technician</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Revenue</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-white/[0.03] transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white uppercase text-xs">{b.category}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">#{b.id.slice(-8).toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${statusColor(b.status)}`}>{b.status}</span>
                        {b.paymentStage === 'advance_paid' && <div className="text-[8px] text-indigo-400 mt-1 uppercase font-bold tracking-widest">Advance Paid</div>}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium text-xs">{b.technicianName || b.technicianId || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">{new Date(b.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-400">
                        {b.finalAmount ? `₹${b.finalAmount}` : (b.bookingAdvance ? `Adv: ₹${b.bookingAdvance}` : (b.estimatedCostRange || '₹0'))}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {b.status === 'Cancelled' && (b.payment_status === 'Paid' || b.paymentStatus === 'Paid') && (
                          <button
                            onClick={() => processRefund(b.id)}
                            disabled={processingRefundId === b.id}
                            className="px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-500/30 transition flex items-center gap-1"
                          >
                            {processingRefundId === b.id ? <RefreshCcw className="w-3 h-3 animate-spin" /> : null}
                            Process Refund
                          </button>
                        )}
                        {b.payment_status === 'Refunded' || b.paymentStatus === 'Refunded' ? (
                          <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[10px] font-bold uppercase border border-slate-700">Refunded</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
