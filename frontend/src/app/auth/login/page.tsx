'use client';

import React, { useState, useId, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, Shield, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
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

  // Password Reset State
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
          // If we're already redirecting, don't start another check
          if (loading) return;
          
          setLoading(true);
          const profileRes = await fetch(`${API_BASE}/api/users/${user.uid}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.success && profileData.user) {
              const dbRole = profileData.user.role;
              
              // PERMANENT FIX: Route based on DB role, not URL state
              if (dbRole === 'technician') {
                if (!profileData.user.approved) throw new Error('ID verification in progress. Our team is reviewing your profile.');
                router.replace('/technician/dashboard');
              } else if (dbRole === 'admin') {
                router.replace('/admin/dashboard');
              } else {
                router.replace('/customer/dashboard');
              }
              return;
            }
          }
          // If profile wasn't found, only then go to signup
          router.replace(`/auth/signup?role=${role}`);
        } catch (err: any) {
          setError(err.message || 'Error processing authentication.');
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router, mounted]); // Removed 'role' from dependencies to prevent listener loops

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
      let user;
      if (!e) { // Google login
        const result = await signInWithPopup(auth, googleProvider);
        user = result.user;
      } else { // Email login
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;
      }

      if (!user) throw new Error("Authentication failed. No user returned.");
      
      // The onAuthStateChanged listener above will handle the redirection 
      // automatically once the 'user' state changes. We just need to stop loading here.
    } catch (err: any) {
      let msg = err.message || 'Login failed';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid-credential') || msg.includes('user-not-found') || msg.includes('wrong-password')) {
        msg = 'Invalid email or password.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  const handleVerifyHint = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/verify-hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, hint: resetHint })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      
      // Verification successful
      setResetStep('password');
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    if (newPassword.length < 6) {
      return setResetError('Password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return setResetError('Passwords do not match');
    }

    setResetLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, hint: resetHint, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      
      setResetSuccessMessage('Your account password has been successfully reset!');
      
      // Auto redirect back to login after a few seconds
      setTimeout(() => {
        setFormData(prev => ({ ...prev, email: resetEmail, password: '' }));
        setView('login');
        setResetStep('hint');
        setResetHint('');
        setNewPassword('');
        setConfirmPassword('');
        setResetSuccessMessage('');
      }, 3000);

    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 sm:py-12 px-4 bg-transparent relative overflow-hidden">
      <BackgroundParticles />
      <FloatingOrbs />

      {/* Admin Toggle — top right */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-4 sm:top-6 right-4 sm:right-6 z-[100]"
      >
        <button 
          onClick={() => setRole(role === 'admin' ? 'customer' : 'admin')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-semibold transition-all duration-300 border backdrop-blur-xl ${
            role === 'admin' 
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10' 
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20'
          }`}
        >
          <Shield className={`w-4 h-4 ${role === 'admin' ? 'text-amber-400' : 'text-blue-400'}`} />
          <span className="hidden sm:inline">{role === 'admin' ? 'Exit Admin Mode' : 'Admin Login'}</span>
        </button>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="max-w-[420px] w-full relative"
      >
        {/* Card outer glow */}
        <div className="absolute -inset-1 rounded-[2rem] opacity-50 blur-2xl pointer-events-none"
          style={{ 
            background: role === 'admin' 
              ? 'radial-gradient(ellipse, rgba(245,158,11,0.15), transparent 70%)' 
              : 'radial-gradient(ellipse, rgba(255,255,255,0.1), transparent 70%)' 
          }} 
        />

        {/* ─── Main Card ─── */}
        <div className="relative w-full rounded-[2rem] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255,255,255,0.1)',
            backdropFilter: 'blur(24px) saturate(150%)',
          }}
        >
          {/* Top gradient accent */}
          <div className="h-[3px]"
            style={{ 
              background: role === 'admin' 
                ? 'linear-gradient(90deg, transparent, rgba(245,158,11,0.7), rgba(251,191,36,0.5), transparent)' 
                : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), rgba(255,255,255,0.1), transparent)' 
            }} 
          />

          <div className="px-8 sm:px-10 pt-10 pb-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              {view === 'login' ? (
                <motion.div
                  key="login-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-7"
                >
                  {/* ─── Brand Header ─── */}
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="flex justify-center"
                    >
                      <Logo 
                        isAdmin={role === 'admin'} 
                        className="justify-center flex-col" 
                        iconClassName="size-14" 
                      />
                    </motion.div>
                    <div>
                      <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        {role === 'admin' ? 'Admin Portal' : 'Welcome Back'}
                      </h1>
                      <p className="text-sm text-slate-400 mt-1.5 font-medium">
                        {role === 'admin' ? 'Secure administrator access' : <span>Sign in to your <span className="notranslate">FixNow</span> account</span>}
                      </p>
                    </div>
                  </div>

                  {/* ─── Role Switcher ─── */}
                  {role !== 'admin' && (
                    <div className="relative flex p-1 rounded-xl overflow-hidden"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
                      }}
                    >
                      <motion.div
                        initial={false}
                        animate={{ x: role === 'customer' ? 0 : '100%' }}
                        className="absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] rounded-lg"
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                      />
                      
                      {(['customer', 'technician'] as const).map((r) => (
                        <button 
                          key={r}
                          onClick={() => setRole(r)}
                          className={`relative z-10 flex-1 py-3 rounded-lg text-sm font-semibold capitalize transition-colors duration-200 ${
                            role === r ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ─── Login Form ─── */}
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-4">
                      {/* Email */}
                      <motion.div 
                        initial={{ x: -8, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                      >
                        <Label htmlFor={`${id}-email`} className="text-[13px] font-semibold text-slate-300 ml-0.5 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-white/50" /> Email Address
                        </Label>
                        <Input 
                          id={`${id}-email`}
                          required 
                          type="email" 
                          placeholder="you@example.com" 
                          className="h-[52px] px-4 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all duration-300 focus-visible:ring-1 focus-visible:ring-white/20"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
                          }}
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                      </motion.div>

                      {/* Password */}
                      <motion.div 
                        initial={{ x: -8, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-2"
                      >
                        <Label htmlFor={`${id}-password`} className="text-[13px] font-semibold text-slate-300 ml-0.5 flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-white/50" /> Password
                        </Label>
                        <div className="relative">
                          <Input 
                            id={`${id}-password`}
                            required minLength={6}
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter your password" 
                            className="h-[52px] px-4 pr-12 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all duration-300 focus-visible:ring-1 focus-visible:ring-white/20"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
                            }}
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </motion.div>
                    </div>

                    {/* Remember / Forgot */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Checkbox 
                          id={`${id}-remember`}
                          className="size-[18px] rounded-md border-white/15 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-slate-900" 
                        />
                        <Label htmlFor={`${id}-remember`} className="text-[13px] text-slate-400 cursor-pointer hover:text-slate-300 transition-colors font-medium">
                          Remember me
                        </Label>
                      </div>
                      {role !== 'admin' && (
                        <button 
                          type="button" 
                          onClick={() => {
                            setResetEmail(formData.email);
                            setView('reset');
                            setResetStep('hint');
                            setResetError('');
                            setResetSuccessMessage('');
                          }}
                          className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3.5 rounded-xl flex items-start gap-3"
                            style={{
                              background: 'rgba(239,68,68,0.08)',
                              border: '1px solid rgba(239,68,68,0.15)',
                            }}
                          >
                            <div className="size-2 rounded-full bg-red-500 animate-pulse mt-1.5 shrink-0" />
                            <p className="text-[13px] font-medium text-red-400 leading-relaxed">{error}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <button 
                        disabled={loading} 
                        type="submit" 
                        className={`relative w-full h-[52px] rounded-xl font-bold text-[15px] tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden group disabled:opacity-60 ${
                          role === 'admin'
                            ? 'text-slate-950'
                            : 'text-white'
                        }`}
                        style={{
                          background: role === 'admin'
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : 'white',
                          boxShadow: role === 'admin'
                            ? '0 8px 25px -5px rgba(245,158,11,0.3)'
                            : '0 8px 25px -5px rgba(0,0,0,0.4)',
                        }}
                      >
                        {/* Shine */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                        
                        <span className="relative z-10 flex items-center gap-2">
                          {loading ? 'Signing in...' : 'Sign In'} 
                          {!loading && <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${role === 'admin' ? '' : 'text-slate-900'}`} />}
                        </span>
                      </button>
                    </motion.div>
                  </form>

                  {/* ─── Google Login ─── */}
                  {role !== 'admin' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <span className="text-[12px] font-medium text-slate-500">or continue with</span>
                        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      </div>

                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                        <button 
                          type="button"
                          onClick={() => handleLogin()} 
                          className="w-full h-[52px] rounded-xl font-semibold text-[14px] text-slate-300 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 group"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                          }}
                        >
                          <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          </svg>
                          Login with Google
                        </button>
                      </motion.div>
                    </div>
                  )}

                  {/* ─── Footer Link ─── */}
                  <div className="text-center pt-1">
                    <p className="text-[13px] text-slate-500 font-medium">
                      Don't have an account?{' '}
                      <Link href={`/auth/signup?role=${role}`} className="text-white hover:text-slate-200 transition-colors font-semibold">
                        Sign up
                      </Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="reset-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-7"
                >
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="size-14 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-black/20">
                        <Lock className="w-6 h-6 text-slate-900" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Reset Password
                      </h1>
                      <p className="text-sm text-slate-400 mt-1.5 font-medium">
                        {resetStep === 'hint' ? 'Verify your identity using your hint' : 'Create a new secure password'}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={resetStep === 'hint' ? handleVerifyHint : handleResetPassword} className="space-y-5">
                    <AnimatePresence mode="wait">
                      {resetStep === 'hint' ? (
                        <motion.div key="step-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Email Address</Label>
                            <Input 
                              required type="email" placeholder="you@example.com" 
                              className="h-[52px] px-4 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all focus-visible:ring-1 focus-visible:ring-indigo-500/30"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}
                              value={resetEmail} onChange={e => setResetEmail(e.target.value)} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Enter Password Reset Hint</Label>
                            <Input 
                              required type="text" placeholder="Your secret hint" 
                              className="h-[52px] px-4 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all focus-visible:ring-1 focus-visible:ring-indigo-500/30"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}
                              value={resetHint} onChange={e => setResetHint(e.target.value)} 
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="step-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Enter New Password</Label>
                            <Input 
                              required minLength={6} type="password" placeholder="Min. 6 characters" 
                              className="h-[52px] px-4 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all focus-visible:ring-1 focus-visible:ring-indigo-500/30"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}
                              value={newPassword} onChange={e => setNewPassword(e.target.value)} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Confirm New Password</Label>
                            <Input 
                              required minLength={6} type="password" placeholder="Confirm password" 
                              className="h-[52px] px-4 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all focus-visible:ring-1 focus-visible:ring-indigo-500/30"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}
                              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} 
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Reset Error */}
                    <AnimatePresence>
                      {resetError && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-3.5 rounded-xl flex items-start gap-3 mt-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                            <div className="size-2 rounded-full bg-red-500 animate-pulse mt-1.5 shrink-0" />
                            <p className="text-[13px] font-medium text-red-400 leading-relaxed">{resetError}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <button 
                        disabled={resetLoading} 
                        type="submit" 
                        className="relative w-full h-[52px] rounded-xl font-bold text-[15px] tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden group text-white disabled:opacity-60"
                        style={{
                          background: 'white',
                          boxShadow: '0 8px 25px -5px rgba(0,0,0,0.4)',
                        }}
                      >
                        <span className="relative z-10 flex items-center gap-2 text-slate-900">
                          {resetLoading ? 'Processing...' : (resetStep === 'hint' ? 'Verify Hint' : 'Update Password')} 
                          {!resetLoading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
                        </span>
                      </button>
                    </motion.div>
                  </form>

                  <div className="text-center pt-1">
                    <button onClick={() => setView('login')} className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors">
                      Back to Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Floating Success Message */}
      <AnimatePresence>
        {resetSuccessMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 z-[200] px-6 py-4 rounded-2xl flex items-center gap-4"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.4)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm font-bold text-emerald-400 tracking-wide">{resetSuccessMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
