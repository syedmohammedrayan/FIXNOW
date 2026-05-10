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
  Filter,
  Search,
  CalendarDays,
  Ban,
  Sparkles
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
    case 'Pending': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'Accepted': return 'text-blue-600 bg-blue-50 border-blue-100';
    case 'On the Way': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    case 'Arrived': return 'text-violet-600 bg-violet-50 border-violet-100';
    case 'In Progress': return 'text-cyan-600 bg-cyan-50 border-cyan-100';
    case 'Completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'Declined': return 'text-rose-600 bg-rose-50 border-rose-100';
    case 'Cancelled': return 'text-rose-600 bg-rose-50 border-rose-100';
    default: return 'text-indigo-200 glass-panel border-white/10 border-slate-100';
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

export default function TechnicianBookings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [techProfile, setTechProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Decline modal state
  const [declineModal, setDeclineModal] = useState<{ open: boolean; booking: Booking | null }>({ open: false, booking: null });
  const [declineReason, setDeclineReason] = useState('');
  const [declining, setDeclining] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/auth/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch tech profile
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

  // Real-time listener for bookings
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const q = query(
      collection(db, 'bookings'),
      where('technicianId', '==', user.uid)
    );

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

  // Accept a booking
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

  // Decline a booking
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

  // Filter bookings by tab
  const filterBookings = (bookings: Booking[], tab: TabType): Booking[] => {
    switch (tab) {
      case 'pending':
        return bookings.filter(b => b.status === 'Pending');
      case 'active':
        return bookings.filter(b => ['Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status));
      case 'completed':
        return bookings.filter(b => b.status === 'Completed');
      case 'declined':
        return bookings.filter(b => b.status === 'Declined' || b.status === 'Cancelled');
      default:
        return bookings;
    }
  };

  let filtered = filterBookings(bookings, tab);
  
  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(b => 
      (b.category || '').toLowerCase().includes(q) ||
      (b.address || '').toLowerCase().includes(q) ||
      (b.id || '').toLowerCase().includes(q) ||
      (b.contactNumber || '').includes(q)
    );
  }

  // Sort: newest first
  filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const counts = {
    pending: bookings.filter(b => b.status === 'Pending').length,
    active: bookings.filter(b => ['Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    declined: bookings.filter(b => b.status === 'Declined' || b.status === 'Cancelled').length,
  };

  return (
    <div className="min-h-screen glass-panel border-white/10 text-indigo-200">
      <TechnicianSidebar />

      <main className="pl-0 md:pl-20 lg:pl-64 xl:pl-72 pt-16 md:pt-0 min-h-screen transition-all duration-500">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-black text-white tracking-tight flex items-center gap-4"
              >
                Bookings <CalendarCheck className="w-8 h-8 text-indigo-600" />
              </motion.h1>
              <p className="text-slate-400 mt-2 font-medium">
                Manage customer service requests and track your work.
              </p>
            </div>

            {/* Search */}
            <div className="relative group w-full sm:w-80">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-400 transition" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-panel border-white/10 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 shadow-sm transition"
              />
            </div>
          </header>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatMini label="Pending" value={counts.pending} color="amber" />
            <StatMini label="In Progress" value={counts.active} color="cyan" />
            <StatMini label="Completed" value={counts.completed} color="emerald" />
            <StatMini label="Declined" value={counts.declined} color="rose" />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 p-1.5 glass-panel border-white/10 rounded-2xl w-fit border border-slate-200 shadow-sm overflow-x-auto max-w-full">
            {(Object.keys(TAB_CONFIG) as TabType[]).map(key => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0",
                  tab === key 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                    : "text-indigo-300 hover:text-white hover:glass-panel border-white/10"
                )}
              >
                {TAB_CONFIG[key].icon}
                <span className="hidden sm:inline">{TAB_CONFIG[key].label}</span>
                {counts[key] > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-lg text-[10px] font-black",
                    tab === key ? "glass-panel border-white/20 text-white" : "bg-slate-800/40 backdrop-blur-md text-indigo-300"
                  )}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Loading bookings history...</p>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-40 glass-neon-card glass-panel border-white/40 border border-slate-100"
            >
              <div className="w-24 h-24 bg-indigo-50/50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-indigo-100/50 relative group">
                <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full animate-pulse group-hover:bg-indigo-500/20 transition-all" />
                <div className="relative z-10 text-indigo-600">
                  {React.cloneElement(TAB_CONFIG[tab].icon as React.ReactElement, { className: "size-10" })}
                </div>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">{TAB_CONFIG[tab].emptyMsg}</h3>
              <p className="text-indigo-300 mt-3 max-w-xs text-center font-bold text-sm leading-relaxed">{TAB_CONFIG[tab].emptyDesc}</p>
            </motion.div>
          ) : (
            <div className="grid gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((booking, idx) => (
                  <motion.div
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.04 }}
                    className="glass-panel border-white/10 border border-slate-200 hover:border-indigo-500/50 rounded-[2rem] p-6 lg:p-8 transition-all group shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      {/* Left: Booking info */}
                      <div className="flex gap-5 flex-1 min-w-0">
                        <div className="w-14 h-14 glass-panel border-white/10 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                          {getCategoryEmoji(booking.category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-black text-white capitalize">
                              {booking.category || 'General Service'}
                            </h3>
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              getStatusColor(booking.status)
                            )}>
                              {booking.status}
                            </span>
                          </div>
                          
                          <p className="text-[10px] font-bold text-indigo-300 mt-1 uppercase tracking-widest font-mono">
                            #{booking.id.slice(-6).toUpperCase()} • {formatDate(booking.createdAt)} {formatTime(booking.createdAt)}
                          </p>

                          <div className="mt-4 grid sm:grid-cols-2 gap-3">
                            {booking.address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="size-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <span className="text-xs text-indigo-300 font-medium leading-relaxed">{booking.address}</span>
                              </div>
                            )}
                            {booking.contactNumber && (
                              <div className="flex items-center gap-2">
                                <Phone className="size-3.5 text-slate-400 shrink-0" />
                                <span className="text-xs text-indigo-300 font-medium">{booking.contactNumber}</span>
                              </div>
                            )}
                            {booking.estimatedCostRange && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="size-3.5 text-emerald-600 shrink-0" />
                                <span className="text-xs text-emerald-600 font-black">₹{booking.estimatedCostRange}</span>
                              </div>
                            )}
                            {booking.serviceTime && (
                              <div className="flex items-center gap-2">
                                <CalendarDays className="size-3.5 text-slate-400 shrink-0" />
                                <span className="text-xs text-indigo-300 font-medium">{booking.serviceTime}</span>
                              </div>
                            )}
                          </div>

                          {/* Payment Info */}
                          <div className="flex items-center gap-3 mt-4">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                              booking.paymentStatus === 'Paid'
                                ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                                : 'text-indigo-300 glass-panel border-white/10 border-slate-200'
                            )}>
                              {booking.paymentStatus || 'Unpaid'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">
                              {booking.paymentMode === 'pay_now' ? 'Online' : 'Cash'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      {tab === 'pending' && (
                        <div className="flex items-center gap-3 lg:shrink-0">
                          <button
                            onClick={() => handleAccept(booking)}
                            disabled={accepting === booking.id}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 active:scale-95"
                          >
                            {accepting === booking.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-4" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => setDeclineModal({ open: true, booking })}
                            className="flex items-center gap-2 px-5 py-3 glass-panel border-white/10 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-100 rounded-2xl text-sm font-bold transition-all active:scale-95"
                          >
                            <XCircle className="size-4" />
                            Decline
                          </button>
                        </div>
                      )}

                      {tab === 'active' && (
                        <div className="flex flex-col items-end gap-2 lg:shrink-0">
                          <div className="px-4 py-2 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-600 text-xs font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            Active
                          </div>
                          <button
                            onClick={() => router.push(`/technician/service/${booking.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                          >
                            <MapPin className="size-3.5" />
                            See Location &amp; Manage
                          </button>
                        </div>
                      )}

                      {tab === 'completed' && (
                        <div className="flex items-center gap-2 lg:shrink-0">
                          <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 className="size-3.5" />
                            Completed
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Decline Confirmation Modal */}
      <AnimatePresence>
        {declineModal.open && declineModal.booking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => !declining && setDeclineModal({ open: false, booking: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel border-white/10 border border-slate-200 rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                  <AlertTriangle className="size-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Decline Booking?</h3>
                  <p className="text-sm text-slate-400 font-bold">#{declineModal.booking.id.slice(-6).toUpperCase()} • {declineModal.booking.category}</p>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                The customer will be notified that their booking was declined. You can optionally provide a reason.
              </p>

              <div className="mb-6">
                <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2 block px-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g., Schedule conflict, out of area, etc."
                  className="w-full h-24 glass-panel border-white/10 border border-slate-200 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-rose-500/50 transition resize-none placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeclineModal({ open: false, booking: null });
                    setDeclineReason('');
                  }}
                  disabled={declining}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-indigo-300 glass-panel border-white/10 hover:bg-slate-800/40 backdrop-blur-md border border-slate-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={declining}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-black text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {declining ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  Decline Booking
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'glass-panel border-white/10 border-amber-100 text-amber-600 shadow-sm',
    cyan: 'glass-panel border-white/10 border-cyan-100 text-cyan-600 shadow-sm',
    emerald: 'glass-panel border-white/10 border-emerald-100 text-emerald-600 shadow-sm',
    rose: 'glass-panel border-white/10 border-rose-100 text-rose-600 shadow-sm',
  };
  return (
    <div className={cn("glass-neon-card p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500", colorMap[color])}>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">{label}</p>
        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700">
        <CalendarCheck className="size-24" />
      </div>
      <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 -mr-12 -mt-12 group-hover:opacity-40 transition-opacity", 
        color === 'amber' ? 'bg-amber-400' : color === 'cyan' ? 'bg-cyan-400' : color === 'emerald' ? 'bg-emerald-400' : 'bg-rose-400'
      )} />
    </div>
  );
}

