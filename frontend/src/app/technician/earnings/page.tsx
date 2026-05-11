'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, ArrowUpRight, Calendar, Search, Download,
  TrendingUp, CreditCard, History, Activity, Clock,
  CheckCircle2, Package, MapPin, Phone, Star, Wrench,
  Banknote, AlertCircle, User
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import TechnicianSidebar from '@/components/technician/Sidebar';
import axios from 'axios';
import { API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';

interface CompletedJob {
  id: string;
  category: string;
  address: string;
  contactNumber?: string;
  customerName?: string;
  finalAmount?: number;
  totalAmount?: number;
  estimatedCostRange?: string;
  paymentStatus: string;
  paymentMode?: string;
  servicesDone?: string;
  accessories?: { name: string; price: number }[];
  completedAt?: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: 'service_payment' | 'tool_purchase';
  amount: number | null;
  status: string;
  createdAt: string;
  bookingId?: string;
  category?: string;
  customerName?: string;
}

export default function TechnicianEarnings() {
  const [user, setUser] = useState<any>(null);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);
  const [activeTab, setActiveTab] = useState<'services' | 'ledger'>('services');
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); fetchData(u.uid); }
      else router.push('/auth/login');
    });
    return () => unsub();
  }, [router]);

  const fetchData = async (uid: string) => {
    try {
      // Fetch completed bookings
      const bRes = await axios.get(`${API_BASE}/api/bookings/technician/${uid}`);
      if (bRes.data.success) {
        const all = bRes.data.bookings;
        const done = all.filter((b: any) => b.status === 'Completed');
        setCompletedJobs(done);

        const revenue = done
          .filter((b: any) => b.paymentStatus === 'Paid')
          .reduce((s: number, b: any) => s + (b.finalAmount || b.totalAmount || 0), 0);
        const pending = done
          .filter((b: any) => b.paymentStatus !== 'Paid')
          .reduce((s: number, b: any) => s + (b.finalAmount || b.totalAmount || 0), 0);
        setTotalRevenue(revenue);
        setPendingPayout(pending);
      }

      // Fetch transactions ledger
      const tRes = await axios.get(`${API_BASE}/api/bookings/transactions/technician/${uid}`);
      if (tRes.data.success) setTransactions(tRes.data.transactions);
    } catch (err) {
      console.error('Earnings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = completedJobs.filter(j =>
    (j.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (j.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (j.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const getAmount = (j: CompletedJob) =>
    j.finalAmount || j.totalAmount || parseFloat(j.estimatedCostRange?.split('-')[0] || '0') || 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <TechnicianSidebar />

      <main className="pl-0 md:pl-[78px] lg:pl-[280px] pt-16 md:pt-0 min-h-screen pb-20 transition-all duration-500">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1500px] mx-auto">

          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Financial Console</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase italic">Revenue Console</h1>
              <p className="text-slate-400 text-sm font-bold mt-1">{completedJobs.length} completed jobs</p>
            </div>
            <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 shadow-sm">
              <Download className="size-4" /> Export Ledger
            </button>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-8 lg:mb-10">
            {[
              { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: Banknote, color: 'white', sub: `${completedJobs.filter(j => j.paymentStatus === 'Paid').length} paid jobs` },
              { label: 'Pending Collections', value: `₹${pendingPayout.toLocaleString()}`, icon: Clock, color: 'white', sub: `${completedJobs.filter(j => j.paymentStatus !== 'Paid').length} unpaid jobs` },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 relative overflow-hidden group shadow-xl transition-all">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all text-white">
                  <stat.icon className="size-24" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{stat.label}</p>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-1">{stat.value}</h2>
                <p className="text-xs text-slate-500 font-bold">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8 items-center">
            {[
              { key: 'services', label: 'Completed Services', icon: Wrench },
              { key: 'ledger', label: 'Transaction Ledger', icon: History },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={cn(
                  "flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                  activeTab === t.key ? "bg-white text-slate-900 shadow-xl" : "bg-white/5 border border-white/10 text-slate-400 hover:text-white shadow-sm"
                )}
              >
                <t.icon className="size-4" /> <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}

            {/* Search */}
            <div className="relative ml-auto w-full sm:w-auto sm:max-w-xs mt-2 sm:mt-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full bg-slate-900/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-white/30 shadow-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32">
              <Activity className="size-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-indigo-300 font-black uppercase tracking-widest text-xs">Synchronizing ledgers...</p>
            </div>
          )}

          {/* COMPLETED SERVICES TAB */}
          {!loading && activeTab === 'services' && (
            <AnimatePresence mode="popLayout">
              {filteredJobs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="flex flex-col items-center justify-center py-40 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem]"
                >
                  <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/10 relative group">
                    <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full animate-pulse group-hover:bg-white/10 transition-all" />
                    <History className="size-10 text-white relative z-10" />
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">No completed services yet</h3>
                  <p className="text-slate-400 text-sm mt-3 font-bold max-w-xs text-center leading-relaxed">Your completed service history will be archived here with detailed financial breakdowns.</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job, i) => {
                    const amount = getAmount(job);
                    const paid = job.paymentStatus === 'Paid';
                    const date = job.completedAt || job.createdAt;
                    const accessories = job.accessories || [];

                    return (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden hover:border-white/20 transition-all group shadow-xl"
                      >
                        <div className="p-6 lg:p-8">
                          <div className="flex flex-col lg:flex-row gap-6">

                            {/* Left: Job Info */}
                            <div className="flex-[2] space-y-4">
                              {/* Top row */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                                    <Wrench className="size-6 text-slate-400 group-hover:text-slate-900" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{job.id.slice(-8).toUpperCase()}</p>
                                    <h3 className="text-lg font-black text-white">{job.category || 'General Service'}</h3>
                                  </div>
                                </div>
                                <div className={cn(
                                  "shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                  paid
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                )}>
                                  {paid ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                                  {paid ? 'Paid' : 'Unpaid'}
                                </div>
                              </div>

                              {/* Details grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {job.customerName && (
                                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <User className="size-4 text-slate-400 shrink-0" />
                                    <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                                      <p className="text-sm font-bold text-white">{job.customerName}</p>
                                    </div>
                                  </div>
                                )}
                                {job.contactNumber && (
                                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <Phone className="size-4 text-slate-400 shrink-0" />
                                    <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                                      <p className="text-sm font-bold text-white">{job.contactNumber}</p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                                  <Calendar className="size-4 text-slate-400 shrink-0" />
                                  <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
                                    <p className="text-sm font-bold text-white">{formatDate(date)}</p>
                                  </div>
                                </div>
                                {(job as any).serviceStartedAt && job.completedAt && (
                                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <Clock className="size-4 text-slate-400 shrink-0" />
                                    <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                                      <p className="text-sm font-bold text-white">
                                        {Math.round((new Date(job.completedAt).getTime() - new Date((job as any).serviceStartedAt).getTime()) / 60000)} mins
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {job.address && (
                                  <div className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                                    <MapPin className="size-4 text-slate-400 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                                      <p className="text-sm font-bold text-white leading-snug truncate max-w-[150px]">{job.address}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                               {/* Work done */}
                              {job.servicesDone && (
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Report</p>
                                  <p className="text-sm text-slate-300 font-bold leading-relaxed italic">"{job.servicesDone}"</p>
                                </div>
                              )}

                               {/* Accessories */}
                              {accessories.length > 0 && (
                                <div className="p-4 bg-slate-900/40 border border-white/10 rounded-2xl">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Inventory Used</p>
                                  <div className="flex flex-wrap gap-2">
                                    {accessories.map((acc, ai) => (
                                      <span key={ai} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 group-hover:border-white/20 transition-all">
                                        <Package className="size-3 text-slate-500" />
                                        {acc.name}
                                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                                        <span className="text-white">₹{acc.price}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right: Amount Card */}
                            <div className="flex-1 flex flex-col items-stretch">
                              <div className={cn(
                                "flex-1 rounded-[1.5rem] p-6 border flex flex-col justify-between",
                                paid ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
                              )}>
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: paid ? '#10b981' : '#f59e0b' }}>
                                    {paid ? 'Net Revenue' : 'Awaiting Payment'}
                                  </p>
                                  <p className="text-5xl font-black text-white tracking-tighter mb-4">
                                    ₹{amount.toLocaleString()}
                                  </p>
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between text-slate-500 font-medium">
                                      <span>Base Fee</span>
                                      <span className="text-white font-black">₹{(parseFloat(job.estimatedCostRange?.split('-')[0] || '0') || amount).toLocaleString()}</span>
                                    </div>
                                    {accessories.map((acc, ai) => (
                                      <div key={ai} className="flex justify-between text-slate-500 font-medium">
                                        <span>{acc.name}</span>
                                        <span className="text-white font-black">₹{acc.price}</span>
                                      </div>
                                    ))}
                                    <div className="flex justify-between text-slate-500 border-t border-white/10 pt-2 mt-2">
                                      <span>Payment Mode</span>
                                      <span className="font-black text-white capitalize">
                                        {job.paymentMode === 'pay_now' ? 'Online' : job.paymentMode === 'later' ? 'Cash/UPI' : 'Cash'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                                  {paid
                                    ? <><CheckCircle2 className="size-4 text-emerald-400" /><span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Transaction Settled</span></>
                                    : <><AlertCircle className="size-4 text-amber-400" /><span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending Verification</span></>
                                  }
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          )}

          {/* LEDGER TAB */}
          {!loading && activeTab === 'ledger' && (
            <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-xl">
              {/* Mobile Card Layout */}
              <div className="block sm:hidden divide-y divide-white/5">
                {transactions.length === 0 ? (
                  <div className="p-10 text-center">
                    <History className="size-10 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm font-bold">No transactions yet</p>
                  </div>
                ) : transactions.map((txn, i) => (
                  <motion.div key={txn.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="p-4 flex items-center gap-3">
                    <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", txn.type === 'service_payment' ? "bg-white/5 text-white" : "bg-white/5 text-rose-400")}>
                      {txn.type === 'service_payment' ? <Wrench className="size-4" /> : <Package className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{txn.type === 'service_payment' ? (txn.customerName || 'Service Payment') : 'Tool Purchase'}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className={cn("text-base font-black", txn.type === 'service_payment' ? "text-emerald-400" : "text-rose-400")}>
                        {txn.type === 'service_payment' ? '+' : '-'}₹{(txn.amount || 0).toLocaleString()}
                      </span>
                      <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                        txn.status === 'Success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {txn.status === 'Success' ? <CheckCircle2 className="size-2.5" /> : <Clock className="size-2.5" />}
                        {txn.status}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-white/5 bg-white/[0.02]">
                      {['Transaction ID', 'Type / Service', 'Date', 'Status', 'Amount'].map((h, i) => (
                        <th key={h} className={cn("px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest", i === 4 && "text-right")}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                      {transactions.length === 0 ? (
                        <tr><td colSpan={5} className="px-8 py-20 text-center">
                          <History className="size-10 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500 text-sm font-bold">No transactions yet</p>
                        </td></tr>
                      ) : transactions.map((txn, i) => (
                        <motion.tr
                          key={txn.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="px-8 py-5">
                            <span className="text-xs font-mono text-slate-400 group-hover:text-white transition-colors">{txn.id.slice(0, 16)}...</span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={cn("size-9 rounded-xl flex items-center justify-center", txn.type === 'service_payment' ? "bg-white/5 text-white" : "bg-white/5 text-rose-400")}>
                                {txn.type === 'service_payment' ? <Wrench className="size-4" /> : <Package className="size-4" />}
                              </div>
                              <div>
                                <p className="text-sm font-black text-white">{txn.type === 'service_payment' ? (txn.customerName || 'Service Payment') : 'Tool Purchase'}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{txn.type === 'service_payment' ? (txn.category || 'Maintenance') : 'Equipment'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                              <Calendar className="size-3" />
                              {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                              txn.status === 'Success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            )}>
                              {txn.status === 'Success' ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                              {txn.status}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className={cn("text-lg font-black", txn.type === 'service_payment' ? "text-emerald-400" : "text-rose-400")}>
                              {txn.type === 'service_payment' ? '+' : '-'} ₹{(txn.amount || 0).toLocaleString()}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

