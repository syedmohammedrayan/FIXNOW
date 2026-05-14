'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  Clock, 
  User, 
  MessageSquare, 
  Image as ImageIcon, 
  CheckCircle2, 
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import TechnicianSidebar from "@/components/technician/Sidebar";
import { cn } from '@/lib/utils';
import { API_BASE } from '@/lib/config';
import { getImageUrl } from '@/lib/image-utils';

export default function TechnicianComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      setUpdatingId(complaintId);
      const response = await fetch(`${API_BASE}/api/complaints/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId,
          status: newStatus,
          technicianName: profile?.name || 'Your Technician'
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert('Error updating status: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let unsubComplaints: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch profile
        unsubProfile = onSnapshot(doc(db, 'technicians', user.uid), (docSnap) => {
          if (docSnap.exists()) setProfile(docSnap.data());
        });

        // Fetch complaints
        const q = query(
          collection(db, 'complaints'),
          where('technicianId', '==', user.uid)
        );

        unsubComplaints = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
          docs.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 
                        (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 
                        (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
            return timeB - timeA;
          });
          setComplaints(docs);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubComplaints) unsubComplaints();
    };
  }, []);

  const formatProtocolDate = (createdAt: any) => {
    try {
      if (!createdAt) return 'TIMESTAMP REDACTED';
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return 'DATA CORRUPT';
    }
  };

  const filteredComplaints = complaints.filter(c => 
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] flex selection:bg-rose-500/30 selection:text-white">
      <TechnicianSidebar profile={profile} />

      <main className="flex-1 pl-0 md:pl-[78px] lg:pl-[280px] p-4 sm:p-6 lg:p-12 relative overflow-hidden">
        {/* Cinematic Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 relative z-10">
          
          {/* Header & Control Center */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="size-12 sm:size-16 rounded-[1.25rem] sm:rounded-[1.5rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                  <ShieldAlert className="size-6 sm:size-8 text-rose-500" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                    Incident <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/70 to-white/30">Console.</span>
                  </h1>
                  <p className="text-slate-500 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Resolution Protocol Active
                  </p>
                </div>
              </div>
            </div>

            <div className="relative w-full xl:w-[400px] group">
              <div className="absolute inset-0 bg-white/[0.02] blur-xl rounded-3xl group-hover:bg-rose-500/[0.02] transition-colors" />
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-slate-500 group-focus-within:text-white transition-colors" />
                <input 
                  type="text"
                  placeholder="FILTER BY BOOKING, CUSTOMER OR INTEL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 sm:py-5 bg-[#0a0f1d]/40 border border-white/[0.08] rounded-[1.25rem] sm:rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 focus:bg-[#0a0f1d]/60 backdrop-blur-xl transition-all shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Real-time Analytics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
             {[
               { label: 'Total Incidents', value: complaints.length, color: 'text-white' },
               { label: 'Open Protocol', value: complaints.filter(c => c.status === 'Open').length, color: 'text-rose-500' },
               { label: 'In Analysis', value: complaints.filter(c => c.status === 'In Review').length, color: 'text-amber-500' },
               { label: 'Resolved Ops', value: complaints.filter(c => c.status === 'Resolved').length, color: 'text-emerald-500' }
             ].map((stat, i) => (
               <motion.div
                 key={i}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-500 group"
                 style={{ boxShadow: 'inset 0 1px 1px 0 rgba(255,255,255,0.05)' }}
               >
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1 sm:mb-2 group-hover:text-slate-400 transition-colors">{stat.label}</span>
                  <span className={cn("text-2xl sm:text-4xl font-black italic tracking-tighter", stat.color)}>{stat.value}</span>
               </motion.div>
             ))}
          </div>

          {/* Active Incident Feed */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
               <div className="relative">
                  <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full animate-pulse" />
                  <div className="size-16 sm:size-20 border-4 border-white/5 border-t-rose-500 rounded-full animate-spin relative z-10" />
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Decrypting Protocol Files...</p>
            </div>
          ) : filteredComplaints.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:gap-8">
               <AnimatePresence mode="popLayout">
                 {filteredComplaints.map((complaint, index) => (
                   <motion.div
                     key={complaint.id}
                     initial={{ opacity: 0, scale: 0.98, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ delay: index * 0.1, duration: 0.5 }}
                     className="group relative bg-[#0a0f1d]/40 backdrop-blur-[40px] border border-white/[0.08] hover:border-white/[0.15] rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 transition-all duration-700 overflow-hidden shadow-2xl"
                     style={{ boxShadow: 'inset 0 1px 1px 0 rgba(255,255,255,0.05)' }}
                   >
                     {/* Background Accent */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-rose-500/10 transition-colors duration-1000" />

                     {/* Status Badge */}
                     <div className="absolute top-6 sm:top-10 right-6 sm:right-10">
                        <span className={cn(
                          "px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg backdrop-blur-md",
                          complaint.status === 'Open' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                          complaint.status === 'In Review' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        )}>
                          {complaint.status}
                        </span>
                     </div>

                     <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 relative z-10">
                        {/* Evidence Bay */}
                        <div className="w-full lg:w-80 xl:w-96 shrink-0">
                           {complaint.imageUrl ? (
                             <div className="relative aspect-video sm:aspect-square rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border border-white/10 group-hover:border-white/20 transition-all shadow-2xl group/img">
                                <img src={getImageUrl(complaint.imageUrl)} alt="Evidence" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover/img:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-6 sm:p-8 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500">
                                   <button 
                                     onClick={() => {
                                       const url = getImageUrl(complaint.imageUrl);
                                       if (url) window.open(url, '_blank');
                                     }}
                                     className="flex items-center gap-3 text-white/70 hover:text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                                   >
                                      <div className="size-7 sm:size-8 rounded-lg bg-white/10 flex items-center justify-center">
                                         <ExternalLink className="size-3.5 sm:size-4" />
                                      </div>
                                      Expand Evidence
                                   </button>
                                </div>
                             </div>
                           ) : (
                             <div className="w-full aspect-video sm:aspect-square rounded-[1.5rem] sm:rounded-[2.5rem] bg-white/[0.02] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group-hover:bg-white/[0.04] transition-all duration-500">
                                <div className="size-12 sm:size-16 rounded-xl sm:rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5">
                                   <ImageIcon className="size-6 sm:size-8 text-white/10" />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">No Visual Intelligence</span>
                             </div>
                           )}
                        </div>

                        {/* Intelligence Data */}
                        <div className="flex-1 space-y-6 sm:space-y-8">
                           <div className="space-y-2">
                              <div className="flex items-center gap-3 text-cyan-400/60">
                                 <Clock className="size-3.5 sm:size-4" />
                                 <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]">
                                    {complaint.createdAt?.toDate().toLocaleDateString('en-IN', {
                                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                 </span>
                              </div>
                              <h3 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter italic group-hover:text-rose-500 transition-colors duration-500">
                                 Booking #{complaint.id.slice(-8).toUpperCase()}
                              </h3>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                              <div className="space-y-2">
                                 <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="size-1 bg-white/20 rounded-full" /> Source Origin
                                 </p>
                                 <div className="flex items-center gap-3 p-3 sm:p-4 bg-white/[0.03] rounded-xl sm:rounded-2xl border border-white/5">
                                    <div className="size-8 rounded-lg bg-slate-900 flex items-center justify-center text-xs">👤</div>
                                    <span className="text-xs sm:text-sm font-black text-white uppercase italic tracking-tight truncate">{complaint.customerName}</span>
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="size-1 bg-white/20 rounded-full" /> Incident Class
                                 </p>
                                 <div className="flex items-center gap-3 p-3 sm:p-4 bg-white/[0.03] rounded-xl sm:rounded-2xl border border-white/5">
                                    <div className="size-8 rounded-lg bg-slate-900 flex items-center justify-center text-xs">🛠️</div>
                                    <span className="text-xs sm:text-sm font-black text-white uppercase italic tracking-tight truncate">{complaint.category}</span>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-3">
                              <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                 <span className="size-1 bg-white/20 rounded-full" /> Narrative Transcript
                              </p>
                              <div className="p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.03] border border-white/[0.08] relative group/msg">
                                 <MessageSquare className="absolute -top-4 -left-4 size-10 sm:size-12 text-white/5 group-hover/msg:text-rose-500/10 transition-colors" />
                                 <p className="text-slate-300 text-sm sm:text-lg leading-relaxed font-medium italic relative z-10">
                                    "{complaint.description}"
                                 </p>
                              </div>
                           </div>

                            <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                              <button 
                                onClick={() => handleStatusUpdate(complaint.id, 'In Review')}
                                disabled={updatingId === complaint.id || complaint.status === 'In Review'}
                                className={cn(
                                  "w-full sm:flex-1 py-4 sm:py-5 border rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2",
                                  complaint.status === 'In Review' 
                                    ? "bg-amber-500/20 border-amber-500/30 text-amber-400 cursor-not-allowed" 
                                    : "bg-white/[0.04] border-white/[0.1] text-white hover:bg-white/[0.08] hover:border-white/20"
                                )}
                              >
                                {updatingId === complaint.id ? (
                                  <div className="size-3.5 sm:size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Clock className="size-3.5 sm:size-4" />
                                )}
                                {complaint.status === 'In Review' ? 'Review Active' : 'Initiate Review'}
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(complaint.id, 'Resolved')}
                                disabled={updatingId === complaint.id || complaint.status === 'Resolved'}
                                className={cn(
                                  "w-full sm:flex-1 py-4 sm:py-5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2",
                                  complaint.status === 'Resolved'
                                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed"
                                    : "bg-rose-500 text-slate-950 hover:bg-rose-400"
                                )}
                              >
                                {updatingId === complaint.id ? (
                                  <div className="size-3.5 sm:size-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                                ) : (
                                  <CheckCircle2 className="size-3.5 sm:size-4" />
                                )}
                                {complaint.status === 'Resolved' ? 'Protocol Completed' : 'Resolve Protocol'}
                              </button>
                            </div>
                        </div>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 sm:py-32 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem] sm:rounded-[4rem]"
            >
               <div className="relative mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                  <div className="relative size-20 sm:size-24 rounded-[2rem] sm:rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center">
                    <CheckCircle2 className="size-10 sm:size-12 text-emerald-400" />
                  </div>
               </div>
               <h3 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter">Zero Hostiles</h3>
               <p className="text-slate-500 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.5em] mt-3">All sectors operational and verified</p>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
