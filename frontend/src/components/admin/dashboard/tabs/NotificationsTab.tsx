'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Bell } from 'lucide-react';

interface NotificationsTabProps {
  notificationLogs: any[];
}

export function NotificationsTab({ notificationLogs }: NotificationsTabProps) {
  return (
    <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Notification Hub</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{notificationLogs.length} log entries</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-white/[0.04] px-4 py-2 rounded-full border border-white/[0.08] uppercase tracking-widest self-start sm:self-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Logs
        </div>
      </div>

      {notificationLogs.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] border-dashed">
          <Bell className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No notifications logged</p>
        </div>
      ) : (
        <>
          {/* ── Mobile Card List ── */}
          <div className="md:hidden space-y-3">
            {notificationLogs.map(log => (
              <div key={log.id} className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-4 rounded-[1.5rem] hover:border-white/[0.15] transition">
                {/* Top row: channel icon + status */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${log.channel === 'whatsapp' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/[0.05] border-white/[0.08] text-slate-400'}`}>
                      {log.channel === 'whatsapp' ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.63 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      ) : (
                        <Activity className="size-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-white text-xs uppercase tracking-widest">{log.channel}</p>
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5">{log.recipientPhone}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border shrink-0 ${log.error ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                    {log.error ? 'Failed' : 'Sent'}
                  </span>
                </div>

                {/* Message */}
                <p className="text-[10px] text-slate-400 italic leading-relaxed line-clamp-2 mb-2">"{log.message}"</p>

                {/* Footer */}
                <div className="flex items-center justify-between text-[9px] pt-2 border-t border-white/[0.05]">
                  <span className="text-slate-600 font-mono">ID: {log.recipientId}</span>
                  <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden md:block bg-slate-900/50 backdrop-blur-xl rounded-[1.75rem] overflow-hidden border border-white/[0.08]">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <table className="w-full text-sm text-left min-w-[860px]">
                <thead className="bg-white/[0.04] text-slate-500 font-black uppercase text-[9px] tracking-widest border-b border-white/[0.06]">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Channel</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Message</th>
                    <th className="px-6 py-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {notificationLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase inline-block border ${log.error ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {log.error ? 'Failed' : 'Sent'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 border ${log.channel === 'whatsapp' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/[0.05] border-white/[0.08] text-slate-400'}`}>
                            {log.channel === 'whatsapp' ? (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.63 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            ) : <Activity className="size-3.5" />}
                          </div>
                          <span className="font-bold text-white text-xs uppercase tracking-widest">{log.channel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-xs">{log.recipientPhone}</div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {log.recipientId}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs italic max-w-[260px] truncate">"{log.message}"</td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-white font-bold text-xs">{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-[9px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
