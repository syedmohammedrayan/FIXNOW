'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Phone,
  User,
  AlertTriangle,
  Loader2,
  ChevronRight,
  DollarSign,
  Activity,
  Search,
  CalendarDays,
  Ban
} from 'lucide-react';
import TechnicianSidebar from '@/components/technician/Sidebar';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  category: string;
  status: string;
  address?: string;
  contactNumber?: string;
  estimatedCostRange?: string;
  customerId?: string;
  customerName?: string;
  technicianId?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentMode?: string;
  paymentStatus?: string;
  serviceTime?: string;
  declinedAt?: string;
}

type TabType = 'pending' | 'active' | 'completed' | 'declined';

const TAB_CONFIG: Record<TabType, { label: string; icon: React.ReactNode; emptyMsg: string; emptyDesc: string }> = {
  pending:   { label: 'Pending',   icon: <Clock className="size-4" />,        emptyMsg: 'No pending bookings',    emptyDesc: 'New customer requests will appear here.' },
  active:    { label: 'In Progress', icon: <Activity className="size-4" />,   emptyMsg: 'No active bookings',     emptyDesc: 'Accepted bookings in progress appear here.' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="size-4" />, emptyMsg: 'No completed bookings',  emptyDesc: 'Your completed service history will show here.' },
  declined:  { label: 'Declined',  icon: <Ban className="size-4" />,          emptyMsg: 'No declined bookings',   emptyDesc: 'Declined bookings will be listed here.' },
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Pending': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'Accepted': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    case 'On the Way': return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
    case 'Arrived': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'In Progress': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'Completed': return 'text-white bg-white/10 border-white/20';
    case 'Declined': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    case 'Cancelled': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    default: return 'text-slate-400 bg-white/5 border-white/10';
  }
}

function getCategoryEmoji(category: string) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('electric')) return '⚡';
  if (cat.includes('plumb')) return '🔧';
  if (cat.includes('clean')) return '🧹';
  if (cat.includes('ac') || cat.includes('hvac')) return '❄️';
  if (cat.includes('carpent')) return '🪚';
  if (cat.includes('paint')) return '🎨';
  return '🛠️';
}

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'border-amber-500/20 text-amber-500',
    cyan: 'border-cyan-500/20 text-cyan-500',
    emerald: 'border-emerald-500/20 text-emerald-500',
    rose: 'border-rose-500/20 text-rose-500',
  };
  return (
    <div className={cn("bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border relative overflow-hidden group hover:scale-[1.02] transition-all duration-500", colorMap[color])}>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1.5">{label}</p>
        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700">
        <CalendarCheck className="size-24 text-white" />
      </div>
      <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 -mr-12 -mt-12 group-hover:opacity-20 transition-opacity", 
        color === 'amber' ? 'bg-amber-400' : color === 'cyan' ? 'bg-cyan-400' : color === 'emerald' ? 'bg-emerald-400' : 'bg-rose-400'
      )} />
    </div>
  );
}

