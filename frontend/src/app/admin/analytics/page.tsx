"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Sidebar from '@/components/admin/dashboard/Sidebar';
import Navbar from '@/components/admin/dashboard/Navbar';
import RevenueTab from '@/components/admin/dashboard/tabs/RevenueTab';
import { Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/auth/login?role=admin');
      } else {
        // Assume verified for now in MVP
        setIsAdmin(true);
      }
    });
    return () => unsub();
  }, [router]);

  if (isAdmin === null) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Activity className="w-12 h-12 text-indigo-500 animate-pulse" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#050B14] flex font-sans">
      <Sidebar activeTab="analytics" setActiveTab={() => {}} />

      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        <Navbar />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-transparent pointer-events-none" />
          
          <div className="mb-10 relative z-10">
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">AI & Revenue Analytics</h1>
            <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-sm">Platform Financials and XGBoost Diagnostics</p>
          </div>

          <div className="relative z-10">
            <RevenueTab />
          </div>
        </div>
      </main>
    </div>
  );
}
