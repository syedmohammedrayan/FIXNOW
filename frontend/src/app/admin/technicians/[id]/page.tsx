'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Phone, Mail, MapPin, 
  CheckCircle, XCircle, DollarSign, 
  Calendar, Briefcase, Star, Clock,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/lib/config';

export default function TechnicianDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tech, setTech] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechDetails = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/users/techs/${id}/stats`);
        if (res.data.success) {
          setTech(res.data.stats);
        }
      } catch (err) {
        console.error('Error fetching tech details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTechDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen glass-panel border-white/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!tech) {
    return (
      <div className="min-h-screen glass-panel border-white/10 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Technician not found</h1>
        <button onClick={() => router.back()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen glass-panel border-white/10 text-white pb-20">
      {/* Header */}
      <header className="glass-panel border-white/10 border-b border-slate-200 sticky top-0 z-30 px-6 py-4 backdrop-blur-md glass-panel border-white/80">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-indigo-300 hover:text-indigo-600 transition font-bold"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${tech.online ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-slate-200 text-indigo-300'}`}>
              {tech.online ? 'Online' : 'Offline'}
            </span>
            {tech.approved && (
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-10">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel border-white/10 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center"
            >
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-3xl bg-slate-800 flex items-center justify-center text-4xl font-black text-slate-400 uppercase overflow-hidden border-4 border-white shadow-lg">
                  {tech.photoUrl ? (
                    <img src={tech.photoUrl} alt={tech.name} className="w-full h-full object-cover" />
                  ) : (
                    tech.name?.charAt(0)
                  )}
                </div>
                {tech.online && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full animate-pulse"></div>}
              </div>

              <h2 className="text-2xl font-black text-white mb-1">{tech.name}</h2>
              <p className="text-indigo-600 font-bold text-sm mb-6 uppercase tracking-wider">{tech.category} Expert</p>

              <div className="w-full space-y-4 text-left">
                <div className="flex items-center gap-4 p-4 glass-panel border-white/10 rounded-2xl border border-slate-100">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div className="truncate">
                    <p className="text-[10px] font-black uppercase text-slate-400">Email Address</p>
                    <p className="text-sm font-bold text-white">{tech.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 glass-panel border-white/10 rounded-2xl border border-slate-100">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Phone Number</p>
                    <p className="text-sm font-bold text-white">{tech.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 glass-panel border-white/10 rounded-2xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Address</p>
                    <p className="text-sm font-bold text-white">{tech.address || 'Not Provided'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Skills Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 glass-panel border-white/10 rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100"
            >
              <h3 className="font-black text-white text-sm mb-4 uppercase tracking-widest flex items-center gap-2">
                <Star className="w-4 h-4 text-indigo-600" /> Professional Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {tech.skills?.map((skill: string) => (
                  <span key={skill} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Stats & Performance */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                icon={<CheckCircle className="text-emerald-500" />} 
                label="Completed" 
                value={tech.ordersCompleted} 
                color="emerald" 
              />
              <StatCard 
                icon={<XCircle className="text-rose-500" />} 
                label="Cancelled" 
                value={tech.ordersCancelled} 
                color="rose" 
              />
              <StatCard 
                icon={<DollarSign className="text-sky-500" />} 
                label="Total Earnings" 
                value={`₹${tech.totalEarnings}`} 
                color="sky" 
              />
            </div>

            {/* Performance Overview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel border-white/10 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
                <Activity className="w-6 h-6 text-indigo-600" /> Performance Analytics
              </h3>
              
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Success Rate</p>
                      <p className="text-2xl font-black text-white">{tech.totalJobs > 0 ? Math.round((tech.ordersCompleted / tech.totalJobs) * 100) : 0}%</p>
                    </div>
                    <p className="text-xs font-bold text-slate-400">{tech.ordersCompleted} of {tech.totalJobs} jobs</p>
                  </div>
                  <div className="w-full h-3 bg-slate-800/40 backdrop-blur-md rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${tech.totalJobs > 0 ? (tech.ordersCompleted / tech.totalJobs) * 100 : 0}%` }}
                      className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Average Rating</p>
                     <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-white">{tech.rating || '5.0'}</span>
                        <div className="flex gap-0.5">
                           {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                        </div>
                     </div>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Member Since</p>
                     <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <span className="text-lg font-bold text-white">{new Date(tech.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity Placeholder */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Briefcase className="w-32 h-32" />
               </div>
               <h3 className="text-xl font-black mb-6">Service Area & Availability</h3>
               <div className="grid md:grid-cols-2 gap-6 relative z-10">
                  <div className="p-6 glass-panel border-white/5 rounded-3xl border border-white/10">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Primary Coverage</p>
                     <p className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500" /> City Center, Zone 1 & 2</p>
                  </div>
                  <div className="p-6 glass-panel border-white/5 rounded-3xl border border-white/10">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Shift Hours</p>
                     <p className="font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-sky-400" /> 09:00 AM - 07:00 PM</p>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: any, color: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel border-white/10 p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center gap-6"
    >
      <div className={`w-14 h-14 rounded-2xl glass-panel border-white/10 flex items-center justify-center shrink-0`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-7 h-7' })}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </motion.div>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}