export default function TechnicianBookings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [techProfile, setTechProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [declineModal, setDeclineModal] = useState<{ open: boolean; booking: Booking | null }>({ open: false, booking: null });
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else router.push('/auth/login');
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/users/${user.uid}`);
        if (res.data.success) setTechProfile(res.data.user);
      } catch (e) { /* ignore */ }
    };
    fetchProfile();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'bookings'), where('technicianId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedBookings: Booking[] = [];
      snapshot.forEach((doc: any) => {
        fetchedBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(fetchedBookings);
      setLoading(false);
    }, (err) => {
      console.error('Failed to listen to bookings:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleAccept = async (booking: Booking) => {
    setAccepting(booking.id);
    try {
      await axios.post(`${API_BASE}/api/bookings/update-status`, { 
        bookingId: booking.id, 
        status: 'Accepted',
        technicianId: user?.uid,
        technicianName: techProfile?.name || 'Your Technician'
      });
    } catch (e) {
      alert('Failed to accept booking.');
    } finally {
      setAccepting(null);
    }
  };

  const handleDecline = async () => {
    if (!declineModal.booking) return;
    setDeclining(true);
    try {
      await axios.post(`${API_BASE}/api/bookings/decline`, {
        bookingId: declineModal.booking.id,
        technicianId: user?.uid,
        technicianName: techProfile?.name || 'Technician',
        reason: declineReason.trim() || undefined
      });
      setDeclineModal({ open: false, booking: null });
      setDeclineReason('');
    } catch (e) {
      alert('Failed to decline booking.');
    } finally {
      setDeclining(false);
    }
  };

  const counts = {
    pending: bookings.filter(b => b.status === 'Pending').length,
    active: bookings.filter(b => ['Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    declined: bookings.filter(b => b.status === 'Declined' || b.status === 'Cancelled').length,
  };

  const filtered = (bookings.filter(b => {
    if (tab === 'pending') return b.status === 'Pending';
    if (tab === 'active') return ['Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status);
    if (tab === 'completed') return b.status === 'Completed';
    if (tab === 'declined') return b.status === 'Declined' || b.status === 'Cancelled';
    return true;
  })).filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (b.category || '').toLowerCase().includes(q) || (b.address || '').toLowerCase().includes(q) || (b.id || '').toLowerCase().includes(q);
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-400">
      <TechnicianSidebar />
      <main className="pl-0 md:pl-[78px] lg:pl-[280px] pt-16 md:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                Bookings <CalendarCheck className="w-6 h-6 sm:w-8 sm:h-8" />
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm font-medium">Manage customer service requests and track your work.</p>
            </div>
            <div className="relative group w-full sm:w-80">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border-white/10 border rounded-2xl pl-12 pr-4 py-3.5 text-white text-sm outline-none focus:border-white/30 transition"
              />
            </div>
          </header>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatMini label="Pending" value={counts.pending} color="amber" />
            <StatMini label="In Progress" value={counts.active} color="cyan" />
            <StatMini label="Completed" value={counts.completed} color="emerald" />
            <StatMini label="Declined" value={counts.declined} color="rose" />
          </div>

          <div className="flex gap-2 mb-8 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/10 overflow-x-auto max-w-full">
            {(Object.keys(TAB_CONFIG) as TabType[]).map(key => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0", tab === key ? "bg-white text-slate-900" : "text-slate-400 hover:text-white")}
              >
                {TAB_CONFIG[key].icon}
                <span className="hidden sm:inline">{TAB_CONFIG[key].label}</span>
                {counts[key] > 0 && <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black", tab === key ? "bg-slate-900 text-white" : "bg-white/10 text-slate-400")}>{counts[key]}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32"><Loader2 className="animate-spin size-12 text-white" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 bg-slate-900/40 border border-white/10 rounded-[3rem]">
              <h3 className="text-2xl font-black text-white">{TAB_CONFIG[tab].emptyMsg}</h3>
              <p className="text-slate-400 mt-3 text-center">{TAB_CONFIG[tab].emptyDesc}</p>
            </div>
          ) : (
            <div className="grid gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((booking, idx) => (
                  <motion.div key={booking.id} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-6 lg:p-8 hover:border-white/20 transition-all">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="flex gap-5 flex-1 min-w-0">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-2xl text-white">{getCategoryEmoji(booking.category)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-black text-white">{booking.category || 'Service'}</h3>
                            <span className={cn("px-3 py-1 rounded-full text-[10px] font-black border", getStatusColor(booking.status))}>{booking.status}</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">#{booking.id.slice(-6).toUpperCase()} • {formatDate(booking.createdAt)} {formatTime(booking.createdAt)}</p>
                          <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs text-slate-400">
                            {booking.address && <div className="flex items-start gap-2"><MapPin className="size-3.5" /><span>{booking.address}</span></div>}
                            {booking.contactNumber && <div className="flex items-center gap-2"><Phone className="size-3.5" /><span>{booking.contactNumber}</span></div>}
                          </div>
                        </div>
                      </div>
                      {tab === 'pending' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4 lg:mt-0">
                          <button onClick={() => handleAccept(booking)} className="flex-1 sm:flex-none px-6 py-3 bg-white text-slate-900 rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-95 transition">{accepting === booking.id ? <Loader2 className="animate-spin size-4" /> : <CheckCircle2 className="size-4" />} Accept</button>
                          <button onClick={() => setDeclineModal({ open: true, booking })} className="flex-1 sm:flex-none px-5 py-3 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-sm font-bold text-center">Decline</button>
                        </div>
                      )}
                      {tab === 'active' && (
                        <button onClick={() => router.push(`/technician/service/${booking.id}`)} className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-2"><MapPin className="size-3.5" /> Manage</button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {declineModal.open && declineModal.booking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-white/10 rounded-[2rem] p-8 max-w-md w-full">
              <h3 className="text-xl font-black text-white mb-2">Decline Booking?</h3>
              <p className="text-sm text-slate-400 mb-6">Are you sure you want to decline this request?</p>
              <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Reason (optional)" className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm mb-6 resize-none" />
              <div className="flex gap-3">
                <button onClick={() => setDeclineModal({ open: false, booking: null })} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-white">Cancel</button>
                <button onClick={handleDecline} className="flex-1 py-3 bg-rose-600 rounded-2xl text-white font-black">{declining ? <Loader2 className="animate-spin size-4" /> : 'Decline'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
