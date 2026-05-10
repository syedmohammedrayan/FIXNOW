'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface TechniciansTabProps {
  allTechs: any[];
  setShowAddModal: (show: boolean) => void;
  deleteTechnician: (id: string) => void;
}

export function TechniciansTab({ allTechs, setShowAddModal, deleteTechnician }: TechniciansTabProps) {
  const getValidImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <motion.div 
      key="techs" 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Workforce Management</h2>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold transition flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" /> Add New Tech
        </button>
      </div>
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/10 overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left min-w-[700px]">
          <thead className="bg-white/5 border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-white/5">
            <tr>
              <th className="px-8 py-5">Technician</th>
              <th className="px-8 py-5">Specialization</th>
              <th className="px-8 py-5">Contact</th>
              <th className="px-8 py-5 text-center">Jobs Done</th>
              <th className="px-8 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {allTechs.map(t => (
              <tr key={t.id} className="hover:bg-white/5 transition group">
                <td className="px-8 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-slate-500 uppercase overflow-hidden shrink-0">
                    {t.avatar ? (
                      <img src={getValidImageUrl(t.avatar)} className="w-full h-full object-cover" alt={t.name} />
                    ) : (
                      t.name?.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">#{t.id.slice(-6).toUpperCase()}</div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="px-2 py-1 bg-cyan-400/10 text-cyan-400 rounded-md text-[10px] font-bold border border-cyan-400/20">{t.category}</span>
                </td>
                 <td className="px-8 py-5 text-slate-500 font-medium">{t.email}</td>
                <td className="px-8 py-5 text-center font-bold text-white">
                  {t.completedJobs || t.completed_jobs || 0}
                </td>
                <td className="px-8 py-5 text-center">
                  <div className={`w-2 h-2 rounded-full mx-auto ${t.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                </td>
                <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                  <Link href={`/admin/technicians/${t.id}`} className="p-2 text-slate-500 hover:text-white transition opacity-0 group-hover:opacity-100">
                    <Eye className="w-5 h-5" />
                  </Link>
                  <button onClick={() => deleteTechnician(t.id)} className="p-2 text-slate-500 hover:text-rose-500 transition opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
