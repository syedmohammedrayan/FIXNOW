import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, Zap, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans, getTechnicianSubscription, upgradeSubscription, SubscriptionPlan, TechnicianSubscription } from '@/server/services/subscriptionService';

export default function SubscriptionPanel({ technicianId }: { technicianId: string }) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<TechnicianSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const p = await getSubscriptionPlans();
      const s = await getTechnicianSubscription(technicianId);
      setPlans(p);
      setCurrentSub(s);
      setLoading(false);
    };
    fetchData();
  }, [technicianId]);

  const router = useRouter();

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      if (confirm("Are you sure you want to downgrade to the Free Plan?")) {
        setLoading(true);
        const newSub = await upgradeSubscription(technicianId, planId);
        if (newSub) setCurrentSub(newSub);
        setLoading(false);
        alert("Downgraded to Free Plan.");
      }
    } else {
      router.push(`/technician/subscription/payment?planId=${planId}`);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Loading Subscription Data...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Banner */}
      {currentSub && (
        <div className="bg-slate-950/40 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Crown className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Current Protocol</p>
              <h2 className="text-3xl font-black text-white uppercase italic">{currentSub.planName}</h2>
              <p className="text-sm text-emerald-400 font-bold mt-1">
                AI Boost: x{currentSub.priorityMultiplier}
              </p>
            </div>
          </div>
          
          <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-white/10 min-w-[250px] shadow-inner">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Allocation</span>
              <span className="text-white font-black text-sm">{currentSub.bookingsUsed} / {currentSub.bookingLimit > 9000 ? '∞' : currentSub.bookingLimit}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400" 
                style={{ width: `${Math.min(100, (currentSub.bookingsUsed / currentSub.bookingLimit) * 100)}%` }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentSub?.planId === plan.id;
          const isPremium = plan.price > 1000;
          
          return (
            <motion.div 
              key={plan.id}
              whileHover={{ y: -5 }}
              className={`relative backdrop-blur-2xl border rounded-[2rem] p-6 sm:p-8 flex flex-col transition-all duration-500 ${
                isCurrent 
                  ? 'bg-indigo-950/20 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.15)]' 
                  : isPremium 
                    ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_10px_50px_rgba(16,185,129,0.1)] hover:border-emerald-500/60 hover:shadow-[0_15px_60px_rgba(16,185,129,0.2)]' 
                    : 'bg-slate-900/40 border-white/5 hover:border-white/20 shadow-2xl hover:shadow-[0_15px_40px_rgba(255,255,255,0.05)]'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                  Active
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹{plan.price}</span>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/mo</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
                <li className="flex items-start gap-3 text-sm text-slate-200">
                  <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>AI Visibility: x{plan.priorityMultiplier}</span>
                </li>
              </ul>
              
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
                  isCurrent 
                    ? 'bg-slate-800/50 text-slate-400 cursor-not-allowed border border-white/5'
                    : isPremium
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_10px_40px_rgba(16,185,129,0.4)] hover:scale-[1.02]'
                      : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:scale-[1.02]'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Select Plan'}
                {!isCurrent && <ArrowUpRight className="w-4 h-4" />}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
