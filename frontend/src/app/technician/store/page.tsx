'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  ArrowLeft,
  Filter,
  Search,
  Upload,
  Camera,
  Minus,
  Plus,
  Trash2,
  Cpu,
  Info,
  QrCode,
  X,
  Activity,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';

import TechnicianSidebar from '@/components/technician/Sidebar';
import axios from 'axios';
import { API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';

export default function TechnicianStore() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [customToolName, setCustomToolName] = useState('');
  const [customToolDesc, setCustomToolDesc] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [paymentMethod, setPaymentMethod] = useState<'deduct_from_earnings' | 'pay_now'>('deduct_from_earnings');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const prevOrdersRef = useRef<any[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u: any) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'toolOrders'), where('technicianId', '==', user.uid));
    const unsub = onSnapshot(q, (snap: any) => {
      const newOrders = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (prevOrdersRef.current.length > 0) {
        newOrders.forEach((order: any) => {
          const prev = prevOrdersRef.current.find(p => p.id === order.id);
          if (prev && prev.status !== order.status) {
             if (order.status === 'Approved') {
               setNotification({ message: `Order #${order.id.slice(-6)} has been APPROVED!`, type: 'success' });
             } else if (order.status === 'Rejected') {
               setNotification({ message: `Order #${order.id.slice(-6)} has been REJECTED.`, type: 'error' });
             }
          }
          if (prev && prev.paymentStatus !== order.paymentStatus && order.paymentStatus === 'Verified') {
            setNotification({ message: `Payment for Order #${order.id.slice(-6)} has been VERIFIED!`, type: 'success' });
          }
        });
      }
      
      prevOrdersRef.current = newOrders;
      setOrderHistory(newOrders);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const fetchBase = API_BASE === '' ? window.location.origin : API_BASE;
    axios.get(`${fetchBase}/api/tools/catalog`)
      .then(res => {
        if (res.data.success) {
          setProducts(res.data.catalog);
        }
      })
      .catch(err => console.error('Failed to load catalog:', err))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0 && !customToolName) return;
    setCheckoutStatus('processing');
    try {
      const formData = new FormData();
      formData.append('technicianId', user.uid);
      formData.append('technicianName', user.displayName || 'Technician');
      formData.append('items', JSON.stringify(cart));
      formData.append('totalAmount', (cartTotal * 80).toString());
      formData.append('paymentMethod', paymentMethod);
      if (customToolName) {
        formData.append('customToolName', customToolName);
        formData.append('customToolDescription', customToolDesc);
      }
      if (imageFile) {
        formData.append('toolImage', imageFile);
      }
      const fetchBase = API_BASE === '' ? window.location.origin : API_BASE;
      const res = await axios.post(`${fetchBase}/api/tools/order`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        if (paymentMethod === 'pay_now') {
          setPendingOrder(res.data.order);
          setShowPaymentModal(true);
          setCheckoutStatus(null);
        } else {
          setCheckoutStatus('success');
          setCart([]);
          setCustomToolName('');
          setCustomToolDesc('');
          setImageFile(null);
          setImagePreview(null);
          setTimeout(() => setCheckoutStatus(null), 4000);
        }
      }
    } catch (err) {
      console.error(err);
      setCheckoutStatus('error');
      setTimeout(() => setCheckoutStatus(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] relative overflow-hidden text-slate-400 font-sans selection:bg-indigo-500/30">
      {/* Cinematic Background Orbs - Adjusted for Dark Theme */}
      <div className="fixed top-0 right-0 w-[60vw] h-[60vw] bg-indigo-500/[0.05] blur-[150px] rounded-full pointer-events-none -mr-[15vw] -mt-[15vw] z-0" />
      <div className="fixed bottom-0 left-0 w-[50vw] h-[50vw] bg-emerald-500/[0.03] blur-[120px] rounded-full pointer-events-none -ml-[15vw] -mb-[15vw] z-0" />

      <TechnicianSidebar profile={{}} onOpenChange={setIsSidebarOpen} />
      
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={cn(
              "fixed top-4 left-1/2 z-[100] px-4 sm:px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 border font-black text-xs uppercase tracking-widest w-[calc(100%-2rem)] sm:w-auto sm:min-w-[320px] max-w-[95vw] backdrop-blur-xl",
              notification.type === 'success' ? "bg-emerald-600/90 text-white border-emerald-500/20" :
              notification.type === 'error' ? "bg-rose-600/90 text-white border-rose-500/20" :
              "bg-slate-900/90 text-white border-white/10"
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            </div>
            <span className="flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-auto hover:scale-110 transition-transform">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={cn(
        "pl-0 md:pl-[78px] lg:pl-[280px] pt-20 md:pt-0 min-h-screen transition-all duration-700 relative z-10 flex flex-col",
        isSidebarOpen ? "hidden md:block" : "block"
      )}>
        <div className="flex-1 flex flex-col xl:flex-row max-w-[1900px] mx-auto w-full">
        <div className="flex-1 p-4 sm:p-6 lg:p-10">
          <header className="mb-10 lg:mb-16">
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl sm:text-6xl font-black text-white tracking-tighter flex items-center gap-5 italic uppercase">
              Inventory <Cpu className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400" />
            </motion.h1>
            <p className="text-slate-500 mt-5 font-black uppercase tracking-[0.4em] text-[10px] opacity-70">Sourcing high-grade components for professionals.</p>
          </header>

          <div className="flex flex-col sm:flex-row gap-5 mb-12 lg:mb-16">
            <div className="relative flex-1 group">
              <Search className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
              <input type="text" placeholder="Search high-grade materials..." className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] pl-16 pr-8 py-5 text-white focus:outline-none focus:border-indigo-500/30 shadow-2xl transition-all font-bold placeholder:text-slate-600" />
            </div>
            <button className="px-10 py-5 bg-white/[0.03] border border-white/10 rounded-[1.5rem] text-slate-400 hover:text-white shadow-2xl transition-all flex items-center gap-3 font-black uppercase tracking-widest text-xs hover:bg-white/[0.08]"><Filter className="w-4 h-4" /> Filters</button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
              <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-4" />
              <p className="font-bold tracking-widest uppercase text-xs">Syncing Catalog...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-10">
              {products.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[3.5rem] p-8 sm:p-10 hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all duration-700 group flex flex-col relative overflow-hidden shadow-2xl">
                  <div className="h-64 bg-black/20 border border-white/[0.04] rounded-[2.5rem] mb-10 overflow-hidden flex items-center justify-center relative shadow-inner">
                    {product.image ? (
                      <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100" alt={product.name} />
                    ) : (
                      <span className="text-8xl drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-1000 transform group-hover:scale-110 opacity-40 group-hover:opacity-100">{product.icon}</span>
                    )}
                    <div className="absolute top-5 right-5 bg-black/60 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-2xl shadow-2xl">
                      <p className="text-indigo-400 font-black text-base italic tracking-tighter">₹{(product.price * 80).toLocaleString()}</p>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors italic uppercase tracking-tight">{product.name}</h3>
                  <p className="text-slate-500 text-[11px] mt-4 line-clamp-2 leading-relaxed h-12 font-bold uppercase tracking-wide opacity-60 group-hover:opacity-100 transition-opacity">{product.description}</p>
                  <div className="mt-12 pt-10 border-t border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] group-hover:text-slate-400 transition-colors">Deployment Ready</span>
                    </div>
                    <button onClick={() => addToCart(product)} className="px-10 py-4 bg-white text-slate-950 hover:bg-indigo-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all shadow-2xl active:scale-95 italic">Add to Manifest</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <section className="mt-32">
            <div className="flex justify-between items-center mb-14">
              <h2 className="text-4xl font-black text-white flex items-center gap-5 italic uppercase tracking-tighter">
                Requisition Tracking <Activity className="w-10 h-10 text-indigo-400" />
              </h2>
            </div>
            <div className="grid gap-10">
              {orderHistory.map(order => (
                <div key={order.id} className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[4rem] p-10 sm:p-12 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-10 group hover:bg-white/[0.05] transition-all duration-700">
                  <div className="flex gap-10 items-center">
                    <div className={cn("w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white transition-all duration-700 group-hover:scale-110 group-hover:rotate-6",
                      order.status === 'Approved' ? 'bg-emerald-500 shadow-2xl shadow-emerald-500/30' :
                        order.status === 'Rejected' ? 'bg-rose-500 shadow-2xl shadow-rose-500/30' : 'bg-white/5 border border-white/10 text-slate-500')}>
                      <Package className="w-12 h-12" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white italic uppercase tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3">Status: <span className={cn("italic", order.status === 'Approved' ? 'text-emerald-400' : order.status === 'Rejected' ? 'text-rose-400' : 'text-amber-400')}>{order.status}</span></p>
                    </div>
                  </div>

                  <div className="flex-1 md:px-16 w-full">
                    <div className="flex gap-12 mb-5">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol</span>
                        <span className="text-xs font-black text-slate-300 capitalize mt-2 italic tracking-wide">{order.paymentMethod?.replace(/_/g, ' ') || 'Deduction'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Verification</span>
                        <span className={cn("text-xs font-black mt-2 italic tracking-wide", order.paymentStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-400')}>
                          {order.paymentStatus || (order.paymentMethod === 'pay_now' ? 'Pending' : 'Approved')}
                        </span>
                      </div>
                    </div>
                    {order.status === 'Approved' && order.deliveryEstimate && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-6 flex items-center gap-6 shadow-inner">
                        <Clock className="w-8 h-8 text-emerald-400" />
                        <div>
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic opacity-80">Inbound Delivery</p>
                          <p className="text-base font-black text-emerald-50 mt-1">Scheduled within {order.deliveryEstimate}</p>
                        </div>
                      </div>
                    )}
                    {order.status === 'Pending' && (
                      <div className="flex items-center gap-3 py-2 px-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <p className="text-[11px] text-slate-500 italic font-black uppercase tracking-tight">Logistics node reviewing requisition payload...</p>
                      </div>
                    )}
                  </div>

                  <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-white/[0.04] pt-8 md:pt-0 md:pl-12 w-full md:w-auto">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Order Total</p>
                    <p className="text-4xl font-black text-white italic tracking-tighter shadow-sm">₹{parseFloat(order.totalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {orderHistory.length === 0 && (
                <div className="text-center py-32 bg-white/[0.01] backdrop-blur-md rounded-[5rem] border-2 border-dashed border-white/5 group hover:bg-white/[0.02] transition-colors duration-700">
                  <div className="size-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/5 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Package className="size-10 text-slate-500" />
                  </div>
                  <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px] italic">No active requisitions detected</p>
                </div>
              )}
            </div>
          </section>

          <section className="mt-32 mb-32">
            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[5rem] p-12 lg:p-20 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 opacity-50" />
              <div className="relative z-10 flex flex-col lg:flex-row gap-20">
                <div className="flex-1">
                  <h2 className="text-4xl font-black text-white flex items-center gap-6 italic uppercase tracking-tighter">Custom Sourcing <Camera className="w-10 h-10 text-indigo-400" /></h2>
                  <p className="text-slate-500 mt-8 max-w-xl leading-relaxed font-black uppercase tracking-[0.05em] opacity-60 text-xs">Need specialized equipment? Our logistics network can source high-precision tools and components globally.</p>
                  <div className="mt-16 space-y-10">
                    <div className="relative">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 block px-2 italic">Item Specification</label>
                      <input type="text" placeholder="Model number or specific name..." value={customToolName} onChange={(e) => setCustomToolName(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-6 text-white focus:outline-none focus:border-indigo-500/30 transition-all font-black placeholder:text-slate-800 shadow-inner" />
                    </div>
                    <div className="relative">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 block px-2 italic">Requirement Details</label>
                      <textarea placeholder="Explain your technical requirement..." value={customToolDesc} onChange={(e) => setCustomToolDesc(e.target.value)} className="w-full h-48 bg-black/40 border border-white/5 rounded-[1.5rem] px-8 py-6 text-white focus:outline-none focus:border-indigo-500/30 transition-all resize-none font-bold placeholder:text-slate-800 shadow-inner" />
                    </div>
                  </div>
                </div>
                <div className="lg:w-[450px] shrink-0">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 block px-2 italic text-center lg:text-left">Reference Capture</label>
                  <div onClick={() => fileInputRef.current?.click()} className={cn("w-full aspect-square rounded-[4rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group bg-black/20 shadow-2xl", imagePreview ? "border-indigo-500/40" : "border-white/5 hover:border-indigo-500/30")}>
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100" alt="Preview" />
                        <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center">
                          <p className="text-white font-black text-base uppercase tracking-[0.3em] italic shadow-2xl">Update Signal</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-12">
                        <div className="size-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                          <Upload className="size-10 text-white opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-white font-black uppercase tracking-[0.3em] text-[11px] italic">Upload Data</p>
                        <p className="text-slate-600 text-[9px] font-black mt-4 uppercase tracking-[0.25em] leading-relaxed">Visual verification accelerates protocol.</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="w-full xl:w-[480px] bg-black/40 backdrop-blur-[100px] xl:border-l border-white/5 p-10 lg:p-14 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] xl:order-last order-first relative z-20 min-h-screen">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-3xl font-black text-white flex items-center gap-5 italic uppercase tracking-tighter">Manifest <ShoppingCart className="w-8 h-8 text-indigo-400" /></h2>
            <div className="px-5 py-2 bg-indigo-500 rounded-2xl shadow-[0_10px_30px_rgba(99,102,241,0.3)]">
              <span className="text-white font-black text-[10px] uppercase tracking-widest italic">{cart.length + (customToolName ? 1 : 0)} Units</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-8 mb-12">
            <AnimatePresence initial={false}>
              {cart.map(item => (
                <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-6 flex items-center gap-6 group shadow-2xl hover:bg-white/[0.06] transition-all duration-500 hover:border-indigo-500/30">
                  <div className="w-20 h-20 bg-black/40 border border-white/[0.04] rounded-2xl flex items-center justify-center text-5xl shadow-inner group-hover:scale-105 transition-transform duration-500">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-black text-white truncate uppercase italic tracking-tight">{item.name}</h4>
                    <p className="text-indigo-400 font-black text-xs mt-1.5 italic">₹{(item.price * 80).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center bg-black/40 rounded-2xl border border-white/5 p-1.5">
                    <button onClick={() => updateQty(item.id, -1)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                    <span className="w-10 text-center text-xs font-black text-white">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-2xl flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            {customToolName && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-indigo-500/10 border border-indigo-500/20 rounded-[2.5rem] p-6 shadow-2xl">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/5 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Camera className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[14px] font-black text-white uppercase italic tracking-tight">Custom Sourcing</h4>
                    <p className="text-indigo-400 text-[10px] font-black mt-2 truncate uppercase tracking-widest opacity-60 italic">{customToolName}</p>
                    <p className="text-slate-600 font-black text-[9px] mt-3 uppercase tracking-[0.3em] italic">Pricing Pending</p>
                  </div>
                </div>
              </motion.div>
            )}
            {cart.length === 0 && !customToolName && (
              <div className="h-[500px] flex flex-col items-center justify-center text-center px-12">
                <div className="size-32 bg-white/[0.02] rounded-[3.5rem] flex items-center justify-center mb-10 border border-white/[0.05] relative group shadow-2xl">
                  <Package className="size-12 text-slate-700 group-hover:scale-110 group-hover:text-slate-500 transition-all duration-1000" />
                  <div className="absolute -top-1 -right-1 size-7 bg-black rounded-full border border-white/5 shadow-2xl flex items-center justify-center">
                    <div className="size-2.5 rounded-full bg-slate-800 animate-pulse" />
                  </div>
                </div>
                <p className="font-black uppercase tracking-[0.5em] text-[11px] text-slate-500 italic">Manifest Empty</p>
                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em] mt-5 leading-relaxed opacity-40">Initiate requisition protocol via inventory selection.</p>
              </div>
            )}
          </div>
          <div className="mt-auto pt-14 border-t border-white/[0.04]">
            <div className="flex justify-between items-center mb-12">
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-3 px-2 italic">Total Payload</p>
                <p className="text-5xl font-black text-white tracking-tighter italic shadow-2xl">₹{(cartTotal * 80).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-400 font-black text-[10px] flex items-center justify-end gap-2 uppercase tracking-widest italic opacity-60"><Info className="w-4 h-4" /> Protocol Surcharge Included</p>
              </div>
            </div>
            <div className="space-y-5 mb-12">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 px-2 italic">Transaction Protocol</p>
              <ProtocolOption active={paymentMethod === 'deduct_from_earnings'} onClick={() => setPaymentMethod('deduct_from_earnings')} label="Payout Deduction" desc="Charge to future earnings" />
              <ProtocolOption active={paymentMethod === 'pay_now'} onClick={() => setPaymentMethod('pay_now')} label="Direct Transfer" desc="UPI / Corporate Card" />
            </div>
            <button onClick={handleCheckout} disabled={cart.length === 0 && !customToolName || checkoutStatus === 'processing'} className={cn("w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[12px] transition-all shadow-2xl active:scale-[0.97] flex items-center justify-center gap-4 italic", checkoutStatus === 'success' ? "bg-emerald-600 text-white" : checkoutStatus === 'error' ? "bg-rose-600 text-white" : "bg-white text-slate-950 hover:bg-indigo-500 hover:text-white shadow-indigo-500/20")}>
              {checkoutStatus === 'success' ? 'Protocol Executed' : checkoutStatus === 'processing' ? <div className="w-6 h-6 border-3 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> : 'Execute Requisition'}
            </button>
          </div>
        </aside>
        </div>
      </main>


      <AnimatePresence>
        {showPaymentModal && pendingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setShowPaymentModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>

              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                  <QrCode className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white">Finalize Purchase</h3>
                <p className="text-slate-400 mt-2 text-sm font-medium">Scan with any UPI app to complete order</p>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-inner mb-10 flex items-center justify-center">
                <QRCodeSVG
                  value={`upi://pay?pa=fixnow@upi&pn=FIXNOW%20Admin&am=${(cartTotal * 80)}&cu=INR&tn=Order%20${pendingOrder.id}`}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order Amount</span>
                  <span className="text-lg font-black text-white">₹{(cartTotal * 80).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order ID</span>
                  <span className="text-xs font-mono text-slate-400 font-bold">{pendingOrder.id}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setCheckoutStatus('success');
                  setCart([]);
                  setCustomToolName('');
                  setCustomToolDesc('');
                  setImageFile(null);
                  setImagePreview(null);
                  setTimeout(() => setCheckoutStatus(null), 4000);
                }}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                I Have Paid
              </button>
              <p className="text-center text-[10px] text-slate-500 mt-6 font-bold uppercase tracking-[0.2em]">Secure UPI Transaction Protected by FixNow</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProtocolOption({ active, onClick, label, desc }: { active: boolean, onClick: () => void, label: string, desc: string }) {
  return (
    <button onClick={onClick} className={cn("w-full p-6 rounded-[2rem] border flex items-center gap-6 transition-all duration-500 text-left group", active ? "bg-white/[0.08] border-indigo-500/50 shadow-2xl scale-[1.03]" : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]")}>
      <div className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-700", active ? "border-indigo-500 bg-indigo-500" : "border-slate-800")}>
        {active && <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)]" />}
      </div>
      <div>
        <p className={cn("text-base font-black transition-colors uppercase italic tracking-tight", active ? "text-white" : "text-slate-500 group-hover:text-slate-300")}>{label}</p>
        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1.5 opacity-60 italic">{desc}</p>
      </div>
    </button>
  );
}
