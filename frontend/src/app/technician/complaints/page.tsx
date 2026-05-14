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
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import TechnicianSidebar from "@/components/technician/Sidebar";
import { cn } from '@/lib/utils';

export default function TechnicianComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Fetch profile
        const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) setProfile(docSnap.data());
        });

        // Fetch complaints
        const q = query(
          collection(db, 'complaints'),
          where('technicianId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubComplaints = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setComplaints(docs);
          setLoading(false);
        });

        return () => {
          unsubProfile();
          unsubComplaints();
        };
      }
    });

    return () => unsubAuth();
  }, []);

  const filteredComplaints = complaints.filter(c => 
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <TechnicianSidebar profile={profile} />

      <main className="flex-1 pl-0 md:pl-[78px] lg:pl-[280px] p-6 lg:p-12">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <ShieldAlert className="size-6 text-rose-500" />
                </div>
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Customer Complaints</h1>
              </div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] ml-1">Resolution Protocol Console</p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input 
                type="text"
                placeholder="SEARCH COMPLAINTS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50 transition-all"
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Reports</span>
                <span className="text-2xl font-black text-white italic">{complaints.length}</span>
             </div>
             <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Open Issues</span>
                <span className="text-2xl font-black text-rose-500 italic">{complaints.filter(c => c.status === 'Open').length}</span>
             </div>
             <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">In Review</span>
                <span className="text-2xl font-black text-amber-500 italic">{complaints.filter(c => c.status === 'In Review').length}</span>
             </div>
             <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resolved</span>
                <span className="text-2xl font-black text-emerald-500 italic">{complaints.filter(c => c.status === 'Resolved').length}</span>
             </div>
          </div>

          {/* Complaints Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
               <div className="size-16 border-4 border-white/10 border-t-rose-500 rounded-full animate-spin" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Decrypting Files...</p>
            </div>
          ) : filteredComplaints.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
               <AnimatePresence>
                 {filteredComplaints.map((complaint, index) => (
                   <motion.div
                     key={complaint.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: index * 0.1 }}
                     className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-[2.5rem] p-8 transition-all duration-500 overflow-hidden"
                   >
                     {/* Status Badge */}
                     <div className="absolute top-8 right-8">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          complaint.status === 'Open' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                          complaint.status === 'In Review' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        )}>
                          {complaint.status}
                        </span>
                     </div>

                     <div className="flex flex-col lg:flex-row gap-10">
                        {/* Image Section */}
                        {complaint.imageUrl ? (
                          <div className="w-full lg:w-80 shrink-0">
                             <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10 group-hover:border-white/20 transition-all">
                                <img src={complaint.imageUrl} alt="Complaint Proof" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                                   <button 
                                     onClick={() => window.open(complaint.imageUrl, '_blank')}
                                     className="flex items-center gap-2 text-white/70 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                                   >
                                      <ExternalLink className="size-3" />
                                      View Full Image
                                   </button>
                                </div>
                             </div>
                          </div>
                        ) : (
                          <div className="w-full lg:w-80 shrink-0 aspect-square rounded-[2rem] bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
                             <ImageIcon className="size-10 text-white/10" />
                             <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">No Visual Evidence</span>
                          </div>
                        )}

                        {/* Content Section */}
                        <div className="flex-1 space-y-6">
                           <div className="space-y-1">
                              <div className="flex items-center gap-3 text-cyan-400">
                                 <Clock className="size-3.5" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">
                                    {complaint.createdAt?.toDate().toLocaleDateString('en-IN', {
                                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                 </span>
                              </div>
                              <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">
                                 Booking #{complaint.bookingId.slice(-8).toUpperCase()}
                              </h3>
                           </div>

                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer</p>
                                 <div className="flex items-center gap-2">
                                    <User className="size-3.5 text-white/40" />
                                    <span className="text-sm font-bold text-white">{complaint.customerName}</span>
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</p>
                                 <div className="flex items-center gap-2">
                                    <AlertCircle className="size-3.5 text-white/40" />
                                    <span className="text-sm font-bold text-white">{complaint.category}</span>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue Description</p>
                              <div className="p-6 rounded-3xl bg-white/5 border border-white/5 relative">
                                 <MessageSquare className="absolute -top-3 -left-3 size-8 text-white/5" />
                                 <p className="text-slate-300 text-sm leading-relaxed font-medium italic">
                                    "{complaint.description}"
                                 </p>
                              </div>
                           </div>

                           <div className="pt-4 flex items-center gap-4">
                              <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                                 Request Review
                              </button>
                              <button className="flex-1 py-4 bg-rose-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-400 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                                 Resolve Complaint
                              </button>
                           </div>
                        </div>
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
               <div className="size-20 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8">
                  <CheckCircle2 className="size-10 text-emerald-400" />
               </div>
               <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Zero Incidents</h3>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Your performance metrics are optimal</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Helper: Firestore doc reference needs to be imported or available
import { doc } from 'firebase/firestore';
