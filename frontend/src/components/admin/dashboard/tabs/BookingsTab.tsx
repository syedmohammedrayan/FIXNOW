'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { statusColor } from '../shared/utils';

interface BookingsTabProps {
  bookings: any[];
}

export function BookingsTab({ bookings }: BookingsTabProps) {
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
                    <p className="font-black text-emerald-400">{b.estimatedCostRange || '₹0'}</p>
                  </div>
                </div>
                <p className="text-[9px] text-slate-600 font-mono mt-2">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
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
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium text-xs">{b.technicianName || b.technicianId || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">{new Date(b.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-400">{b.estimatedCostRange || '₹0'}</td>
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
