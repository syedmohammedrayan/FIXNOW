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

