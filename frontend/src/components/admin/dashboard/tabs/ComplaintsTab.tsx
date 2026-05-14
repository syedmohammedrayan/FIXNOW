'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Search, 
  Clock, 
  User, 
  MessageSquare, 
  Image as ImageIcon, 
  CheckCircle2, 
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
  Trash2,
  Calendar
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export function ComplaintsTab() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'In Review' | 'Resolved'>('All');

  useEffect(() => {
    const q = query(
      collection(db, 'complaints'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, status: string, technicianName?: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/complaints/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: id,
          status,
          technicianName: technicianName || 'Admin'
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleFinalize = async (id: string) => {
    if (!confirm('Are you sure you want to finalize and remove this complaint from the database?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/complaints/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId: id })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      alert('Complaint finalized and removed.');
    } catch (err: any) {
      console.error('Error finalizing complaint:', err);
      alert('Failed to finalize: ' + err.message);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.technicianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'All' || c.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Cinematic Control Center */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="size-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
             <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em]">Global Incident Vector</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
            Complaint <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/70 to-white/30">Matrix.</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 ml-1">Real-time Global Oversight Console</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 items-center">
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH INCIDENTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-[#0a0f1d]/40 border border-white/[0.08] rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 focus:bg-[#0a0f1d]/60 backdrop-blur-xl transition-all shadow-2xl"
            />
          </div>

          <div className="flex bg-[#0a0f1d]/40 p-1.5 rounded-[1.25rem] border border-white/[0.08] backdrop-blur-xl shadow-2xl">
            {['All', 'Open', 'In Review', 'Resolved'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s as any)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500",
                  filterStatus === s 
                    ? "bg-white text-slate-950 shadow-[0_10px_20px_rgba(255,255,255,0.1)]" 
                    : "text-slate-500 hover:text-white"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Intelligence Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {[
           { label: 'Total Intel', value: complaints.length, color: 'text-white', bg: 'bg-white/[0.02]' },
           { label: 'Critical Open', value: complaints.filter(c => c.status === 'Open').length, color: 'text-rose-500', bg: 'bg-rose-500/[0.03]' },
           { label: 'Active Review', value: complaints.filter(c => c.status === 'In Review').length, color: 'text-amber-500', bg: 'bg-amber-500/[0.03]' },
           { label: 'System Resolved', value: complaints.filter(c => c.status === 'Resolved').length, color: 'text-emerald-500', bg: 'bg-emerald-500/[0.03]' }
         ].map((stat, i) => (
           <motion.div
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className={cn("p-8 rounded-[2.5rem] border border-white/[0.05] backdrop-blur-3xl group relative overflow-hidden transition-all duration-500 hover:border-white/10", stat.bg)}
             style={{ boxShadow: 'inset 0 1px 1px 0 rgba(255,255,255,0.05)' }}
           >
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                 <ShieldAlert className="size-16" />
              </div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-slate-400 transition-colors relative z-10">{stat.label}</p>
              <p className={cn("text-4xl font-black italic tracking-tighter relative z-10", stat.color)}>{stat.value}</p>
           </motion.div>
         ))}
      </div>

      {/* Incident Stream */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
           <div className="relative">
              <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full animate-pulse" />
              <div className="size-16 border-4 border-white/5 border-t-rose-500 rounded-full animate-spin relative z-10" />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Aggregating Matrix Data...</p>
        </div>
      ) : filteredComplaints.length > 0 ? (
        <div className="space-y-8">
           <AnimatePresence mode="popLayout">
             {filteredComplaints.map((c, index) => (
               <motion.div 
                 key={c.id}
                 initial={{ opacity: 0, scale: 0.98, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 transition={{ delay: index * 0.05, duration: 0.5 }}
                 className="group relative bg-[#0a0f1d]/40 backdrop-blur-[40px] border border-white/[0.08] hover:border-white/[0.15] rounded-[3rem] p-8 sm:p-10 transition-all duration-700 overflow-hidden shadow-2xl"
                 style={{ boxShadow: 'inset 0 1px 1px 0 rgba(255,255,255,0.05)' }}
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-1000" />

                  <div className="flex flex-col lg:flex-row gap-10 sm:gap-14 relative z-10">
                     
                     {/* Visual Intel thumbnail */}
                     <div className="size-40 sm:size-52 rounded-[2.5rem] overflow-hidden border border-white/10 shrink-0 bg-slate-950 flex items-center justify-center shadow-2xl group/img relative">
                        {c.imageUrl ? (
                          <>
                            <img src={c.imageUrl} alt="Proof" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover/img:scale-110" />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500" />
                          </>
                        ) : (
                          <ImageIcon className="size-10 text-white/5" />
                        )}
                        <div className="absolute top-4 left-4">
                           <span className={cn(
                             "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-2xl backdrop-blur-md",
                             c.status === 'Open' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                             c.status === 'In Review' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                             "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                           )}>
                             {c.status}
                           </span>
                        </div>
                     </div>

                     {/* Intel Context */}
                     <div className="flex-1 space-y-8">
                        <div className="flex flex-wrap items-start justify-between gap-6">
                           <div className="space-y-2">
                              <h3 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter group-hover:text-cyan-400 transition-colors duration-500 leading-none">
                                Booking #{c.bookingId.slice(-8).toUpperCase()}
                              </h3>
                              <div className="flex items-center gap-3 text-slate-500">
                                 <Clock className="size-4" />
                                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                    {c.createdAt?.toDate().toLocaleString('en-IN', {
                                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                 </span>
                              </div>
                           </div>
                           
                           {c.status === 'Resolved' && c.updatedAt && (
                              <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 px-5 py-2.5 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
                              >
                                <CheckCircle2 className="size-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                  RESOLVED: {new Date(c.updatedAt).toLocaleDateString()}
                                </span>
                              </motion.div>
                           )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                           <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="size-1 bg-white/20 rounded-full" /> Source Origin
                              </p>
                              <div className="flex items-center gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] group/item hover:bg-white/[0.05] transition-all">
                                 <User className="size-4 text-white/40 group-hover/item:text-white transition-colors" />
                                 <span className="text-sm font-black text-white uppercase italic tracking-tight truncate">{c.customerName}</span>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="size-1 bg-white/20 rounded-full" /> Assigned Expert
                              </p>
                              <div className="flex items-center gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] group/item hover:bg-white/[0.05] transition-all">
                                 <ShieldAlert className="size-4 text-cyan-400/60 group-hover/item:text-cyan-400 transition-colors" />
                                 <span className="text-sm font-black text-white uppercase italic tracking-tight truncate">{c.technicianName}</span>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="size-1 bg-white/20 rounded-full" /> Incident Class
                              </p>
                              <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] group/item hover:bg-white/[0.05] transition-all">
                                 <span className="text-sm font-black text-cyan-400 uppercase italic tracking-tight">{c.category}</span>
                                 <ArrowRight className="size-4 text-cyan-400/20 group-hover/item:translate-x-1 transition-transform" />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <span className="size-1 bg-white/20 rounded-full" /> Narrative Transcript
                           </p>
                           <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] relative group/msg overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                              <MessageSquare className="absolute -top-4 -left-4 size-14 text-white/5 group-hover/msg:text-cyan-400/10 transition-colors" />
                              <p className="text-slate-300 text-lg leading-relaxed font-medium italic relative z-10">
                                "{c.description}"
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Tactical Actions */}
                     <div className="flex lg:flex-col gap-4 shrink-0 justify-center">
                        {c.imageUrl && (
                          <button 
                            onClick={() => window.open(c.imageUrl, '_blank')}
                            className="group/action flex-1 lg:w-16 p-5 bg-white/[0.04] border border-white/[0.1] rounded-2xl flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all shadow-xl active:scale-90"
                            title="Expand Intel"
                          >
                             <ExternalLink className="size-6 transition-transform group-hover/action:scale-110" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleUpdateStatus(c.id, 'In Review')}
                          className="flex-1 lg:w-16 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 hover:bg-amber-500/20 transition-all shadow-xl active:scale-90 flex items-center justify-center"
                          title="Initiate Review"
                        >
                           <Clock className="size-6" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(c.id, 'Resolved', c.technicianName)}
                          disabled={c.status === 'Resolved'}
                          className={cn(
                            "flex-1 lg:w-16 p-5 border rounded-2xl transition-all shadow-xl active:scale-90 flex items-center justify-center",
                            c.status === 'Resolved' 
                              ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/40 cursor-not-allowed"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                          )}
                          title="Resolve Protocol"
                        >
                           <CheckCircle2 className="size-6" />
                        </button>
                        {c.status === 'Resolved' && (
                          <button 
                            onClick={() => handleFinalize(c.id)}
                            className="flex-1 lg:w-16 p-5 bg-rose-500 text-slate-950 rounded-2xl hover:bg-rose-400 transition-all shadow-[0_10px_30px_rgba(244,63,94,0.3)] active:scale-90 flex items-center justify-center"
                            title="Finalize & Purge"
                          >
                             <Trash2 className="size-6" />
                          </button>
                        )}
                     </div>
                  </div>
               </motion.div>
             ))}
           </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-40 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[4rem]"
        >
           <div className="relative mb-8">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
              <div className="relative size-24 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center">
                 <CheckCircle2 className="size-12 text-emerald-400" />
              </div>
           </div>
           <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Matrix Verified</h3>
           <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mt-3">No active incidents detected in global oversight</p>
        </motion.div>
      )}
    </div>
  );
}
