import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, ArrowUpRight, TrendingUp, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSubscriptionPlans, getTechnicianSubscription, SubscriptionPlan, TechnicianSubscription } from '@/server/services/subscriptionService';

export default function SubscriptionPanel({ technicianId }: { technicianId: string }) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<TechnicianSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [p, s] = await Promise.all([
        getSubscriptionPlans(),
        getTechnicianSubscription(technicianId)
      ]);
      setPlans(p);
      setCurrentSub(s);
    } catch (err) {
      console.error("Failed to load subscription data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [technicianId]);

  useEffect(() => {
    fetchData();

    // Auto-sync when window regains focus (e.g., after accepting a booking in another tab)
    const handleFocus = () => fetchData(true);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      if (confirm("Are you sure you want to downgrade to the Free Plan? Downgrades are handled by our support team.")) {
        alert("Please contact support at support@fixnow.app to process your downgrade.");
      }
    } else {
      router.push(`/technician/subscription/payment?planId=${planId}`);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-4 text-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          Synchronizing Live Protocol & Quota Data...
        </p>
      </div>
    );
  }

  // Exact calculations from database values
  const effectiveLimit = currentSub?.bookingLimit && currentSub.bookingLimit > 0
    ? currentSub.bookingLimit
    : (currentSub?.planId === 'pro' ? 22 : currentSub?.planId === 'elite' ? 9999 : 3);
  
  const usedBookings = currentSub?.bookingsUsed ?? 0;
  const isUnlimited = effectiveLimit > 9000;
  
  const remainingBookings = isUnlimited
    ? 9999
    : (typeof currentSub?.remainingBookings === 'number'
        ? currentSub.remainingBookings
        : Math.max(0, effectiveLimit - usedBookings));

  const isExpired = currentSub?.paymentStatus === 'expired';
  const usagePercent = isUnlimited ? 0 : Math.min(100, Math.round((usedBookings / effectiveLimit) * 100));

  return (
    <div className="space-y-8">
      {/* Current Plan Banner */}
      {currentSub && (
        <div className="bg-slate-950/60 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
          
          {/* Plan Info */}
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shrink-0">
              <Crown className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Current Protocol
                </span>
                {isExpired ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Expired
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                {currentSub.planName || 'Free Plan'}
              </h2>
              <div className="flex items-center gap-4 mt-1.5 text-xs font-bold text-slate-400">
                <span className="text-cyan-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  AI Boost: x{currentSub.priorityMultiplier || 1.0}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">
                  Renews: {currentSub.expiresAt ? new Date(currentSub.expiresAt).toLocaleDateString() : 'Monthly'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Live Quota & Remaining Counter */}
          <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-white/10 min-w-[300px] shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Live Quota Status
                </span>
              </div>
              <button 
                onClick={() => fetchData()}
                disabled={refreshing}
                title="Refresh booking counts from database"
                className="text-slate-400 hover:text-cyan-400 transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            {/* Exact Remaining Bookings Highlight */}
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-3xl font-black text-white tracking-tight">
                  {isUnlimited ? '∞' : remainingBookings}
                </span>
                <span className="text-sm font-bold text-cyan-400 ml-2">
                  {isUnlimited ? 'Unlimited Bookings' : remainingBookings === 1 ? 'Booking Remaining' : 'Bookings Remaining'}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {usedBookings} of {isUnlimited ? '∞' : effectiveLimit} used
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-[1px] border border-white/5 mb-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${isUnlimited ? 100 : Math.max(5, 100 - usagePercent)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full transition-all duration-500 ${
                  isUnlimited 
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                    : remainingBookings === 0
                      ? 'bg-rose-500'
                      : remainingBookings === 1
                        ? 'bg-gradient-to-r from-amber-400 to-rose-400'
                        : 'bg-gradient-to-r from-cyan-400 to-indigo-500'
                }`}
              />
            </div>

            {/* Quota context notes */}
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
              {isUnlimited ? (
                <span className="text-emerald-400">Unlimited incoming bookings unlocked</span>
              ) : remainingBookings === 0 ? (
                <span className="text-rose-400 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3 h-3" /> Monthly quota exhausted. Upgrade for more.
                </span>
              ) : (
                <span className="text-slate-400">
                  {remainingBookings} direct/broadcast orders left before renewal
                </span>
              )}
              <span className="text-slate-500">
                {isUnlimited ? 'Elite Tier' : `${Math.max(0, 100 - usagePercent)}% left`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentSub?.planId === plan.id;
          const isPremium = plan.price > 1000;
          const planLimit = plan.bookingLimit || (plan.id === 'pro' ? 22 : plan.id === 'elite' ? 9999 : 3);
          const planIsUnlimited = planLimit > 9000;
          
          return (
            <motion.div 
              key={plan.id}
              whileHover={{ y: -5 }}
              className={`relative backdrop-blur-2xl border rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between transition-all duration-500 ${
                isCurrent 
                  ? 'bg-indigo-950/30 border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500/30' 
                  : isPremium 
                    ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_10px_50px_rgba(16,185,129,0.1)] hover:border-emerald-500/60 hover:shadow-[0_15px_60px_rgba(16,185,129,0.2)]' 
                    : 'bg-slate-900/40 border-white/5 hover:border-white/20 shadow-2xl hover:shadow-[0_15px_40px_rgba(255,255,255,0.05)]'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isExpired ? 'Plan Expired' : 'Active Plan'}
                </div>
              )}
              
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₹{plan.price}</span>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/mo</span>
                  </div>

                  {/* Highlight quota for this plan */}
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold">
                    <span className="text-cyan-400 font-black">
                      {planIsUnlimited ? 'Unlimited' : `${planLimit} Bookings`}
                    </span>
                    <span className="text-slate-400 font-normal">per monthly cycle</span>
                  </div>
                </div>

                {/* If this is the active plan, show the exact live remaining count */}
                {isCurrent && (
                  <div className="mb-6 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-bold">Your Status:</span>
                      <span className="text-cyan-400 font-black">
                        {isUnlimited ? 'Unlimited Available' : `${remainingBookings} / ${effectiveLimit} Remaining`}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        {usedBookings} {usedBookings === 1 ? 'booking' : 'bookings'} completed this cycle
                      </p>
                    )}
                  </div>
                )}
                
                <ul className="space-y-3.5 mb-8">
                  {/* Canonical booking quota description */}
                  <li className="flex items-start gap-3 text-sm text-slate-100 font-medium">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {planIsUnlimited 
                        ? 'Unlimited direct & broadcast customer bookings'
                        : `${planLimit} confirmed customer bookings / month`}
                    </span>
                  </li>

                  {plan.features.filter(f => !f.toLowerCase().includes('referral')).map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-3 text-sm text-slate-200">
                    <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>AI Visibility Boost: x{plan.priorityMultiplier}</span>
                  </li>
                </ul>
              </div>
              
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent && !isExpired}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
                  isCurrent && !isExpired
                    ? 'bg-slate-800/50 text-slate-400 cursor-not-allowed border border-white/5'
                    : isCurrent && isExpired
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:scale-[1.02]'
                      : isPremium
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_10px_40px_rgba(16,185,129,0.4)] hover:scale-[1.02]'
                        : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:scale-[1.02]'
                }`}
              >
                {isCurrent && !isExpired ? 'Current Plan' : isCurrent && isExpired ? 'Renew Plan' : 'Select Plan'}
                {(!isCurrent || isExpired) && <ArrowUpRight className="w-4 h-4" />}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
