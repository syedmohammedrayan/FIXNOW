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
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '',
    password: '', 
    passwordHint: '', 
    skills: '', 
    category: '', 
    govIdUrl: '' 
  });
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
        address: formData.address || '',
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
              className="bg-white/80 backdrop-blur-[60px] border border-white/60 rounded-[3.5rem] p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden group/card"
            >
              {/* Premium Glint Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
              
              <div className="text-center mb-12 relative z-10">
                <Logo isAdmin={true} showText isLanding={true} textClassName="text-slate-950" className="justify-center mb-10 group-hover/card:scale-105 transition-transform duration-700" />
                <h1 className="text-5xl font-black text-slate-950 tracking-[-0.06em] uppercase italic leading-[0.85] mb-6">
                  Registry <br/> 
                  <span className="relative inline-block text-transparent bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 bg-clip-text bg-[length:200%_auto] animate-gradient-text">
                    Expansion.
                  </span>
                </h1>
                <div className="flex items-center justify-center gap-3 py-2 px-6 bg-slate-950/5 border border-slate-950/10 rounded-full w-fit mx-auto backdrop-blur-xl">
                  <Terminal className="size-4 text-slate-950" />
                  <p className="text-slate-950 font-black uppercase tracking-[0.3em] text-[9px]">Node Allocation Protocol</p>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-6 relative z-10">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-5">Operator Name</Label>
                  <Input required placeholder="System Admin 01" className="bg-white/40 border-slate-950/5 rounded-3xl h-16 px-6 text-slate-950 font-black text-sm focus:border-slate-950/20 transition-all placeholder:text-slate-400 shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-5">Primary Terminal Email</Label>
                  <Input required type="email" placeholder="root@fixnow.app" className="bg-white/40 border-slate-950/5 rounded-3xl h-16 px-6 text-slate-950 font-black text-sm focus:border-slate-950/20 transition-all placeholder:text-slate-400 shadow-inner" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-5">Master Passkey</Label>
                  <Input required type="password" placeholder="••••••••" className="bg-white/40 border-slate-950/5 rounded-3xl h-16 px-6 text-slate-950 font-black text-sm focus:border-slate-950/20 transition-all placeholder:text-slate-400 shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-16 bg-slate-950 text-white font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-900 mt-8 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)]">
                  {loading ? 'Initializing...' : 'Authorize Expansion'}
                </Button>
              </form>

              <div className="mt-10 pt-6 border-t border-slate-950/5 text-center">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Already have access? <br/>
                  <Link href="/auth/login?role=admin" className="text-amber-600 hover:text-amber-700 transition underline underline-offset-4 mt-2 inline-block">
                    Return to Terminal
                  </Link>
                </p>
              </div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input required placeholder="Full Name" className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-white placeholder:text-slate-500 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <Input required type="email" placeholder="Email Address" className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-white placeholder:text-slate-500 font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input required type="tel" placeholder="Phone (e.g. +91 98XXX)" className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-white placeholder:text-slate-500 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        <Input required placeholder="Service Address / City" className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-white placeholder:text-slate-500 font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                      </div>

                      <div className="relative">
                        <Input 
                          required 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Create Passkey" 
                          className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-white placeholder:text-slate-500 font-bold pr-14" 
                          value={formData.password} 
                          onChange={e => setFormData({...formData, password: e.target.value})} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>

                      <Input 
                        placeholder="Password Reset Hint (e.g. Favorite Color)" 
                        className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-white placeholder:text-slate-500 font-bold" 
                        value={formData.passwordHint} 
                        onChange={e => setFormData({...formData, passwordHint: e.target.value})} 
                      />

                      {role === 'technician' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4 pt-2"
                        >
                          <div className="relative">
                            <select 
                              required
                              value={formData.category}
                              onChange={e => setFormData({...formData, category: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 h-14 rounded-2xl px-6 text-white font-bold appearance-none outline-none focus:border-white/30 transition-all"
                            >
                              <option value="" disabled className="bg-slate-900">Select Professional Specialization</option>
                              {ALL_SERVICES.map(s => (
                                <option key={s} value={s} className="bg-slate-900">{s}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 size-5 text-slate-500 pointer-events-none" />
                          </div>

                          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                              <Shield className="size-5 text-cyan-500" />
                              <p className="text-[10px] font-black text-white uppercase tracking-widest">Identify Verification (Aadhar/PAN)</p>
                            </div>
                            <IdVerificationBox 
                              userId={auth.currentUser?.uid || "temp"} 
                              onSuccess={(url) => setFormData({...formData, govIdUrl: url})}
                              existingIdUrl={formData.govIdUrl}
                            />
                          </div>
                        </motion.div>
                      )}

                      <Button type="submit" disabled={loading} className="w-full h-16 bg-white text-slate-950 font-black uppercase tracking-widest rounded-2xl mt-4 hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-95">
                        {loading ? 'Synchronizing Node...' : 'Initialize Profile'}
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
