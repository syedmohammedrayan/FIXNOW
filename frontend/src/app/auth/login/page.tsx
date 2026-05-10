'use client';

import React, { useState, useId, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Shield, Lock, Eye, EyeOff, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();
import { Logo } from '@/components/ui/Logo';
import { BackgroundParticles, FloatingOrbs } from '@/components/ui/BackgroundParticles';
import { API_BASE } from '@/lib/config';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const router = useRouter();
  const id = useId();
  const [mounted, setMounted] = useState(false);
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialRole = searchParams?.get('role') as 'customer' | 'technician' | 'admin' | null;

  const [role, setRole] = useState<'customer' | 'technician' | 'admin'>(initialRole || 'customer');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [view, setView] = useState<'login' | 'reset'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetHint, setResetHint] = useState('');
  const [resetStep, setResetStep] = useState<'hint' | 'password'>('hint');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user && mounted) {
        try {
          if (loading) return;
          setLoading(true);
          const profileRes = await fetch(`${API_BASE}/api/users/${user.uid}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.success && profileData.user) {
              const dbRole = profileData.user.role;
              if (dbRole === 'technician') {
                if (!profileData.user.approved) throw new Error('ID verification in progress.');
                router.replace('/technician/dashboard');
              } else if (dbRole === 'admin') {
                router.replace('/admin/dashboard');
              } else {
                router.replace('/customer/dashboard');
              }
              return;
            }
          }
          router.replace(`/auth/signup?role=${role}`);
        } catch (err: any) {
          setError(err.message || 'Error processing authentication.');
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [router, mounted]);

  useEffect(() => {
    if (initialRole && (initialRole === 'customer' || initialRole === 'technician' || initialRole === 'admin')) {
      setRole(initialRole);
    }
  }, [initialRole]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError('Google authentication failed.');
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundParticles />
      <FloatingOrbs />
      
      <div className="relative z-10 w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-500/10 blur-3xl rounded-full -ml-16 -mb-16" />

          <div className="text-center mb-10">
            <Link href="/" className="inline-block mb-8 hover:scale-105 transition-transform">
              <Logo isAdmin={role === 'admin'} showText />
            </Link>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-4">
              Authorized <br/> <span className="text-white [text-shadow:0_0_30px_rgba(255,255,255,0.3)]">Access.</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Secure Terminal for {role} node
            </p>
          </div>

          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {error && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold">
                    <AlertCircle className="size-5 shrink-0" /> {error}
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Registry Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-cyan-400 transition" />
                      <Input 
                        type="email" 
                        placeholder="operator@fixnow.app" 
                        className="bg-white/5 border-white/10 rounded-2xl h-14 pl-14 text-white font-bold focus:border-cyan-500/30 transition-all placeholder:text-slate-600"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Passkey</Label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-cyan-400 transition" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="bg-white/5 border-white/10 rounded-2xl h-14 pl-14 pr-14 text-white font-bold focus:border-cyan-500/30 transition-all placeholder:text-slate-600"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2 pt-2">
                    <div className="flex items-center gap-3">
                      <Checkbox id="remember" className="rounded-md border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                      <Label htmlFor="remember" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition">Persistent Session</Label>
                    </div>
                    <button type="button" onClick={() => setView('reset')} className="text-[11px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition underline underline-offset-4">Lost Passkey?</button>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-14 bg-white text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98] mt-4 shadow-xl">
                    {loading ? <Loader2 className="size-5 animate-spin" /> : <>Initialize Session <ArrowRight className="size-5 ml-2" /></>}
                  </Button>
                </form>

                <div className="relative py-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative flex justify-center"><span className="bg-[#0f172a] px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Alternate Channel</span></div>
                </div>

                <Button 
                  onClick={handleGoogleLogin} 
                  variant="outline" 
                  className="w-full h-14 bg-white border-white/10 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-4 shadow-xl"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="size-5" alt="Google" />
                  Login with Google
                </Button>

                <p className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-8 leading-relaxed">
                  First deployment? <Link href={`/auth/signup?role=${role}`} className="text-cyan-400 hover:text-cyan-300 transition underline underline-offset-4 font-black">Register Node</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Reset Terminal Passkey</h3>
                <Input type="email" placeholder="Registry Email" className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 text-white" />
                <Button onClick={() => setView('login')} className="w-full h-14 bg-white text-slate-950 font-black uppercase rounded-2xl">Return to Terminal</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
