'use client';

import React, { useState, useId, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Wrench, Mail, Shield, Phone, Lock, ChevronRight, Eye, EyeOff, Sparkles, ArrowLeft, CheckCircle2, ChevronDown, Terminal, Cpu } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
import { Logo } from '@/components/ui/Logo';
import { BackgroundParticles, FloatingOrbs } from '@/components/ui/BackgroundParticles';
import { API_BASE } from '@/lib/config';
import { ALL_SERVICES } from '@/lib/services';
import IdVerificationBox from "@/components/technician/IdVerificationBox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = useId();
  const [mounted, setMounted] = useState(false);
  const initialRole = searchParams.get('role') as 'customer' | 'technician' | 'admin' | null;
  
  const [role, setRole] = useState<'customer' | 'technician' | 'admin' | null>(initialRole);
  const [method, setMethod] = useState<'email' | 'google' | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', passwordHint: '', skills: '', category: '', govIdUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isGoogleLinked) {
        setFormData(prev => ({
          ...prev,
          name: user.displayName || '',
          email: user.email || '',
          password: 'GoogleUser123!',
        }));
        setIsGoogleLinked(true);
        setMethod('email');
      }
    });
    return () => { unsubscribe(); };
  }, [isGoogleLinked]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError('Please select a role before signing up.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      let user: any = null;
      let finalUid = '';

      if (role !== 'technician' && !isGoogleLinked) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;
        finalUid = user.uid;
      } else if (isGoogleLinked) {
        user = auth.currentUser;
        if (user) finalUid = user.uid;
      }

      const payload: any = {
        id: finalUid,
        name: formData.name || user?.displayName || '',
        email: formData.email || user?.email || '',
        phone: formData.phone || '',
        password: formData.password,
        role: role,
        passwordHint: formData.passwordHint || '',
      };

      if (role === 'technician') {
        payload.skills = formData.skills;
        payload.category = formData.category;
        payload.govIdUrl = formData.govIdUrl;
        payload.approved = false;
      }

      const res = await fetch(`${API_BASE}/api/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Database registration failed');

      if (role === 'technician') {
        await signOut(auth);
        router.push('/auth/login?status=pending');
      } else {
        router.push(`/${role}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.message !== 'popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = {
    customer: { icon: <User className="w-5 h-5" />, label: 'Customer', desc: 'Book home services instantly', accent: 'from-slate-700 to-slate-900' },
    technician: { icon: <Wrench className="w-5 h-5" />, label: 'Technician', desc: 'Join our professional network', accent: 'from-slate-800 to-slate-950' },
    admin: { icon: <Shield className="w-5 h-5" />, label: 'Administrator', desc: 'System management & control', accent: 'from-amber-500 to-orange-600' },
  };

  if (!mounted) return null;

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden transition-colors duration-700",
      role === 'admin' ? "bg-white" : "bg-slate-950"
    )}>
      <BackgroundParticles />
      <FloatingOrbs />

      {/* Admin Quick Access */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={() => setRole(role === 'admin' ? null : 'admin')}
          className={cn(
            "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all group backdrop-blur-md shadow-2xl",
            role === 'admin' 
              ? "bg-slate-950/5 border-slate-950/10 text-slate-950 hover:bg-slate-950/10" 
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          )}
        >
          <div className={cn(
            "size-2 rounded-full animate-pulse shadow-lg",
            role === 'admin' ? "bg-cyan-500" : "bg-amber-500"
          )} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {role === 'admin' ? 'Exit Admin Terminal' : 'Admin Terminal Access'}
          </span>
          {role === 'admin' ? <Cpu className="size-4" /> : <Shield className="size-4 text-amber-500" />}
        </button>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-[440px] w-full relative z-10"
      >
        <AnimatePresence mode="wait">
          {role === 'admin' ? (
            /* ─────────────────── ADMIN SIGNUP CARD (LIGHT THEME) ─────────────────── */
            <motion.div
              key="admin-signup"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white/70 backdrop-blur-[40px] border border-slate-950/10 rounded-[3rem] p-12 shadow-2xl overflow-hidden"
            >
              <div className="text-center mb-10">
                <Logo isAdmin={true} showText isLanding={true} textClassName="text-slate-950" className="justify-center mb-8" />
                <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic leading-none mb-4">
                  Registry <br/> <span className="text-amber-600">Expansion.</span>
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Administrator Onboarding Protocol</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</Label>
                  <Input required placeholder="System Operator" className="bg-slate-950/5 border-slate-950/10 rounded-2xl h-14 px-6 text-slate-950 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Authorized Email</Label>
                  <Input required type="email" placeholder="root@fixnow.app" className="bg-slate-950/5 border-slate-950/10 rounded-2xl h-14 px-6 text-slate-950 font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Secure Passkey</Label>
                  <Input required type="password" placeholder="••••••••" className="bg-slate-950/5 border-slate-950/10 rounded-2xl h-14 px-6 text-slate-950 font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-16 bg-slate-950 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 mt-6">
                  {loading ? 'Processing...' : 'Initialize Node'}
                </Button>
              </form>
            </motion.div>
          ) : (
            /* ─────────────────── STANDARD SIGNUP CARD (DARK THEME) ─────────────────── */
            <motion.div
              key="standard-signup"
              className="relative w-full rounded-[3rem] overflow-hidden bg-slate-900/35 backdrop-blur-[40px] border border-white/20 p-10 shadow-2xl"
            >
              <div className="text-center mb-8">
                <Logo isAdmin={false} showText className="justify-center mb-8" />
                
                {role && (
                  <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl mb-8 max-w-[280px] mx-auto">
                    <button onClick={() => setRole('customer')} className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", role === 'customer' ? "bg-white text-slate-950 shadow-lg" : "text-slate-500 hover:text-white")}>Customer</button>
                    <button onClick={() => setRole('technician')} className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", role === 'technician' ? "bg-white text-slate-950 shadow-lg" : "text-slate-500 hover:text-white")}>Technician</button>
                  </div>
                )}
                
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                  {role ? 'Create Node' : 'Registry Request'}
                </h1>
              </div>

              <AnimatePresence mode="wait">
                {!role ? (
                  <motion.div key="roles" className="space-y-4">
                    {(['customer', 'technician'] as const).map(r => (
                      <button key={r} onClick={() => setRole(r)} className="w-full flex items-center p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition group">
                        <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mr-4 group-hover:scale-110 transition">{roleConfig[r].icon}</div>
                        <div className="text-left">
                          <p className="font-black text-white uppercase tracking-widest text-sm">{roleConfig[r].label}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">{roleConfig[r].desc}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="form" className="space-y-6">
                    {!isGoogleLinked && (
                      <button onClick={handleGoogleClick} className="w-full h-14 bg-white rounded-2xl flex items-center justify-center gap-4 text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition shadow-xl">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="size-5" />
                        Signup with Google
                      </button>
                    )}
                    
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                      <div className="relative flex justify-center"><span className="bg-[#0f172a] px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Protocol Matrix</span></div>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                      <Input required placeholder="Full Name" className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      <Input required type="email" placeholder="Email Address" className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      <Input required type="password" placeholder="Passkey" className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-white" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                      <Button type="submit" disabled={loading} className="w-full h-16 bg-white text-slate-950 font-black uppercase rounded-2xl mt-4">
                        {loading ? 'Syncing...' : 'Initialize'}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
