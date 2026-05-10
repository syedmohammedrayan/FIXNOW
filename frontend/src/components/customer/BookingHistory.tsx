'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, MapPin, CheckCircle2, AlertCircle, Navigation, 
  Calendar, ChevronRight, Star, Phone, ArrowLeft,
  Package, Loader2, XCircle, DollarSign, History, Radio
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';

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
  'Pending':     { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200', icon: <Clock className="size-4" /> },
  'Accepted':    { color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',  icon: <CheckCircle2 className="size-4" /> },
  'On the Way':  { color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200',icon: <Navigation className="size-4" /> },
  'Arrived':     { color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200',icon: <MapPin className="size-4" /> },
  'In Progress': { color: 'text-cyan-600',    bg: 'bg-cyan-50',    border: 'border-cyan-200',  icon: <Loader2 className="size-4 animate-spin" /> },
  'Completed':   { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',icon: <CheckCircle2 className="size-4" /> },
  'Declined':    { color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200',icon: <AlertCircle className="size-4" /> },
  'Cancelled':   { color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',  icon: <XCircle className="size-4" /> },
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
  onTrack: (bookingId: string) => void;
  onBack: () => void;
}

export default function BookingHistory({ userId, onTrack, onBack }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/bookings/customer/${userId}`);
        if (res.data.success) {
          const normalized = res.data.bookings
            .filter((b: any) => b.category !== 'Toilet Repair')
            .map((b: any) => {
              // Build technician object from flat fields if not already present
              const techName = b.technicianName || b.technician_name || '';
              const techAvatar = b.technicianAvatar || b.technician_avatar || null;
              const techPhone = b.technicianPhone || b.technician_phone || null;
              const techRating = b.technicianRating || b.technician_rating || 5.0;
              const techId = b.technicianId || b.technician_id || '';
              const hasTech = techName && techId && techId !== 'broadcast';

              return {
                ...b,
                // Normalize snake_case → camelCase
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
                // Construct technician object for the card display
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
    // Poll every 15s for status updates
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
      className="w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">My Bookings</h2>
            <p className="text-slate-400 text-sm font-medium mt-0.5">{bookings.length} total service requests</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setTab('active')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'active' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Active ({activeBookings.length})
        </button>
        <button 
          onClick={() => setTab('past')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'past' 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Past ({pastBookings.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading bookings...</p>
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <Package className="size-12 text-slate-300 mb-4" />
          <p className="text-slate-600 font-bold text-lg">No {tab} bookings</p>
          <p className="text-slate-400 text-sm mt-1">
            {tab === 'active' ? 'Book a service to get started!' : 'Completed bookings will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {displayedBookings.map((booking, idx) => {
              const sc = getStatus(booking.status);
              const live = isActive(booking.status);
              
              return (
                <motion.div 
                  key={booking.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-8 glass-neon-card hover:shadow-indigo-500/10 transition-all group relative overflow-hidden",
                    live ? "border-indigo-500/30 ring-1 ring-indigo-500/10" : "border-slate-100"
                  )}
                >
                  {/* Background Accents for Completed */}
                  {isCompleted(booking.status) && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                  )}

                  {/* Top row: Category + Status badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        #{booking.id.slice(-6).toUpperCase()}
                      </p>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-extrabold text-slate-900 capitalize leading-none">
                          {booking.category || 'General Service'}
                        </h3>
                        {isCompleted(booking.status) && (
                          <button 
                            onClick={() => setSelectedBooking(booking)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-800 hover:scale-105 active:scale-95 shadow-md shadow-slate-200"
                          >
                            <History className="size-3" />
                            Details
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 ${isBroadcastPending(booking) ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : `${sc.color} ${sc.bg} ${sc.border}`}`}>
                      {isBroadcastPending(booking) ? (
                        <>
                          <Radio className="size-3.5 animate-pulse" />
                          Searching for Expert...
                        </>
                      ) : (
                        <>
                          {sc.icon}
                          {booking.status}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Technician row */}
                  {booking.technician && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 relative z-10">
                      <div className="size-10 rounded-xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center shrink-0">
                        {booking.technician.avatar ? (
                          <img src={booking.technician.avatar} className="size-full object-cover" />
                        ) : (
                          <span className="text-xl">👷</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-sm truncate">{booking.technician.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Star className="size-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs text-slate-500 font-medium">{booking.technician.rating}</span>
                          {booking.technician.phone && (
                            <>
                              <span className="text-slate-300">•</span>
                              <Phone className="size-3 text-slate-400" />
                              <span className="text-xs text-slate-500">{booking.technician.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-600 font-medium">{formatDate(booking.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-600 font-medium">{formatTime(booking.createdAt)}</span>
                    </div>
                    {booking.estimatedCostRange && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">₹{booking.estimatedCostRange}</span>
                      </div>
                    )}
                  </div>

                  {booking.address && (
                    <div className="flex items-start gap-2 mb-4">
                      <MapPin className="size-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-slate-500 leading-relaxed truncate max-w-[200px] sm:max-w-none">{booking.address}</span>
                    </div>
                  )}

                  {/* OTP Display for Active Bookings */}
                  {live && booking.otp && (
                    <div className="mb-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Service OTP</span>
                       <span className="text-lg font-black text-emerald-700 tracking-[0.2em]">{booking.otp}</span>
                    </div>
                  )}

                  {/* Payment + Action Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Payment Status Badge */}
                      {booking.status === 'Cancelled' || booking.status === 'Declined' ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border text-rose-500 bg-rose-50 border-rose-200">
                          {booking.status}
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                          booking.paymentStatus === 'Paid' 
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
                            : 'text-slate-500 bg-slate-50 border-slate-200'
                        }`}>
                          {booking.paymentStatus || 'Unpaid'}
                        </span>
                      )}
                      {/* Payment Mode */}
                      {booking.status !== 'Cancelled' && booking.status !== 'Declined' && (
                        <span className="text-[10px] text-slate-400 font-medium uppercase">
                          {booking.paymentMode === 'pay_later' ? 'Pay After Service' : booking.paymentMode === 'pay_now' ? 'Online' : booking.paymentMode || 'Cash'}
                        </span>
                      )}
                      {/* Final Amount for completed */}
                      {isCompleted(booking.status) && (booking.finalAmount || booking.totalAmount) && (
                        <span className="text-xs font-black text-indigo-600 ml-1">
                          • ₹{booking.finalAmount || booking.totalAmount}
                        </span>
                      )}
                    </div>

                    {/* Track Live Button for Active Bookings */}
                    {live && booking.status !== 'Pending' && (
                      <button 
                        onClick={() => onTrack(booking.id)}
                        className={cn(
                          "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95",
                          booking.status === 'In Progress' ? "bg-cyan-600 hover:bg-cyan-500" : "bg-indigo-600 hover:bg-indigo-500"
                        )}
                      >
                        {booking.status === 'In Progress' ? <Loader2 className="size-3.5 animate-spin" /> : <Navigation className="size-3.5" />}
                        {booking.status === 'In Progress' ? 'Service In Progress' : 'Track Live'}
                        <ChevronRight className="size-3.5" />
                      </button>
                    )}

                    {/* Completed + Paid */}
                    {isCompleted(booking.status) && booking.paymentStatus === 'Paid' && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Service Completed ✓
                      </div>
                    )}

                    {/* Completed but unpaid — waiting for confirmation */}
                    {isCompleted(booking.status) && booking.paymentStatus !== 'Paid' && (
                      <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                        <Clock className="size-3.5 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Payment</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/50"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500" />
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">Service Receipt</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{selectedBooking.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{selectedBooking.category} Insights</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedBooking(null)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all hover:rotate-90 active:scale-95"
                  >
                    <XCircle className="size-5 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Service Timeline */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Booked On</p>
                      <p className="text-sm font-bold text-slate-700">{formatDate(selectedBooking.createdAt)}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{formatTime(selectedBooking.createdAt)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed On</p>
                      <p className="text-sm font-bold text-slate-700">{formatDate(selectedBooking.updatedAt || selectedBooking.createdAt)}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{formatTime(selectedBooking.updatedAt || selectedBooking.createdAt)}</p>
                    </div>
                  </div>

                  {/* Technician Info */}
                  {selectedBooking.technician && (
                    <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                      <div className="size-10 rounded-xl overflow-hidden bg-white border border-indigo-100 flex items-center justify-center shrink-0">
                        {selectedBooking.technician.avatar ? (
                          <img src={selectedBooking.technician.avatar} className="size-full object-cover" />
                        ) : (
                          <span className="text-lg">👷</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Service Expert</p>
                        <p className="text-sm font-extrabold text-slate-800">{selectedBooking.technician.name}</p>
                      </div>
                      {selectedBooking.technician.rating && (
                        <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-slate-100">
                          <Star className="size-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-slate-600">{selectedBooking.technician.rating}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Work Log — Shows ONLY real technician-entered details */}
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-indigo-900">
                       <History className="size-20" />
                    </div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="size-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <Loader2 className="size-4 text-indigo-600" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Work Log</h4>
                      {selectedBooking.servicesDone && (
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 ml-auto">By Technician</span>
                      )}
                    </div>
                    {selectedBooking.servicesDone ? (
                      <p className="text-sm text-slate-700 font-medium leading-relaxed relative z-10 bg-white/60 p-4 rounded-xl border border-white/50 shadow-sm">
                        {selectedBooking.servicesDone}
                      </p>
                    ) : (
                      <div className="relative z-10 bg-white/30 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No work log was recorded for this service</p>
                        <p className="text-[9px] text-slate-300 mt-1">Future services will include detailed technician notes</p>
                      </div>
                    )}
                  </div>

                  {/* Accessories Section */}
                  {(selectedBooking.accessories && selectedBooking.accessories.length > 0) ? (
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <Package className="size-4 text-emerald-600" />
                        </div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Consumables & Parts</h4>
                        <span className="text-[9px] font-black text-slate-400 ml-auto">{selectedBooking.accessories.length} item{selectedBooking.accessories.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedBooking.accessories.map((acc, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-sm text-slate-600 font-bold">{acc.name}</span>
                            <span className="text-sm text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded-lg">₹{acc.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
                      <XCircle className="size-6 text-slate-200" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard Service (No extra parts)</p>
                    </div>
                  )}

                  {/* Address */}
                  {selectedBooking.address && (
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <MapPin className="size-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Location</p>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{selectedBooking.address}</p>
                      </div>
                    </div>
                  )}

                  {/* Final Calculation */}
                  <div className="pt-6 border-t border-slate-100">
                    <div className="bg-slate-950 rounded-[2rem] p-6 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign className="size-16" />
                      </div>
                      <div className="flex justify-between items-end relative z-10">
                        <div>
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
                            {(selectedBooking.finalAmount || selectedBooking.totalAmount) ? 'Final Settlement' : 'Estimated Range'}
                          </p>
                          <h3 className="text-4xl font-black text-white tracking-tighter">
                            ₹{selectedBooking.finalAmount || selectedBooking.totalAmount || selectedBooking.estimatedCostRange}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                            selectedBooking.paymentStatus === 'Paid' 
                              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                              : 'bg-amber-500 text-white shadow-amber-500/20'
                          }`}>
                            <CheckCircle2 className="size-3" />
                            {selectedBooking.paymentStatus || 'Unpaid'}
                          </div>
                          <p className="text-[9px] text-white/40 font-bold uppercase mt-3 tracking-widest">
                            {selectedBooking.paymentMode === 'pay_later' ? 'Pay After Service' : selectedBooking.paymentMode === 'pay_now' ? 'Online Payment' : 'Cash Payment'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="w-full mt-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 border border-slate-200"
                >
                  Return to History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
