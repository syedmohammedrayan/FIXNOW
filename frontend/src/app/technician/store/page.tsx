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
    <div className="min-h-screen bg-slate-950 text-slate-400">
      <TechnicianSidebar />
      
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

      <main className="pl-0 md:pl-[78px] lg:pl-[280px] pt-16 md:pt-0 min-h-screen flex flex-col xl:flex-row transition-all duration-500">
        <div className="flex-1 p-4 sm:p-6 lg:p-10">
          <header className="mb-8 lg:mb-12">
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3 sm:gap-4">
              Inventory <Cpu className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </motion.h1>
            <p className="text-slate-400 mt-2 font-medium text-sm sm:text-base">Sourcing high-grade components for professionals.</p>
          </header>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 lg:mb-10">
            <div className="relative flex-1 group">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition" />
              <input type="text" placeholder="Search high-grade materials..." className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-white/30 shadow-sm transition" />
            </div>
            <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white shadow-sm transition flex items-center gap-3"><Filter className="w-5 h-5" /> Filters</button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
              <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mb-4" />
              <p className="font-bold tracking-widest uppercase text-xs">Syncing Catalog...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-6">
              {products.map((product, i) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 hover:border-white/20 transition-all group flex flex-col relative overflow-hidden">
                  <div className="h-48 bg-white/5 border border-white/10 rounded-2xl mb-6 overflow-hidden flex items-center justify-center relative">
                    {product.image ? <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <span className="text-6xl drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all">{product.icon}</span>}
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full shadow-sm"><p className="text-emerald-400 font-black text-xs">₹{(product.price * 80).toLocaleString()}</p></div>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-white transition">{product.name}</h3>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed h-10 font-medium">{product.description}</p>
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">In Stock</span></div>
                    <button onClick={() => addToCart(product)} className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-black transition-all shadow-lg active:scale-95">Add to Kit</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <section className="mt-20">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-white flex items-center gap-4">Requisition Tracking <Activity className="w-8 h-8 text-white" /></h2>
            </div>
            <div className="grid gap-6">
              {orderHistory.map(order => (
                <div key={order.id} className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex gap-6 items-center">
                    <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-white",
                      order.status === 'Approved' ? 'bg-emerald-500 shadow-emerald-500/20 shadow-xl' :
                        order.status === 'Rejected' ? 'bg-rose-500' : 'bg-white/10 animate-pulse')}>
                      <Package className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white">Order #{order.id.slice(-6).toUpperCase()}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Status: <span className={cn(order.status === 'Approved' ? 'text-emerald-400' : order.status === 'Rejected' ? 'text-rose-400' : 'text-amber-400')}>{order.status}</span></p>
                    </div>
                  </div>

                  <div className="flex-1 md:px-10">
                    <div className="flex gap-4 mb-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol</span>
                        <span className="text-[11px] font-bold text-slate-400 capitalize">{order.paymentMethod?.replace(/_/g, ' ') || 'Deduction'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Verification</span>
                        <span className={cn("text-[11px] font-bold", order.paymentStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-400')}>
                          {order.paymentStatus || (order.paymentMethod === 'pay_now' ? 'Pending' : 'Approved')}
                        </span>
                      </div>
                    </div>
                    {order.status === 'Approved' && order.deliveryEstimate && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
                        <Clock className="w-6 h-6 text-emerald-400" />
                        <div>
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Inbound Delivery</p>
                          <p className="text-sm font-bold text-emerald-100">Scheduled within {order.deliveryEstimate}</p>
                        </div>
                      </div>
                    )}
                    {order.status === 'Pending' && (
                      <p className="text-xs text-slate-500 italic font-medium">Your request is currently being reviewed by the logistics team. Please stand by for real-time verification.</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order Total</p>
                    <p className="text-xl font-black text-white">₹{parseFloat(order.totalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {orderHistory.length === 0 && (
                <div className="text-center py-20 bg-slate-900/20 backdrop-blur-md rounded-[3rem] border border-dashed border-white/10">
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active requisitions found</p>
                </div>
              )}
            </div>
          </section>

          <section className="mt-20">
            <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden shadow-sm">
              <div className="relative z-10 flex flex-col lg:flex-row gap-12">
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-white flex items-center gap-4">Custom Sourcing <Camera className="w-8 h-8 text-white" /></h2>
                  <p className="text-slate-400 mt-4 max-w-lg leading-relaxed font-medium">Need something specialized that isn&apos;t in our catalog? Our logistics team can source custom tools and components within 24 hours.</p>
                  <div className="mt-10 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block px-1">Item Specification</label>
                      <input type="text" placeholder="Model number or specific name..." value={customToolName} onChange={(e) => setCustomToolName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-white/30 transition font-medium" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block px-1">Requirement Details</label>
                      <textarea placeholder="Explain your technical requirement..." value={customToolDesc} onChange={(e) => setCustomToolDesc(e.target.value)} className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-white/30 transition resize-none font-medium" />
                    </div>
                  </div>
                </div>
                <div className="lg:w-96 shrink-0 flex flex-col justify-end">
                  <div onClick={() => fileInputRef.current?.click()} className={cn("w-full aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group bg-white/5", imagePreview ? "border-white/30" : "border-white/10 hover:border-white/20")}>
                    {imagePreview ? <><img src={imagePreview} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><p className="text-white font-black text-sm uppercase tracking-widest">Update Photo</p></div></> : <div className="text-center p-8"><div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4"><Upload className="w-8 h-8 text-white" /></div><p className="text-white font-black uppercase tracking-widest text-xs">Upload Reference</p><p className="text-slate-500 text-[10px] font-bold mt-2 uppercase tracking-wider">Visual verification speeds up procurement.</p></div>}
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="w-full xl:w-[450px] bg-slate-900/40 backdrop-blur-3xl xl:border-l border-white/10 p-6 lg:p-10 xl:sticky xl:top-0 xl:h-screen flex flex-col shadow-2xl">
          <div className="flex items-center justify-between mb-10"><h2 className="text-2xl font-black text-white flex items-center gap-4">Manifest <ShoppingCart className="w-6 h-6 text-white" /></h2><div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10"><span className="text-white font-mono text-sm">{cart.length + (customToolName ? 1 : 0)} Items</span></div></div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-8">
            <AnimatePresence initial={false}>
              {cart.map(item => (
                <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4 group">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl">{item.icon}</div>
                  <div className="flex-1 min-w-0"><h4 className="text-sm font-black text-white truncate">{item.name}</h4><p className="text-emerald-400 font-black text-xs mt-1">₹{(item.price * 80).toLocaleString()}</p></div>
                  <div className="flex items-center bg-white/10 rounded-xl border border-white/10 p-1"><button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white transition"><Minus className="w-3 h-3" /></button><span className="w-8 text-center text-xs font-black text-white">{item.qty}</span><button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white transition"><Plus className="w-3 h-3" /></button></div>
                  <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 text-slate-500 hover:text-rose-500 transition"><Trash2 className="w-4 h-4" /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            {customToolName && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 rounded-3xl p-5"><div className="flex items-center gap-4"><div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center"><Camera className="w-6 h-6 text-white" /></div><div><h4 className="text-sm font-black text-white">Custom Request</h4><p className="text-slate-400 text-[10px] font-bold mt-1 truncate max-w-[150px] uppercase tracking-wider">{customToolName}</p><p className="text-slate-500 font-black text-[10px] mt-2 uppercase tracking-widest">Price TBD</p></div></div></motion.div>
            )}
            {cart.length === 0 && !customToolName && (
              <div className="h-80 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/10 relative group">
                  <Package className="w-8 h-8 text-slate-500 relative z-10" />
                </div>
                <p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-500">Manifest Empty</p>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-2">Add components to begin</p>
              </div>
            )}
          </div>
          <div className="mt-auto pt-8 border-t border-white/10">
            <div className="flex justify-between items-center mb-8"><div><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 px-1">Total Payload</p><p className="text-3xl font-black text-white tracking-tighter">₹{(cartTotal * 80).toLocaleString()}</p></div><div className="text-right"><p className="text-emerald-400 font-black text-[10px] flex items-center justify-end gap-1 uppercase tracking-widest"><Info className="w-3 h-3" /> Inc. Tax</p></div></div>
            <div className="space-y-3 mb-8">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-1">Transaction Protocol</p>
              <ProtocolOption active={paymentMethod === 'deduct_from_earnings'} onClick={() => setPaymentMethod('deduct_from_earnings')} label="Payout Deduction" desc="Charge to future earnings" />
              <ProtocolOption active={paymentMethod === 'pay_now'} onClick={() => setPaymentMethod('pay_now')} label="Direct Transfer" desc="UPI / Corporate Card" />
            </div>
            <button onClick={handleCheckout} disabled={cart.length === 0 && !customToolName || checkoutStatus === 'processing'} className={cn("w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3", checkoutStatus === 'success' ? "bg-emerald-600 text-white" : checkoutStatus === 'error' ? "bg-rose-600 text-white" : "bg-white text-slate-900 hover:bg-slate-100 shadow-white/10")}>
              {checkoutStatus === 'success' ? 'Protocol Executed' : checkoutStatus === 'processing' ? <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> : 'Execute Order'}
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
    <button onClick={onClick} className={cn("w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left", active ? "bg-white/10 border-white/30" : "bg-white/5 border-white/10 hover:border-white/20")}>
      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", active ? "border-white" : "border-white/10")}>{active && <div className="w-2.5 h-2.5 bg-white rounded-full" />}</div>
      <div><p className={cn("text-sm font-black transition-colors", active ? "text-white" : "text-slate-400")}>{label}</p><p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{desc}</p></div>
    </button>
  );
}
