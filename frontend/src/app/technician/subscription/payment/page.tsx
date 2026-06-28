"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, CheckCircle2, ArrowLeft, QrCode } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getSubscriptionPlans, createSubscriptionOrder, verifySubscriptionPayment, SubscriptionPlan } from '@/server/services/subscriptionService';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/auth/login?role=technician');
      else setUserId(u.uid);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!planId) {
      router.push('/technician/subscription');
      return;
    }

    const fetchPlan = async () => {
      const plans = await getSubscriptionPlans();
      const selectedPlan = plans.find(p => p.id === planId);
      if (selectedPlan) {
        setPlan(selectedPlan);
      } else {
        router.push('/technician/subscription');
      }
      setLoading(false);
    };

    fetchPlan();
  }, [planId, router]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleConfirmPayment = async () => {
    if (!userId || !plan) return;
    
    setProcessing(true);
    
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Failed to load Razorpay SDK");
      }

      // 1. Create Order
      const order = await createSubscriptionOrder(userId, plan.id);
      if (!order || !order.success) {
        throw new Error(order?.error || "Failed to create order");
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: order.keyId,
        amount: order.amount.toString(),
        currency: order.currency,
        name: "FixNow Subscriptions",
        description: `Upgrade to ${plan.name}`,
        image: "https://fixnow.app/logo.png",
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const newSub = await verifySubscriptionPayment(userId, plan.id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (newSub) {
              setProcessing(false);
              setSuccess(true);
              setTimeout(() => {
                router.push('/technician/subscription');
              }, 3000);
            } else {
              setProcessing(false);
              alert("Payment verification failed. Please try again.");
            }
          } catch (err: any) {
            setProcessing(false);
            alert("Verification Error: " + err.message);
          }
        },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setProcessing(false);
        alert(response.error.description || "Payment failed");
      });
      
      rzp.open();
    } catch (error: any) {
      setProcessing(false);
      alert(error.message || "Something went wrong.");
    }
  };

  if (!userId || loading || !plan) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Activity className="w-12 h-12 text-cyan-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Atmosphere */}
      <div className="fixed top-0 right-0 w-[50vw] h-[50vw] bg-indigo-500/[0.05] blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[40vw] h-[40vw] bg-cyan-500/[0.05] blur-[120px] rounded-full pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <button 
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Plans
        </button>

        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
          
          <div className="relative z-10">
            {success ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tight mb-2">Protocol Upgraded</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Welcome to the {plan.name}.</p>
                <p className="text-slate-500 mt-4 text-xs">Redirecting to your dashboard...</p>
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-10">
                  <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Checkout</h1>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure Encryption Active
                  </p>
                </div>

                <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5 mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Selected Plan</p>
                    <h3 className="text-xl font-black text-white uppercase italic">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-2xl font-black text-emerald-400">₹{plan.price}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center mb-10">
                  <div className="w-48 h-48 bg-white rounded-2xl p-4 shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none flex items-center justify-center">
                      <div className="w-full h-1 bg-cyan-400 absolute top-0 shadow-[0_0_15px_rgba(34,211,238,1)] animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                    {/* Mock QR Code Pattern using CSS for a techy look */}
                    <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-1">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`bg-slate-950 ${Math.random() > 0.3 ? 'opacity-100' : 'opacity-20'} rounded-sm`} />
                      ))}
                    </div>
                    <div className="absolute bg-white p-2 rounded-lg shadow-xl">
                      <QrCode className="w-8 h-8 text-slate-950" />
                    </div>
                  </div>
                  <p className="mt-4 text-slate-400 text-sm font-bold tracking-widest uppercase">Scan via any UPI App</p>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={processing}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                    processing 
                      ? 'bg-indigo-500/50 text-white/70 cursor-wait shadow-inner'
                      : 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_10px_40px_rgba(99,102,241,0.5)] hover:scale-[1.02]'
                  }`}
                >
                  {processing ? (
                    <>
                      <Activity className="w-5 h-5 animate-pulse" />
                      Authenticating Payment...
                    </>
                  ) : (
                    <>
                      Confirm Payment
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Activity className="w-12 h-12 text-cyan-500 animate-pulse" /></div>}>
      <PaymentContent />
    </Suspense>
  );
}
