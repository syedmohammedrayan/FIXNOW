'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, MapPin, CheckCircle2, AlertCircle, Navigation, 
  Calendar, ChevronRight, Star, Phone, ArrowLeft,
  Package, Loader2, XCircle, DollarSign, History, Radio, Shield, Activity
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/image-utils';
import ComplaintModal from '@/components/customer/ComplaintModal';
import { AlertTriangle } from 'lucide-react';

interface BookingTech {
  name: string;
  avatar: string | null;
  phone: string | null;
  rating: number;
}

interface Booking {
  id: string;
  category: string;
  status: string;
  address: string;
  contactNumber: string;
  estimatedCostRange: string;
  createdAt: string;
  updatedAt?: string;
  paymentMode: string;
  paymentStatus: string;
  technicianId?: string;
  technician?: BookingTech;
  otp?: string;
  finalAmount?: number;
  totalAmount?: number;
  servicesDone?: string;
  accessories?: { name: string; price: number }[];
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'Pending':     { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20', icon: <Clock className="size-4" /> },
  'Accepted':    { color: 'text-white',       bg: 'bg-white/10',       border: 'border-white/20',  icon: <CheckCircle2 className="size-4" /> },
  'On the Way':  { color: 'text-white',       bg: 'bg-white/10',       border: 'border-white/20',  icon: <Navigation className="size-4" /> },
  'Arrived':     { color: 'text-white',       bg: 'bg-white/10',       border: 'border-white/20',  icon: <MapPin className="size-4" /> },
  'In Progress': { color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    border: 'border-cyan-400/20',  icon: <Loader2 className="size-4 animate-spin" /> },
  'Completed':   { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20',icon: <CheckCircle2 className="size-4" /> },
  'Declined':    { color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/20',icon: <AlertCircle className="size-4" /> },
  'Cancelled':   { color: 'text-rose-400',    bg: 'bg-rose-400/10',    border: 'border-rose-400/20',  icon: <XCircle className="size-4" /> },
};

function getStatus(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
}

function formatDate(iso: string) {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function isActive(status: string) {
  return ['Pending', 'Accepted', 'On the Way', 'Arrived', 'In Progress'].includes(status);
}

function isCompleted(status: string) {
  return status === 'Completed';
}

function isBroadcastPending(booking: Booking) {
  return booking.status === 'Pending' && booking.paymentMode === 'pay_later' && (!booking.technicianId || booking.technicianId === 'broadcast');
}

interface Props {
  userId: string;
  userProfile?: any;
  onTrack: (bookingId: string) => void;
  onBack: () => void;
}

export default function BookingHistory({ userId, onTrack, onBack }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintBooking, setComplaintBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/bookings/customer/${userId}`);
        if (res.data.success) {
          const normalized = res.data.bookings
            .filter((b: any) => b.category !== 'Toilet Repair')
            .map((b: any) => {
              const techName = b.technicianName || b.technician_name || '';
              const techAvatar = b.technicianAvatar || b.technician_avatar || null;
              const techPhone = b.technicianPhone || b.technician_phone || null;
              const techRating = b.technicianRating || b.technician_rating || 5.0;
              const techId = b.technicianId || b.technician_id || '';
              const hasTech = techName && techId && techId !== 'broadcast';

              return {
                ...b,
                createdAt: b.createdAt || b.created_at || '',
                updatedAt: b.updatedAt || b.updated_at || '',
                paymentStatus: b.paymentStatus || b.payment_status || 'Unpaid',
                paymentMode: b.paymentMode || b.payment_mode || 'Cash',
                contactNumber: b.contactNumber || b.contact_number || '',
                estimatedCostRange: b.estimatedCostRange || b.estimated_cost_range || '',
                address: b.address || '',
                otp: b.otp || '',
                technicianId: techId,
                customerName: b.customerName || b.customer_name || '',
                totalAmount: b.totalAmount || b.total_amount || b.finalAmount || 0,
                finalAmount: b.finalAmount || b.total_amount || b.totalAmount || 0,
                servicesDone: b.servicesDone || b.services_done || '',
                technician: b.technician || (hasTech ? {
                  name: techName,
                  avatar: techAvatar,
                  phone: techPhone,
                  rating: techRating,
                } : undefined),
              };
            });
          setBookings(normalized);
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
    const interval = setInterval(fetchBookings, 15000);
    return () => clearInterval(interval);
  }, [userId]);

  const activeBookings = bookings.filter(b => isActive(b.status));
  const pastBookings = bookings.filter(b => !isActive(b.status));
  const displayedBookings = tab === 'active' ? activeBookings : pastBookings;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto px-4 sm:px-0"
    >
      {/* ── Cinematic Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <button 
            onClick={onBack}
            className="group size-12 flex items-center justify-center rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] transition-all duration-500 shadow-xl active:scale-90"
          >
            <ArrowLeft className="size-5 text-slate-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
          </button>
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
              Command <span className="text-cyan-400">Log.</span>
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <span className="size-1 rounded-full bg-cyan-500 animate-pulse" />
              {bookings.length} Operations Indexed
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 bg-slate-950/40 backdrop-blur-3xl border border-white/[0.05] rounded-2xl shadow-2xl">
          <button 
            onClick={() => setTab('active')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
              tab === 'active' 
                ? 'bg-white text-slate-950 shadow-[0_10px_20px_rgba(255,255,255,0.1)]' 
                : 'text-slate-500 hover:text-white'
            )}
          >
            Active ({activeBookings.length})
          </button>
          <button 
            onClick={() => setTab('past')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
              tab === 'past' 
                ? 'bg-white text-slate-950 shadow-[0_10px_20px_rgba(255,255,255,0.1)]' 
                : 'text-slate-500 hover:text-white'
            )}
          >
            Archive ({pastBookings.length})
          </button>
        </div>
      </div>

      {/* ── Content Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="size-12 border-2 border-white/5 border-t-cyan-500 rounded-full animate-spin mb-6" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Syncing Intel...</p>
        </div>
      ) : displayedBookings.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 px-10 border border-dashed border-white/[0.08] rounded-[3rem] bg-white/[0.02] backdrop-blur-md"
        >
          <div className="size-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-6">
            <Package className="size-8 text-slate-600" />
          </div>
          <p className="text-white font-black text-xl uppercase tracking-tighter italic">No Ops Found</p>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">
            {tab === 'active' ? 'Initiate a new service request' : 'Completed logs will appear here'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {displayedBookings.map((booking, idx) => {
              const sc = getStatus(booking.status);
              const live = isActive(booking.status);
              
              return (
                <motion.div 
                  key={booking.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className={cn(
                    "group relative p-6 sm:p-8 bg-slate-900/40 backdrop-blur-3xl border transition-all duration-500 overflow-hidden",
                    "rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
                    live ? "border-white/[0.12] hover:border-cyan-500/30" : "border-white/[0.06] hover:border-white/[0.15]"
                  )}
                >
                  {/* Glass Highlights */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-700" />
                  
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.3em] bg-cyan-400/5 px-2 py-1 rounded-lg border border-cyan-400/10">
                          #{booking.id.slice(-8).toUpperCase()}
                        </span>
                        <div className={cn(
                          "size-1.5 rounded-full",
                          live ? "bg-cyan-500 animate-pulse" : "bg-slate-600"
                        )} />
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight italic group-hover:text-cyan-400 transition-colors duration-500">
                        {booking.category || 'General Intel'}
                      </h3>
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] shadow-lg",
                      isBroadcastPending(booking) 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse' 
                        : `${sc.bg} ${sc.border} ${sc.color}`
                    )}>
                      {isBroadcastPending(booking) ? <Radio className="size-3.5" /> : sc.icon}
                      {isBroadcastPending(booking) ? 'Locating Expert' : booking.status}
                    </div>
                  </div>

                  {/* Main Intel Body */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 relative z-10">
                    {/* Date/Time */}
                    <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors duration-300">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Timestamp</p>
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white leading-none">{formatDate(booking.createdAt)}</span>
                            <span className="text-[10px] text-slate-500 font-bold mt-1.5">{formatTime(booking.createdAt)}</span>
                          </div>
                       </div>
                    </div>

                    {/* Cost / Payment */}
                    <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors duration-300">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Financial Status</p>
                       <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-white italic tracking-tighter">
                            ₹{booking.finalAmount || booking.totalAmount || booking.estimatedCostRange}
                          </span>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                            booking.paymentStatus === 'Paid' 
                              ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-400' 
                              : 'bg-white/5 border-white/10 text-slate-400'
                          )}>
                            {booking.paymentStatus || 'Pending'}
                          </span>
                       </div>
                    </div>

                    {/* Expert (if assigned) */}
                    {booking.technician && (
                      <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors duration-300">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Service Expert</p>
                         <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 bg-slate-800">
                               {booking.technician.avatar ? (
                                 <img src={getAvatarUrl(booking.technician.avatar)!} className="size-full object-cover" />
                               ) : (
                                 <div className="size-full flex items-center justify-center text-lg">👷</div>
                               )}
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-black text-white truncate italic">{booking.technician.name}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <Star className="size-3 text-amber-500 fill-amber-500" />
                                  <span className="text-[10px] text-slate-400 font-bold">{booking.technician.rating}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-white/[0.06] relative z-10">
                     <div className="flex items-center gap-3 text-slate-500 flex-1 overflow-hidden">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="text-[11px] font-bold truncate tracking-tight">{booking.address}</span>
                     </div>

                     <div className="flex items-center gap-3 w-full sm:w-auto">
                        {!live && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setSelectedBooking(booking)}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl"
                            >
                              <History className="size-3.5" />
                              Details
                            </button>
                            <button 
                              onClick={() => {
                                setComplaintBooking(booking);
                                setShowComplaintModal(true);
                              }}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl"
                            >
                              <AlertTriangle className="size-3.5" />
                              Complaint
                            </button>
                          </div>
                        )}
                        
                        {live && booking.status !== 'Pending' && (
                          <button 
                            onClick={() => onTrack(booking.id)}
                            className={cn(
                              "flex-1 sm:flex-none inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl text-slate-950 text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 shadow-2xl active:scale-95 group/btn",
                              booking.status === 'In Progress' ? "bg-cyan-400 hover:bg-cyan-300 shadow-cyan-500/20" : "bg-white hover:bg-slate-200"
                            )}
                          >
                            {booking.status === 'In Progress' ? <Loader2 className="size-4 animate-spin" /> : <Navigation className="size-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />}
                            {booking.status === 'In Progress' ? 'Ops In Progress' : 'Live Tracking'}
                          </button>
                        )}

                        {live && booking.otp && (
                          <div className="px-5 py-3 rounded-2xl bg-emerald-400/5 border border-emerald-400/20 flex flex-col items-center">
                             <span className="text-[8px] font-black text-emerald-400/60 uppercase tracking-[0.3em] mb-0.5">OTP</span>
                             <span className="text-sm font-black text-emerald-400 tracking-[0.2em]">{booking.otp}</span>
                          </div>
                        )}
                     </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Details Modal (Premium Cinematic Redesign) ── */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 sm:px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-slate-900/60 backdrop-blur-[50px] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/[0.1] max-h-[90vh] flex flex-col"
            >
              {/* Cinematic Top Banner */}
              <div className="h-2 bg-gradient-to-r from-cyan-500 via-white to-cyan-500" />
              
              <div className="p-8 sm:p-12 overflow-y-auto scrollbar-none">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-12">
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Operations Summary</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                      {selectedBooking.category} <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Manifest.</span>
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedBooking(null)}
                    className="group size-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-90"
                  >
                    <XCircle className="size-6 text-white/30 group-hover:text-white transition-colors" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Phase 01: Timeline & Expert */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-3 p-1 rounded-[2.25rem] bg-black/20 border border-white/[0.05]">
                      <div className="p-5 rounded-[2rem] bg-white/[0.03] border border-white/[0.05]">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Initiated</p>
                        <p className="text-sm font-black text-white italic">{formatDate(selectedBooking.createdAt)}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">{formatTime(selectedBooking.createdAt)}</p>
                      </div>
                      <div className="p-5 rounded-[2rem] bg-white/[0.03] border border-white/[0.05]">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Finalized</p>
                        <p className="text-sm font-black text-white italic">{formatDate(selectedBooking.updatedAt || selectedBooking.createdAt)}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">{formatTime(selectedBooking.updatedAt || selectedBooking.createdAt)}</p>
                      </div>
                    </div>

                    {selectedBooking.technician && (
                      <div className="flex items-center gap-5 p-6 rounded-[2.25rem] bg-white/[0.03] border border-white/[0.05] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                           <History className="size-20" />
                        </div>
                        <div className="size-14 rounded-2xl overflow-hidden border-2 border-white/10 flex-shrink-0 bg-slate-800 shadow-2xl relative z-10">
                           {selectedBooking.technician.avatar ? (
                             <img src={getAvatarUrl(selectedBooking.technician.avatar)!} className="size-full object-cover" />
                           ) : (
                             <div className="size-full flex items-center justify-center text-2xl">👷</div>
                           )}
                        </div>
                        <div className="relative z-10">
                          <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-1">Service Expert</p>
                          <p className="text-lg font-black text-white uppercase italic tracking-tight">{selectedBooking.technician.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <Star className="size-3 text-amber-500 fill-amber-500" />
                             <span className="text-xs font-black text-white/50">{selectedBooking.technician.rating}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phase 02: Operations Log */}
                  <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/[0.06] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <Activity className="size-32" />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                      <div className="size-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <Radio className="size-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-[0.4em]">Operations Log</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Validated Technician Entry</p>
                      </div>
                    </div>

                    {selectedBooking.servicesDone ? (
                      <div className="relative z-10">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500/50 via-white/20 to-cyan-500/50 rounded-full" />
                        <p className="pl-8 text-base text-slate-300 font-medium leading-relaxed italic">
                          "{selectedBooking.servicesDone}"
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/[0.1] relative z-10">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">No Narrative Provided</p>
                      </div>
                    )}
                  </div>

                  {/* Phase 03: Inventory & Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Parts */}
                    <div className="p-8 rounded-[2.5rem] bg-black/20 border border-white/[0.05]">
                      <div className="flex items-center gap-4 mb-6">
                        <Package className="size-5 text-emerald-400" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Consumables</h4>
                      </div>
                      
                      {selectedBooking.accessories && selectedBooking.accessories.length > 0 ? (
                        <div className="space-y-3">
                          {selectedBooking.accessories.map((acc, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] group/acc hover:bg-white/[0.06] transition-all">
                              <span className="text-xs text-slate-400 font-bold group-hover/acc:text-white transition-colors">{acc.name}</span>
                              <span className="text-xs font-black text-white tabular-nums">₹{acc.price}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
                           <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Standard Ops Only</p>
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    <div className="p-8 rounded-[2.5rem] bg-black/20 border border-white/[0.05]">
                      <div className="flex items-center gap-4 mb-6">
                        <MapPin className="size-5 text-cyan-400" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Deployment Base</h4>
                      </div>
                      <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.05]">
                        <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                          {selectedBooking.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Phase 04: Financial Manifest */}
                  <div className="pt-4">
                    <div className="relative group overflow-hidden p-1 rounded-[3rem] bg-gradient-to-br from-white/10 to-white/0 border border-white/10 shadow-2xl">
                      <div className="bg-slate-950 p-8 sm:p-10 rounded-[2.9rem] flex flex-col sm:flex-row justify-between items-center gap-8 relative overflow-hidden">
                        {/* Abstract Background Glow */}
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000" />
                        
                        <div className="text-center sm:text-left relative z-10">
                          <p className="text-[10px] font-black text-cyan-400/60 uppercase tracking-[0.4em] mb-3 italic">Final Settlement</p>
                          <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                             <span className="text-sm font-black text-white/40">₹</span>
                             <span className="text-6xl font-black text-white tracking-tighter italic">
                               {selectedBooking.finalAmount || selectedBooking.totalAmount || selectedBooking.estimatedCostRange}
                             </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center sm:items-end gap-4 relative z-10">
                           <div className={cn(
                             "px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border transition-all",
                             selectedBooking.paymentStatus === 'Paid' 
                               ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/20'
                               : 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
                           )}>
                             {selectedBooking.paymentStatus || 'Awaiting'}
                           </div>
                           <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                              <DollarSign className="size-4 text-slate-500" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {selectedBooking.paymentMode === 'pay_later' ? 'Deferred Credit' : 'Instant Protocol'}
                              </span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="w-full mt-12 py-5 rounded-[2rem] bg-white text-slate-950 text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                >
                  Close Operations File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complaint Modal */}
      {complaintBooking && (
        <ComplaintModal
          isOpen={showComplaintModal}
          onClose={() => setShowComplaintModal(false)}
          booking={{
            id: complaintBooking.id,
            technician_id: complaintBooking.technicianId || '',
            technician_name: complaintBooking.technician?.name || 'Assigned Tech',
            customer_id: userId,
            customer_name: userProfile?.name || 'Verified Customer',
            category: complaintBooking.category || 'Service'
          }}
        />
      )}
    </motion.div>
  );
}
