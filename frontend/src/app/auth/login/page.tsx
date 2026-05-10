'use client';

import React, { useState, useId, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Shield, Lock, Eye, EyeOff, Sparkles, AlertCircle, Loader2, Cpu, Terminal, ArrowLeft } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (!user) return;
      try {
        setLoading(true);
        setError('');
        const profileRes = await fetch(`${API_BASE}/api/users/${user.uid}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.success && profileData.user) {
            const dbRole = profileData.user.role;
            if (dbRole === 'technician') {
              if (!profileData.user.approved) {
                setError('Your account is pending admin approval. Please wait.');
                setLoading(false);
                return;
              }
              router.replace('/technician/dashboard');
            } else if (dbRole === 'admin') {
              router.replace('/admin/dashboard');
            } else {
              router.replace('/customer/dashboard');
            }
            return;
          }
        }
        // User is authenticated but has no DB profile — redirect to signup
        router.replace(`/auth/signup?role=${role}`);
      } catch (err: any) {
        setError(err.message || 'Error processing authentication.');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, role]);

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

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
      <BackgroundParticles />
      <div className="size-14 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
      <p className="text-white font-black uppercase tracking-[0.2em] text-sm animate-pulse">Signing you in...</p>
    </div>
  );

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-700",
      role === 'admin' ? "bg-white" : "bg-slate-950"
    )}>
      <BackgroundParticles />
      <FloatingOrbs />

      {/* Admin Quick Access */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={() => setRole(role === 'admin' ? 'customer' : 'admin')}
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
      
      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          {role === 'admin' ? (
            /* ─────────────────── ADMIN LOGIN CARD (LIGHT THEME) ─────────────────── */
            <motion.div
              key="admin-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="backdrop-blur-[60px] border border-white/30 rounded-[3.5rem] p-12 relative overflow-hidden group/card bg-white/5"
              style={{
                boxShadow: 'inset 0 0 80px rgba(255,255,255,0.05), 0 40px 100px -20px rgba(0,0,0,0.5)'
              }}
            >
              {/* Back Arrow */}
              <button onClick={() => setRole('customer')} className="absolute top-8 left-8 z-20 text-white/50 hover:text-white transition-colors group/back flex items-center justify-center p-2 rounded-full hover:bg-white/10">
                <ArrowLeft className="size-5 group-hover/back:-translate-x-1 transition-transform" />
              </button>

              {/* Premium Glint Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 blur-[100px] -mr-30 -mt-30" />
              
              <div className="text-center mb-12 relative z-10">
                <Logo isAdmin={true} showText isLanding={true} textClassName="text-white" className="mb-10 justify-center group-hover/card:scale-105 transition-transform duration-700" />
                <h1 className="text-6xl font-black text-white tracking-[-0.06em] uppercase italic leading-[0.8] mb-6 drop-shadow-2xl">
                  Admin <br/> 
                  <span className="relative inline-block text-transparent bg-gradient-to-r from-amber-400 via-white to-amber-400 bg-clip-text bg-[length:200%_auto] animate-gradient-text">
                    Terminal
                  </span>
                </h1>
                <div className="flex items-center justify-center gap-3 py-2 px-6 bg-white/5 border border-white/10 rounded-full w-fit mx-auto backdrop-blur-xl">
                  <Terminal className="size-4 text-white" />
                  <p className="text-white font-black uppercase tracking-[0.3em] text-[9px]">Node Authorization Required</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-7 relative z-10">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-5">Security Identifier</Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within/input:text-white transition-colors" />
                    <Input 
                      type="email" 
                      placeholder="admin.root@fixnow.app" 
                      className="bg-white/10 border-white/20 rounded-3xl h-16 pl-16 text-white font-black text-sm focus:border-white/40 transition-all placeholder:text-slate-500 shadow-inner"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-5">Encrypted Passkey</Label>
                  <div className="relative group/input">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within/input:text-white transition-colors" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="bg-white/10 border-white/20 rounded-3xl h-16 pl-16 pr-16 text-white font-black text-sm focus:border-white/40 transition-all placeholder:text-slate-500 shadow-inner"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-16 bg-white text-slate-950 font-black text-sm uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-100 transition-all active:scale-[0.98] mt-8 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  {loading ? <Loader2 className="size-6 animate-spin" /> : <>Access System <ArrowRight className="size-5 ml-2" /></>}
                </Button>
              </form>

              <div className="mt-14 pt-10 border-t border-white/10 text-center space-y-8 relative z-10">
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                  Need administrative credentials? <br/>
                  <Link href="/auth/signup?role=admin" className="text-white hover:text-amber-400 transition-colors underline underline-offset-4 mt-2 inline-block">
                    Register Admin Node
                  </Link>
                </p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-relaxed opacity-60">
                  Notice: This terminal is monitored. <br/> unauthorized access attempts will be logged.
                </p>
              </div>
            </motion.div>
          ) : (
            /* ─────────────────── STANDARD LOGIN CARD (GLASS THEME) ─────────────────── */
            <motion.div
              key="standard-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="backdrop-blur-[60px] border border-white/30 rounded-[3.5rem] p-12 relative overflow-hidden group/card bg-white/5"
              style={{ boxShadow: 'inset 0 0 80px rgba(255,255,255,0.05), 0 40px 100px -20px rgba(0,0,0,0.5)' }}
            >
              {/* Back Arrow */}
              <button 
                onClick={() => {
                  if (view === 'reset') setView('login');
                  else router.back();
                }} 
                className="absolute top-8 left-8 z-20 text-white/50 hover:text-white transition-colors group/back flex items-center justify-center p-2 rounded-full hover:bg-white/10"
              >
                <ArrowLeft className="size-5 group-hover/back:-translate-x-1 transition-transform" />
              </button>

              {/* Glass glint layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-60 h-60 bg-cyan-500/10 blur-[100px] -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-violet-500/10 blur-[100px] -ml-20 -mb-20 pointer-events-none" />

              <div className="text-center mb-10 relative z-10">
                <Link href="/" className="inline-block mb-8 hover:scale-105 transition-transform">
                  <Logo isAdmin={false} showText />
                </Link>
                <h1 className="text-5xl font-black text-white tracking-[-0.06em] uppercase italic leading-[0.85] mb-6 drop-shadow-2xl">
                  Welcome <br/>
                  <span className="text-transparent bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-clip-text bg-[length:200%_auto] animate-gradient-text">
                    Back.
                  </span>
                </h1>

                {/* Role Switcher */}
                <div className="flex p-1 bg-white/10 border border-white/20 rounded-2xl mb-6 max-w-[280px] mx-auto">
                  <button
                    onClick={() => setRole('customer')}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      role === 'customer' ? "bg-white text-slate-950 shadow-lg" : "text-slate-300 hover:text-white"
                    )}
                  >
                    Customer
                  </button>
                  <button
                    onClick={() => setRole('technician')}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      role === 'technician' ? "bg-white text-slate-950 shadow-lg" : "text-slate-300 hover:text-white"
                    )}
                  >
                    Technician
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 py-2 px-6 bg-white/5 border border-white/10 rounded-full w-fit mx-auto backdrop-blur-xl">
                  <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <p className="text-white font-black uppercase tracking-[0.3em] text-[9px]">{role} Login</p>
                </div>
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

                    <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-5">Email Address</Label>
                        <div className="relative group/input">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within/input:text-cyan-400 transition-colors" />
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            className="bg-white/10 border-white/20 rounded-3xl h-16 pl-16 text-white font-bold text-sm focus:border-cyan-400/40 transition-all placeholder:text-slate-500 shadow-inner"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-5">Password</Label>
                        <div className="relative group/input">
                          <Lock className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within/input:text-cyan-400 transition-colors" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="bg-white/10 border-white/20 rounded-3xl h-16 pl-16 pr-16 text-white font-bold text-sm focus:border-cyan-400/40 transition-all placeholder:text-slate-500 shadow-inner"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-2 pt-1">
                        <div className="flex items-center gap-3">
                          <Checkbox id="remember" className="rounded-md border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                          <Label htmlFor="remember" className="text-[11px] font-bold text-slate-300 uppercase tracking-widest cursor-pointer hover:text-slate-200 transition">Remember Me</Label>
                        </div>
                        <button type="button" onClick={() => setView('reset')} className="text-[11px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition underline underline-offset-4">Forgot Password?</button>
                      </div>

                      <Button type="submit" disabled={loading} className="w-full h-16 bg-white text-slate-950 font-black text-sm uppercase tracking-[0.2em] rounded-3xl hover:bg-slate-100 transition-all active:scale-[0.98] mt-6 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        {loading ? <Loader2 className="size-6 animate-spin" /> : <>Login <ArrowRight className="size-5 ml-2" /></>}
                      </Button>
                    </form>

                    <div className="relative py-5">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                      <div className="relative flex justify-center"><span className="bg-transparent backdrop-blur-xl px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Or continue with</span></div>
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
                      Don't have an account? <Link href={`/auth/signup?role=${role}`} className="text-cyan-400 hover:text-cyan-300 transition underline underline-offset-4 font-black">Sign Up</Link>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Reset Terminal Passkey</h3>
                    <Input type="text" placeholder="Password Reset Hint (e.g. Favorite Color)" className="bg-white/5 border-white/10 rounded-2xl h-14 px-6 text-white font-bold placeholder:text-slate-600 focus:border-cyan-500/30 transition-all" />
                    <Button onClick={() => setView('login')} className="w-full h-14 bg-white text-slate-950 font-black uppercase rounded-2xl">Return to Terminal</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
