'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Eye, Trash2, Users, MapPin } from 'lucide-react';
import Link from 'next/link';
import { getAvatarUrl } from '@/lib/image-utils';

interface TechniciansTabProps {
  allTechs: any[];
  setShowAddModal: (show: boolean) => void;
  deleteTechnician: (id: string) => void;
}

export function TechniciansTab({ allTechs, setShowAddModal, deleteTechnician }: TechniciansTabProps) {
  return (
    <motion.div
      key="techs"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Workforce Management</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{allTechs.length} technicians registered</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg active:scale-95 w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" /> Add Technician
        </button>
      </div>

      {allTechs.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-white/[0.06] rounded-[2rem] border-dashed">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No technicians registered yet</p>
        </div>
      ) : (
        <>
          {/* ── Mobile Card List ── */}
          <div className="md:hidden space-y-3">
            {allTechs.map(t => (
              <div
                key={t.id}
                className="bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] p-4 rounded-[1.5rem] hover:border-white/[0.15] transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-black text-slate-400 uppercase overflow-hidden shrink-0">
                    {t.avatar
                      ? <img src={getAvatarUrl(t.avatar)!} className="w-full h-full object-cover" alt={t.name} />
                      : t.name?.charAt(0)
                    }
                  </div>
                  {/* Name + ID */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-white text-sm truncate">{t.name}</p>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${t.online ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">#{t.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                {/* Info row */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-white/[0.06] text-white/60 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/[0.08] truncate max-w-[180px]">
                    {t.category}
                  </span>
                  <span className="px-2.5 py-1 bg-white/[0.04] text-slate-400 rounded-lg text-[9px] font-bold border border-white/[0.06]">
                    {t.completedJobs || t.completed_jobs || 0} jobs
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-[10px] text-slate-500 font-medium truncate">{t.email}</p>
                  {t.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3 text-slate-500" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">{t.address}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-white/[0.05]">
                  <Link
                    href={`/admin/technicians/details?id=${t.id}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  <button
                    onClick={() => deleteTechnician(t.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden md:block bg-slate-900/50 backdrop-blur-xl rounded-[1.75rem] overflow-hidden border border-white/[0.08]">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <table className="w-full text-sm text-left min-w-[680px]">
                <thead className="bg-white/[0.04] text-slate-500 font-black uppercase text-[9px] tracking-widest border-b border-white/[0.06]">
                  <tr>
                    <th className="px-6 py-4">Technician</th>
                    <th className="px-6 py-4">Specialization</th>
                    <th className="px-6 py-4">Contact & Address</th>
                    <th className="px-6 py-4 text-center">Jobs</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {allTechs.map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.03] transition group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-bold text-slate-500 uppercase overflow-hidden shrink-0">
                            {t.avatar
                              ? <img src={getAvatarUrl(t.avatar)!} className="w-full h-full object-cover" alt={t.name} />
                              : t.name?.charAt(0)
                            }
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{t.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">#{t.id.slice(-6).toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-white/[0.06] text-white/60 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/[0.08]">{t.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-400 font-medium text-xs">{t.email}</div>
                        {t.address && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin className="size-2.5 text-slate-600" />
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate max-w-[150px]">{t.address}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-white">{t.completedJobs || t.completed_jobs || 0}</td>
                      <td className="px-6 py-4 text-center">
                        <div className={`w-2.5 h-2.5 rounded-full mx-auto ${t.online ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-700'}`} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition">
                          <Link href={`/admin/technicians/details?id=${t.id}`} className="p-2 text-slate-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => deleteTechnician(t.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
