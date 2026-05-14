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
  Filter
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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'complaints', id), { status });
    } catch (err) {
      console.error('Error updating status:', err);
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
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Complaint Matrix</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Global Incident Oversight</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input 
              type="text"
              placeholder="SEARCH INCIDENTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-12 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50 transition-all"
            />
          </div>

          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
            {['All', 'Open', 'In Review', 'Resolved'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  filterStatus === s ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Incidents</p>
            <p className="text-3xl font-black text-white italic">{complaints.length}</p>
         </div>
         <div className="p-6 rounded-3xl bg-rose-500/[0.03] border border-rose-500/10 backdrop-blur-xl">
            <p className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest mb-1">Critical Open</p>
            <p className="text-3xl font-black text-rose-500 italic">{complaints.filter(c => c.status === 'Open').length}</p>
         </div>
         <div className="p-6 rounded-3xl bg-amber-500/[0.03] border border-amber-500/10 backdrop-blur-xl">
            <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest mb-1">Active Review</p>
            <p className="text-3xl font-black text-amber-500 italic">{complaints.filter(c => c.status === 'In Review').length}</p>
         </div>
         <div className="p-6 rounded-3xl bg-emerald-500/[0.03] border border-emerald-500/10 backdrop-blur-xl">
            <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">System Resolved</p>
            <p className="text-3xl font-black text-emerald-500 italic">{complaints.filter(c => c.status === 'Resolved').length}</p>
         </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
           <div className="size-12 border-4 border-white/5 border-t-rose-500 rounded-full animate-spin" />
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Aggregating Data...</p>
        </div>
      ) : filteredComplaints.length > 0 ? (
        <div className="space-y-4">
           {filteredComplaints.map((c) => (
             <div key={c.id} className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-[2.5rem] p-6 sm:p-8 transition-all duration-500">
                <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
                   
                   {/* Thumbnail */}
                   <div className="size-32 sm:size-40 rounded-[2rem] overflow-hidden border border-white/10 shrink-0 bg-slate-900 flex items-center justify-center">
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt="Proof" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="size-8 text-white/5" />
                      )}
                   </div>

                   {/* Info */}
                   <div className="flex-1 space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                         <div className="space-y-1">
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Booking #{c.bookingId.slice(-8).toUpperCase()}</h3>
                            <div className="flex items-center gap-3 text-rose-500/60">
                               <Clock className="size-3" />
                               <span className="text-[9px] font-black uppercase tracking-widest">
                                  {c.createdAt?.toDate().toLocaleString()}
                               </span>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                              c.status === 'Open' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                              c.status === 'In Review' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                              "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            )}>
                              {c.status}
                            </span>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Customer</p>
                            <div className="flex items-center gap-2">
                               <User className="size-3 text-white/40" />
                               <span className="text-xs font-bold text-white">{c.customerName}</span>
                            </div>
                         </div>
                         <div className="space-y-1 flex flex-col items-center sm:items-start">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Technician</p>
                            <div className="flex items-center gap-2">
                               <ShieldAlert className="size-3 text-cyan-400/60" />
                               <span className="text-xs font-bold text-white">{c.technicianName}</span>
                            </div>
                         </div>
                         <div className="space-y-1 flex flex-col items-end sm:items-start">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Category</p>
                            <p className="text-xs font-black text-cyan-400 uppercase italic">{c.category}</p>
                         </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                         <p className="text-xs text-slate-300 leading-relaxed font-medium">"{c.description}"</p>
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="flex lg:flex-col gap-2 shrink-0">
                      {c.imageUrl && (
                        <button 
                          onClick={() => window.open(c.imageUrl, '_blank')}
                          className="flex-1 lg:w-full p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all"
                        >
                           <ExternalLink className="size-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleUpdateStatus(c.id, 'In Review')}
                        className="flex-1 lg:w-full p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                      >
                         Review
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(c.id, 'Resolved')}
                        className="flex-1 lg:w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                      >
                         Resolve
                      </button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center">
           <div className="size-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="size-10 text-slate-600" />
           </div>
           <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Clear Skies</h3>
           <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">No active complaints detected in the matrix</p>
        </div>
      )}

    </div>
  );
}
