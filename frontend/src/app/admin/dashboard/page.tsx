'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { API_BASE } from '@/lib/config';
import axios from 'axios';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';

// Components
import { Sidebar } from '@/components/admin/dashboard/Sidebar';
import { Navbar } from '@/components/admin/dashboard/Navbar';
import { InputField } from '@/components/admin/dashboard/shared/InputField';

// Dynamic Tabs
const OverviewTab = dynamic(() => import('@/components/admin/dashboard/tabs/OverviewTab').then(mod => mod.OverviewTab), { ssr: false });
const ApprovalsTab = dynamic(() => import('@/components/admin/dashboard/tabs/ApprovalsTab').then(mod => mod.ApprovalsTab), { ssr: false });
const TechniciansTab = dynamic(() => import('@/components/admin/dashboard/tabs/TechniciansTab').then(mod => mod.TechniciansTab), { ssr: false });
const BookingsTab = dynamic(() => import('@/components/admin/dashboard/tabs/BookingsTab').then(mod => mod.BookingsTab), { ssr: false });
const ToolsTab = dynamic(() => import('@/components/admin/dashboard/tabs/ToolsTab').then(mod => mod.ToolsTab), { ssr: false });
const TransactionsTab = dynamic(() => import('@/components/admin/dashboard/tabs/TransactionsTab').then(mod => mod.TransactionsTab), { ssr: false });
const NotificationsTab = dynamic(() => import('@/components/admin/dashboard/tabs/NotificationsTab').then(mod => mod.NotificationsTab), { ssr: false });
const LiveMapTab = dynamic(() => import('@/components/admin/dashboard/tabs/LiveMapTab').then(mod => mod.LiveMapTab), { ssr: false });

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        const t = setTimeout(() => {
          if (!auth.currentUser) router.push('/auth/login?role=admin');
        }, 2000);
        return () => clearTimeout(t);
      }
    });
    return () => unsub();
  }, [router]);

  const [techs, setTechs] = useState<any[]>([]);
  const [allTechs, setAllTechs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [toolOrders, setToolOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [deliveryData, setDeliveryData] = useState({ time: '10:00 AM', day: 'Today' });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'live-map' | 'approvals' | 'techs' | 'bookings' | 'tools' | 'transactions' | 'notifications'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  const [newTech, setNewTech] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Plumbing',
    skills: ''
  });

  const fetchData = async () => {
    try {
      const transRes = await fetch(`${API_BASE}/api/bookings/transactions/all`);
      const transData = await transRes.json();
      if (transData.success) {
        setTransactions(transData.transactions || []);
      }
      const notifRes = await fetch(`${API_BASE}/api/bookings/notifications/logs`);
      const notifData = await notifRes.json();
      if (notifData.success) {
        setNotificationLogs(notifData.logs || []);
      }

      // Fetch Technicians manually to save quota
      const techRes = await fetch(`${API_BASE}/api/users/techs/all`);
      const techData = await techRes.json();
      if (techData.success) {
        setAllTechs(techData.technicians || []);
      }

      const pendingRes = await fetch(`${API_BASE}/api/users/techs/pending`);
      const pendingData = await pendingRes.json();
      if (pendingData.success) {
        setTechs(pendingData.technicians || []);
      }

      const toolRes = await fetch(`${API_BASE}/api/tools/orders`);
      const toolData = await toolRes.json();
      if (toolData.success) {
        setToolOrders(toolData.orders || []);
      }
    } catch (err) {
      console.error('Admin Fetch Error:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // REAL-TIME: Listen to Pending Technicians
    const unsubPending = onSnapshot(collection(db, 'pending_technicians'), (snap) => {
      setTechs(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });

    // REAL-TIME: Listen to Bookings (Recent ones)
    const unsubBookings = onSnapshot(query(collection(db, 'bookings'), limit(50)), (snap) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => (b.createdAt || b.created_at || '').localeCompare(a.createdAt || a.created_at || ''));
      setBookings(docs);
    });

    // REAL-TIME: Listen to Transactions
    const unsubTrans = onSnapshot(query(collection(db, 'transactions'), limit(50)), (snap) => {
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => (b.createdAt || b.created_at || '').localeCompare(a.createdAt || a.created_at || ''));
      setTransactions(docs);
    });

    const unsubTools = onSnapshot(collection(db, 'tool_orders'), (snap: any) => {
      const orders = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      orders.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setToolOrders(orders);
    }, (err: any) => console.error('Tools Listener Error:', err));

    const interval = setInterval(fetchData, 60000);

    return () => {
      clearInterval(interval);
      unsubPending();
      unsubBookings();
      unsubTrans();
      unsubTools();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/auth/login');
  };

  const deleteTechnician = async (id: string) => {
    if (!confirm('Are you sure you want to delete this technician permanently?')) return;
    try {
      await axios.delete(`${API_BASE}/api/users/${id}`);
      alert('Technician deleted.');
    } catch (e) {
      alert('Failed to delete.');
    }
  };

  const handleAddTech = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillsArray = newTech.skills.split(',').map(s => s.trim()).filter(s => s);
      await axios.post(`${API_BASE}/api/users/signup`, {
        name: newTech.name,
        email: newTech.email,
        phone: newTech.phone,
        role: 'technician',
        skills: skillsArray,
        category: newTech.category.toLowerCase(),
        approved: true
      });
      alert('Technician created successfully!');
      setShowAddModal(false);
      setNewTech({ name: '', email: '', phone: '', category: 'Plumbing', skills: '' });
    } catch (e) {
      alert('Failed to create technician.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/api/users/techs/verify-action`, { id, action: 'approve' });
      alert('Technician approved successfully!');
    } catch (e) {
      alert('Failed to approve.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please enter a reason for rejection (optional):');
    if (reason === null) return; // User cancelled prompt
    
    try {
      await axios.post(`${API_BASE}/api/users/techs/verify-action`, { id, action: 'decline', reason });
      alert('Application declined.');
    } catch (e) {
      alert('Failed to decline.');
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      await axios.post(`${API_BASE}/api/tools/orders/${orderId}/verify-payment`);
      alert('Payment verified!');
    } catch (e) {
      alert('Failed to verify payment.');
    }
  };

  const updateToolOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const payload: any = { status: newStatus };
      if (newStatus === 'Approved') {
        payload.deliveryTime = deliveryData.time;
        payload.deliveryDay = deliveryData.day;
        if (selectedOrder?.paymentMethod === 'pay_now' && selectedOrder?.paymentStatus !== 'Verified') {
          await axios.post(`${API_BASE}/api/tools/orders/${selectedOrder.id}/verify-payment`);
        }
      }
      await axios.post(`${API_BASE}/api/tools/orders/${orderId}/update`, payload);
      setShowApproveModal(false);
      setSelectedOrder(null);
    } catch (e) {
      alert('Failed to update.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        techsCount={techs.length}
        toolOrdersCount={toolOrders.filter(o => o.status === 'Pending').length}
        handleSignOut={handleSignOut}
      />

      <main className="flex-grow flex flex-col relative w-full min-w-0">
        <Navbar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          fetchData={fetchData}
          setShowAddModal={setShowAddModal}
          techsCount={techs.length}
          toolOrdersCount={toolOrders.filter(o => o.status === 'Pending').length}
          handleSignOut={handleSignOut}
        />

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab 
                allTechs={allTechs}
                bookings={bookings}
                transactions={transactions}
                techs={techs}
                toolOrders={toolOrders}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'live-map' && (
              <LiveMapTab />
            )}

            {activeTab === 'approvals' && (
              <ApprovalsTab 
                techs={techs}
                toolOrders={toolOrders}
                handleApprove={handleApprove}
                handleReject={handleReject}
                updateToolOrderStatus={updateToolOrderStatus}
                handleVerifyPayment={handleVerifyPayment}
                setSelectedOrder={setSelectedOrder}
              />
            )}

            {activeTab === 'techs' && (
              <TechniciansTab 
                allTechs={allTechs}
                setShowAddModal={setShowAddModal}
                deleteTechnician={deleteTechnician}
              />
            )}

            {activeTab === 'bookings' && (
              <BookingsTab bookings={bookings} />
            )}

            {activeTab === 'tools' && (
              <ToolsTab 
                toolOrders={toolOrders}
                updateToolOrderStatus={updateToolOrderStatus}
                handleVerifyPayment={handleVerifyPayment}
                setSelectedOrder={setSelectedOrder}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsTab transactions={transactions} />
            )}

            {activeTab === 'notifications' && (
              <NotificationsTab notificationLogs={notificationLogs} />
            )}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-slate-900 border-white/[0.08] border rounded-[2rem] p-6 sm:p-10 max-w-md w-full shadow-2xl relative my-8">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 bg-white/[0.05] border border-white/[0.08] rounded-full text-slate-400 hover:text-white transition active:scale-95"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-6 sm:mb-8 tracking-tight">NEW TECHNICIAN</h2>
              <form onSubmit={handleAddTech} className="space-y-5 sm:space-y-6">
                <InputField label="Full Name" value={newTech.name} onChange={v => setNewTech({ ...newTech, name: v })} />
                <InputField label="Email Address" type="email" value={newTech.email} onChange={v => setNewTech({ ...newTech, email: v })} />
                <InputField label="Phone Number" value={newTech.phone} onChange={v => setNewTech({ ...newTech, phone: v })} />
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Specialization</label>
                  <select value={newTech.category} onChange={e => setNewTech({ ...newTech, category: e.target.value })} className="w-full bg-slate-950/50 border border-white/[0.08] rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-sm sm:text-base text-white focus:border-white/20 transition outline-none appearance-none cursor-pointer">
                    {[
                      'HVAC / AC Technician', 'Electrician', 'Washing Machine Technician', 
                      'Water Systems Technician', 'Refrigerator Technician', 'Kitchen Services Technician', 
                      'Installation Services Technician', 'Gas & Utilities', 'Carpentry', 
                      'Plumbing', 'Electronics & Smart Home', 'Pest Control', 
                      'Cleaning Services', 'Painter', 'Renovation Service', 
                      'Moving & Misc', 'Bike Mechanics', 'Car Mechanics', 
                      'Rural Area Technicians'
                    ].map(c => <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>)}
                  </select>
                </div>
                <InputField label="Core Skills" placeholder="e.g. Pipe Leak, Wiring" value={newTech.skills} onChange={v => setNewTech({ ...newTech, skills: v })} />
                <button type="submit" className="w-full py-4 sm:py-5 bg-white text-slate-900 text-sm sm:text-base font-black rounded-2xl transition shadow-xl mt-4 hover:bg-slate-100 active:scale-95 uppercase tracking-widest">Create Account</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
