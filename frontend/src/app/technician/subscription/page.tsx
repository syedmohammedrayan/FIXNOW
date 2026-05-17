"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import TechnicianSidebar from '@/components/technician/Sidebar';
import SubscriptionPanel from '@/components/technician/SubscriptionPanel';
import { Activity } from 'lucide-react';
import { useTechnicianData } from '@/app/technician/dashboard/hooks/useTechnicianData';

export default function SubscriptionPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  
  // We reuse profile hook just to pass to sidebar, we don't strictly need all of it here
  const { profile } = useTechnicianData();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/auth/login?role=technician');
      else setUserId(u.uid);
    });
    return () => unsub();
  }, [router]);

  if (!userId) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Activity className="w-12 h-12 text-cyan-500 animate-pulse" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="fixed top-0 right-0 w-[50vw] h-[50vw] bg-indigo-500/[0.03] blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[40vw] h-[40vw] bg-cyan-500/[0.03] blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Reusing existing sidebar */}
      <TechnicianSidebar profile={profile} onOpenChange={() => {}} />

      <main className="pl-0 md:pl-[78px] lg:pl-[280px] pt-20 md:pt-0 min-h-screen relative z-10 transition-all duration-700">
        <div className="p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto overflow-x-hidden">
          
          <div className="mb-10">
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Premium Subscriptions</h1>
            <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-sm">Upgrade your workforce intelligence protocol</p>
          </div>

          <SubscriptionPanel technicianId={userId} />

        </div>
      </main>
    </div>
  );
}
