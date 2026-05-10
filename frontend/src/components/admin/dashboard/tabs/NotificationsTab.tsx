'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface NotificationsTabProps {
  notificationLogs: any[];
}

export function NotificationsTab({ notificationLogs }: NotificationsTabProps) {
  return (
    <motion.div key="notifications" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Notification Hub</h2>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 uppercase tracking-widest">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE LOGS
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-x-auto border border-white/10">
        <table className="w-full text-sm text-left min-w-[1000px]">
          <thead className="bg-white/5 border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-white/5">
            <tr>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5">Recipient</th>
              <th className="px-6 py-5">Message Snippet</th>
              <th className="px-6 py-5 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {notificationLogs.map(log => (
              <tr key={log.id} className="hover:bg-white/5 transition group">
                <td className="px-6 py-5">
                  <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block border ${log.error ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                    {log.error ? 'Failed' : 'Sent'}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10 ${log.channel === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white'}`}>
                      {log.channel === 'whatsapp' ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.63 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      ) : (
                        <Activity className="size-4" />
                      )}
                    </div>
                    <div className="font-bold text-white uppercase text-xs tracking-widest">{log.channel}</div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="font-bold text-white text-xs">{log.recipientPhone}</div>
                  <div className="text-[10px] text-slate-500 font-mono">ID: {log.recipientId}</div>
                </td>
                <td className="px-6 py-5 text-slate-500 text-xs italic max-w-xs truncate">
                  "{log.message}"
                </td>
                <td className="px-6 py-5 text-right font-mono">
                  <div className="text-white font-bold text-xs">{new Date(log.timestamp).toLocaleDateString()}</div>
                  <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
              </tr>
            ))}
            {notificationLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">
                  No notifications logged in the hub.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
