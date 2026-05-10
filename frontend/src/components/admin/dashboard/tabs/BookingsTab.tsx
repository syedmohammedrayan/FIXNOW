import React from 'react';
import { motion } from 'framer-motion';
import { statusColor } from '../shared/utils';

interface BookingsTabProps {
  bookings: any[];
}

export function BookingsTab({ bookings }: BookingsTabProps) {
  return (
    <motion.div key="bookings" className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Service Logs</h2>
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left min-w-[700px]">
          <thead className="glass-panel border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-5">Service</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Technician</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map(b => (
              <tr key={b.id} className="hover:glass-panel border-white/10 transition">
                <td className="px-8 py-5">
                  <div className="font-bold text-white uppercase text-xs">{b.category}</div>
                  <div className="text-[10px] text-indigo-300">#{b.id.slice(-8)}</div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${statusColor(b.status)}`}>{b.status}</span>
                </td>
                <td className="px-8 py-5 text-slate-400 font-medium">
                  {b.technicianName || b.technicianId || 'Unassigned'}
                </td>
                <td className="px-8 py-5 text-indigo-300 text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                <td className="px-8 py-5 text-right font-bold text-green-400">{b.estimatedCostRange || '$0'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
