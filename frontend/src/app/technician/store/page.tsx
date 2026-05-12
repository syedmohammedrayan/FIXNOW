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
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden text-slate-600 font-sans">
      {/* Cinematic Background Orbs */}
      <div className="fixed top-0 right-0 w-[50vw] h-[50vw] bg-indigo-500/[0.03] blur-[150px] rounded-full pointer-events-none -mr-[10vw] -mt-[10vw] z-0" />
      <div className="fixed bottom-0 left-0 w-[40vw] h-[40vw] bg-emerald-500/[0.02] blur-[120px] rounded-full pointer-events-none -ml-[10vw] -mb-[10vw] z-0" />

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
        "pl-0 md:pl-[78px] lg:pl-[280px] pt-20 md:pt-0 min-h-screen transition-all duration-700 relative z-10",
        isSidebarOpen ? "hidden md:block" : "block"
      )}>
        <div className="flex flex-col xl:flex-row max-w-[1800px] mx-auto min-h-screen">
        <div className="flex-1 p-4 sm:p-6 lg:p-10">
          <header className="mb-8 lg:mb-14">
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-4 italic uppercase">
              Inventory <Cpu className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
            </motion.h1>
            <p className="text-slate-500 mt-4 font-black uppercase tracking-[0.2em] text-xs opacity-60">Sourcing high-grade components for professionals.</p>
          </header>

          <div className="flex flex-col sm:flex-row gap-4 mb-10 lg:mb-14">
            <div className="relative flex-1 group">
              <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input type="text" placeholder="Search high-grade materials..." className="w-full bg-white border border-black/5 rounded-2xl pl-14 pr-6 py-4 text-slate-900 focus:outline-none focus:border-indigo-500/30 shadow-sm transition-all font-bold placeholder:text-slate-300" />
            </div>
            <button className="px-8 py-4 bg-white border border-black/5 rounded-2xl text-slate-500 hover:text-indigo-600 shadow-sm transition-all flex items-center gap-3 font-black uppercase tracking-widest text-xs"><Filter className="w-4 h-4" /> Filters</button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
              <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-4" />
              <p className="font-bold tracking-widest uppercase text-xs">Syncing Catalog...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-8">
              {products.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/45 backdrop-blur-[40px] border border-black/5 rounded-[3rem] p-6 sm:p-8 hover:border-indigo-500/20 hover:bg-white/60 transition-all duration-500 group flex flex-col relative overflow-hidden shadow-xl shadow-black/[0.02]">
                  <div className="h-56 bg-slate-50 border border-black/[0.04] rounded-[2rem] mb-8 overflow-hidden flex items-center justify-center relative shadow-inner">
                    {product.image ? (
                      <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                    ) : (
                      <span className="text-7xl drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110">{product.icon}</span>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md border border-black/5 px-4 py-2 rounded-2xl shadow-xl">
                      <p className="text-indigo-600 font-black text-sm italic">₹{(product.price * 80).toLocaleString()}</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors italic uppercase">{product.name}</h3>
                  <p className="text-slate-500 text-xs mt-3 line-clamp-2 leading-relaxed h-10 font-bold uppercase tracking-tight opacity-70">{product.description}</p>
                  <div className="mt-10 pt-8 border-t border-black/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Ready</span>
                    </div>
                    <button onClick={() => addToCart(product)} className="px-8 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-black/10 active:scale-95 italic">Add to Manifest</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <section className="mt-28">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4 italic uppercase">
                Requisition Tracking <Activity className="w-8 h-8 text-indigo-600" />
              </h2>
            </div>
            <div className="grid gap-8">
              {orderHistory.map(order => (
                <div key={order.id} className="bg-white/45 backdrop-blur-[40px] border border-black/5 rounded-[3rem] p-8 sm:p-10 shadow-xl shadow-black/[0.02] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 group hover:bg-white/60 transition-all duration-500">
                  <div className="flex gap-8 items-center">
                    <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                      order.status === 'Approved' ? 'bg-emerald-500 shadow-xl shadow-emerald-500/20' :
                        order.status === 'Rejected' ? 'bg-rose-500 shadow-xl shadow-rose-500/20' : 'bg-slate-100 text-slate-400 border border-black/5')}>
                      <Package className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 italic uppercase">Order #{order.id.slice(-6).toUpperCase()}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Status: <span className={cn("italic", order.status === 'Approved' ? 'text-emerald-600' : order.status === 'Rejected' ? 'text-rose-600' : 'text-amber-600')}>{order.status}</span></p>
                    </div>
                  </div>

                  <div className="flex-1 md:px-12 w-full">
                    <div className="flex gap-8 mb-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol</span>
                        <span className="text-xs font-black text-slate-900 capitalize mt-1">{order.paymentMethod?.replace(/_/g, ' ') || 'Deduction'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verification</span>
                        <span className={cn("text-xs font-black mt-1", order.paymentStatus === 'Verified' ? 'text-emerald-600' : 'text-amber-600')}>
                          {order.paymentStatus || (order.paymentMethod === 'pay_now' ? 'Pending' : 'Approved')}
                        </span>
                      </div>
                    </div>
                    {order.status === 'Approved' && order.deliveryEstimate && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-5">
                        <Clock className="w-6 h-6 text-emerald-500" />
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Inbound Delivery</p>
                          <p className="text-sm font-black text-emerald-900 mt-0.5">Scheduled within {order.deliveryEstimate}</p>
                        </div>
                      </div>
                    )}
                    {order.status === 'Pending' && (
                      <p className="text-[11px] text-slate-500 italic font-bold uppercase tracking-tight opacity-60">Logistics node reviewing request. Real-time verification in progress.</p>
                    )}
                  </div>

                  <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-black/5 pt-6 md:pt-0 md:pl-10 w-full md:w-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Total</p>
                    <p className="text-3xl font-black text-slate-900 italic tracking-tighter">₹{parseFloat(order.totalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {orderHistory.length === 0 && (
                <div className="text-center py-24 bg-white/30 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-black/5">
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No active requisitions detected</p>
                </div>
              )}
            </div>
          </section>

          <section className="mt-28 mb-20">
            <div className="bg-white/45 backdrop-blur-[40px] border border-black/5 rounded-[4rem] p-10 lg:p-16 relative overflow-hidden shadow-xl shadow-black/[0.02]">
              <div className="relative z-10 flex flex-col lg:flex-row gap-16">
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center gap-5 italic uppercase">Custom Sourcing <Camera className="w-8 h-8 text-indigo-600" /></h2>
                  <p className="text-slate-500 mt-6 max-w-xl leading-relaxed font-bold uppercase tracking-tight opacity-70 text-xs">Need specialized equipment? Our logistics network can source high-precision tools and components globally.</p>
                  <div className="mt-12 space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block px-1 italic">Item Specification</label>
                      <input type="text" placeholder="Model number or specific name..." value={customToolName} onChange={(e) => setCustomToolName(e.target.value)} className="w-full bg-white border border-black/5 rounded-2xl px-7 py-5 text-slate-900 focus:outline-none focus:border-indigo-500/30 transition-all font-black placeholder:text-slate-200 shadow-inner" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block px-1 italic">Requirement Details</label>
                      <textarea placeholder="Explain your technical requirement..." value={customToolDesc} onChange={(e) => setCustomToolDesc(e.target.value)} className="w-full h-40 bg-white border border-black/5 rounded-2xl px-7 py-5 text-slate-900 focus:outline-none focus:border-indigo-500/30 transition-all resize-none font-bold placeholder:text-slate-200 shadow-inner" />
                    </div>
                  </div>
                </div>
                <div className="lg:w-[400px] shrink-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block px-1 italic text-center lg:text-left">Reference Capture</label>
                  <div onClick={() => fileInputRef.current?.click()} className={cn("w-full aspect-square rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group bg-slate-50 shadow-inner", imagePreview ? "border-indigo-500/30" : "border-black/5 hover:border-indigo-500/20")}>
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Preview" />
                        <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                          <p className="text-white font-black text-sm uppercase tracking-[0.2em] italic">Update Signal</p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-10">
                        <div className="w-20 h-20 bg-white border border-black/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                          <Upload className="w-10 h-10 text-indigo-600" />
                        </div>
                        <p className="text-slate-900 font-black uppercase tracking-[0.2em] text-[10px] italic">Upload Data</p>
                        <p className="text-slate-400 text-[9px] font-black mt-3 uppercase tracking-widest leading-relaxed">Visual verification accelerates protocol.</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="w-full xl:w-[480px] bg-white/45 backdrop-blur-[60px] xl:border-l border-black/[0.04] p-8 lg:p-12 xl:sticky xl:top-0 xl:h-screen flex flex-col shadow-2xl xl:order-last order-first relative z-20">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 italic uppercase">Manifest <ShoppingCart className="w-6 h-6 text-indigo-600" /></h2>
            <div className="px-4 py-1.5 bg-slate-900 rounded-xl shadow-lg">
              <span className="text-white font-black text-xs uppercase tracking-widest italic">{cart.length + (customToolName ? 1 : 0)} Items</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 mb-10">
            <AnimatePresence initial={false}>
              {cart.map(item => (
                <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white border border-black/5 rounded-[2rem] p-5 flex items-center gap-5 group shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="w-16 h-16 bg-slate-50 border border-black/[0.04] rounded-2xl flex items-center justify-center text-4xl shadow-inner">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-black text-slate-900 truncate uppercase italic">{item.name}</h4>
                    <p className="text-indigo-600 font-black text-xs mt-1 italic">₹{(item.price * 80).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center bg-slate-100 rounded-xl border border-black/5 p-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><Minus className="w-3 h-3" /></button>
                    <span className="w-8 text-center text-xs font-black text-slate-900">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="w-9 h-9 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-xl flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            {customToolName && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-5 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white border border-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
                    <Camera className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] font-black text-indigo-900 uppercase italic">Custom Sourcing</h4>
                    <p className="text-indigo-600 text-[10px] font-black mt-1 truncate uppercase tracking-widest opacity-70">{customToolName}</p>
                    <p className="text-indigo-400 font-black text-[9px] mt-2 uppercase tracking-[0.2em] italic">Pricing Pending</p>
                  </div>
                </div>
              </motion.div>
            )}
            {cart.length === 0 && !customToolName && (
              <div className="h-96 flex flex-col items-center justify-center text-center px-10">
                <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 border border-black/5 relative group shadow-inner">
                  <Package className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute -top-1 -right-1 size-5 bg-white rounded-full border border-black/5 shadow-sm flex items-center justify-center">
                    <div className="size-2 rounded-full bg-slate-300 animate-pulse" />
                  </div>
                </div>
                <p className="font-black uppercase tracking-[0.4em] text-[10px] text-slate-900 italic">Manifest Empty</p>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3 leading-relaxed">Select components from catalog to initiate requisition protocol.</p>
              </div>
            )}
          </div>
          <div className="mt-auto pt-10 border-t border-black/[0.04]">
            <div className="flex justify-between items-center mb-10">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 px-1 italic">Total Payload</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter italic">₹{(cartTotal * 80).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-600 font-black text-[10px] flex items-center justify-end gap-1.5 uppercase tracking-widest italic"><Info className="w-3.5 h-3.5" /> Inc. Tax</p>
              </div>
            </div>
            <div className="space-y-4 mb-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5 px-1 italic">Transaction Protocol</p>
              <ProtocolOption active={paymentMethod === 'deduct_from_earnings'} onClick={() => setPaymentMethod('deduct_from_earnings')} label="Payout Deduction" desc="Charge to future earnings" />
              <ProtocolOption active={paymentMethod === 'pay_now'} onClick={() => setPaymentMethod('pay_now')} label="Direct Transfer" desc="UPI / Corporate Card" />
            </div>
            <button onClick={handleCheckout} disabled={cart.length === 0 && !customToolName || checkoutStatus === 'processing'} className={cn("w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 italic", checkoutStatus === 'success' ? "bg-emerald-600 text-white shadow-emerald-500/20" : checkoutStatus === 'error' ? "bg-rose-600 text-white shadow-rose-500/20" : "bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-900/10")}>
              {checkoutStatus === 'success' ? 'Protocol Executed' : checkoutStatus === 'processing' ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Execute Requisition'}
            </button>
          </div>
        </aside>
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
    <button onClick={onClick} className={cn("w-full p-5 rounded-[1.5rem] border flex items-center gap-5 transition-all duration-300 text-left group", active ? "bg-white border-indigo-500/30 shadow-lg shadow-indigo-500/5 scale-[1.02]" : "bg-slate-50 border-black/5 hover:border-indigo-500/20 hover:bg-white shadow-sm")}>
      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500", active ? "border-indigo-600 bg-indigo-600" : "border-slate-200")}>
        {active && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
      </div>
      <div>
        <p className={cn("text-sm font-black transition-colors uppercase italic", active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-900")}>{label}</p>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-70">{desc}</p>
      </div>
    </button>
  );
}
