'use client';

import React, { useState, useId, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Wrench, Mail, Shield, Phone, Lock, ChevronRight, Eye, EyeOff, Sparkles, ArrowLeft, CheckCircle2, ChevronDown } from 'lucide-react';
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
    // If user is already authenticated (e.g. redirected from Login with Google)
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

      // For technicians, we skip Auth creation during signup (will be created on approval)
      if (role !== 'technician' && !isGoogleLinked) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          user = userCredential.user;
          finalUid = user.uid;
        } catch (signUpError: any) {
          if (signUpError.message?.includes('rate limit')) {
            console.warn('Frontend rate limit hit, falling back to backend auth creation');
          } else {
            throw signUpError;
          }
        }
      } else if (isGoogleLinked) {
        user = auth.currentUser;
        if (user) finalUid = user.uid;
      }

      // If isGoogleLinked is true, the Auth user is already created, 
      // but we don't have the uid here (unless we stored it, but we can just let backend handle it, or we rely on backend catching email-already-exists for technicians).
      // For customers, handleGoogleClick does the submission directly.

      const payload: any = {
        id: finalUid,
        name: formData.name || user?.displayName || '',
        email: formData.email || user?.email || '',
        phone: formData.phone || '',
        password: formData.password, // Passed for pending technicians (Auth creation on approval)
        role: role,
        category: formData.category,
        passwordHint: formData.passwordHint,
        govIdUrl: formData.govIdUrl,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE}/api/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (response.status === 409) {
        // If they were already in Auth (customers), we don't delete them, but show error
        throw new Error(responseData.error || 'Account already exists under verification.');
      }

      if (!response.ok) throw new Error(responseData.error || 'Failed to create your profile.');

      if (role === 'technician') {
        // Since no Auth user exists yet, we store the email in localStorage to show status later
        localStorage.setItem('pending_tech_email', formData.email);
        alert('Registration request submitted! Please wait for admin approval before you can log in.');
        router.push('/auth/login');
      } else {
        // Explicitly sign out to force manual login on the next screen
        await signOut(auth);
        
        const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
        alert(`${roleLabel} account created successfully! Please log in to access your dashboard.`);
        router.push('/auth/login');
      }
    } catch (err: any) {
      let msg = err.message || 'Signup failed';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered. Please log in.';
      else if (err.code === 'auth/weak-password') msg = 'Password is too weak. Please use at least 6 characters.';
      else if (err.code === 'auth/invalid-email') msg = 'Invalid email address format.';
      else if (err.message.includes('Firebase') || err.message.includes('AuthApiError')) msg = 'An error occurred during signup. Please try again.';
      setError(msg);
      // If Auth was created but DB failed, we might want to cleanup, 
      // but for technicians we didn't create Auth anyway.
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
      // The onAuthStateChanged effect will handle the pre-fill.
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

  /* ─── Shared input styles ─── */
  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 sm:py-12 px-4 bg-transparent relative overflow-hidden">
      <BackgroundParticles />
      <FloatingOrbs />

      {/* Admin Quick Access */}
      <div className="absolute top-8 right-8 z-50">
        <Link 
          href={role === 'admin' ? '/auth/signup?role=customer' : '/auth/signup?role=admin'}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group backdrop-blur-md shadow-2xl"
        >
          <div className="size-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {role === 'admin' ? 'Exit Admin Terminal' : 'Admin Terminal Access'}
          </span>
          <Shield className="size-4 text-amber-500 group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="max-w-[420px] w-full relative"
      >
        {/* Card outer glow */}
        <div className="absolute -inset-1 rounded-[2rem] opacity-50 blur-2xl pointer-events-none"
          style={{ 
            background: role === 'admin' 
              ? 'radial-gradient(ellipse, rgba(245,158,11,0.15), transparent 70%)'
              : role === 'technician' 
                ? 'radial-gradient(ellipse, rgba(255,255,255,0.1), transparent 70%)' 
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
          {/* Top accent */}
          <div className="h-[3px]"
            style={{ 
              background: role === 'admin' 
                ? 'linear-gradient(90deg, transparent, rgba(245,158,11,0.7), rgba(251,191,36,0.5), transparent)' 
                : role === 'technician'
                  ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), rgba(255,255,255,0.1), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), rgba(255,255,255,0.1), transparent)' 
            }} 
          />

          <div className="px-8 sm:px-10 pt-10 pb-8 space-y-7">

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
                  {role === 'admin' ? 'Admin Registration' : 'Create Account'}
                </h1>
                <p className="text-sm text-slate-400 mt-1.5 font-medium">
                  {role === 'admin' ? 'Set up administrator access' : <span>Get started with <span className="notranslate">FixNow</span> today</span>}
                </p>

                {role && role !== 'admin' && (
                  <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl mt-6 max-w-[280px] mx-auto">
                    <button
                      onClick={() => setRole('customer')}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                        role === 'customer' ? "bg-white text-slate-950 shadow-lg" : "text-slate-500 hover:text-white"
                      )}
                    >
                      Customer
                    </button>
                    <button
                      onClick={() => setRole('technician')}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                        role === 'technician' ? "bg-white text-slate-950 shadow-lg" : "text-slate-500 hover:text-white"
                      )}
                    >
                      Technician
                    </button>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ─── Step 1: Role Selection ─── */}
              {!role ? (
                <motion.div 
                  key="role-selection"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  <p className="text-[13px] font-medium text-slate-400 text-center mb-5">Choose your account type</p>
                  {(['customer', 'technician'] as const).map(r => (
                    <motion.button 
                      key={r} 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setRole(r)} 
                      className="w-full group flex items-center p-4 rounded-xl transition-all duration-300"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }}
                    >
                      <div className={`size-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${roleConfig[r].accent} shadow-lg group-hover:scale-105 transition-transform shrink-0`}>
                        {roleConfig[r].icon}
                      </div>
                      <div className="ml-4 text-left flex-1">
                        <p className="font-bold text-white text-[15px] group-hover:text-white transition-colors">{roleConfig[r].label}</p>
                        <p className="text-[12px] text-slate-500 font-medium mt-0.5">{roleConfig[r].desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                    </motion.button>
                  ))}
                </motion.div>

              /* ─── Step 2: Method Selection ─── */
              ) : !method ? (
                <motion.div 
                  key="method-selection"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <button onClick={() => setRole(null)} className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-white transition-colors group mb-2">
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back
                  </button>
                  
                  {role !== 'admin' && (
                    <>
                      {/* Google Button */}
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                        <button 
                          type="button"
                          onClick={handleGoogleClick} 
                          className="w-full h-[52px] rounded-xl font-black text-[11px] uppercase tracking-widest text-slate-950 bg-white hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-3 group shadow-xl"
                        >
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="size-5 transition-transform group-hover:scale-110" alt="Google" />
                          Signup with Google
                        </button>
                      </motion.div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <span className="text-[12px] font-medium text-slate-500">or</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      </div>
                    </>
                  )}
                  
                  {/* Email Button */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <button 
                      onClick={() => setMethod('email')} 
                      className="w-full h-[52px] rounded-xl font-semibold text-[14px] text-white transition-all duration-300 flex items-center justify-center gap-2.5"
                      style={{
                        background: role === 'admin'
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))',
                        border: role === 'admin'
                          ? '1px solid rgba(245,158,11,0.3)'
                          : '1px solid rgba(255,255,255,0.2)',
                        boxShadow: role === 'admin'
                          ? '0 4px 15px -3px rgba(245,158,11,0.2)'
                          : 'none',
                        color: role === 'admin' ? '#0f172a' : '#e2e8f0',
                      }}
                    >
                      <Mail className="w-4 h-4" /> Continue with Email
                    </button>
                  </motion.div>
                </motion.div>

              /* ─── Step 3: Email Form ─── */
              ) : (
                <motion.div 
                  key="form-entry"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <form onSubmit={handleSignup} className="space-y-5">
                    <button type="button" onClick={() => { setMethod(null); setIsGoogleLinked(false); }} className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 hover:text-white transition-colors group mb-3">
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back
                    </button>
                    
                    <div className="space-y-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Full Name</Label>
                        <Input required placeholder="John Doe" 
                          className="h-[52px] px-4 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all focus-visible:ring-1 focus-visible:ring-white/20" 
                        style={inputStyle}
                          value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                      </div>
                      
                      {/* Email */}
                      <div className="space-y-2">
                        <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Email Address</Label>
                        <Input required type="email" placeholder="you@example.com" 
                          readOnly={isGoogleLinked}
                          className={`h-[52px] px-4 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all focus-visible:ring-1 focus-visible:ring-white/20 ${isGoogleLinked ? 'opacity-60 cursor-not-allowed' : ''}`} 
                          style={inputStyle}
                          value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                      </div>
                      
                      {/* Phone */}
                      <div className="space-y-2">
                        <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Phone Number</Label>
                        <Input required type="tel" placeholder="+91 98765 43210" 
                          className="h-[52px] px-4 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all focus-visible:ring-1 focus-visible:ring-white/20" 
                        style={inputStyle}
                          value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                        />
                      </div>
                      
                      {/* Password (Hidden if Google Linked) */}
                      {!isGoogleLinked && (
                        <div className="space-y-2">
                          <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Password</Label>
                          <div className="relative">
                            <Input required minLength={6} type={showPassword ? "text" : "password"} placeholder="Create a secure password" 
                              className="h-[52px] px-4 pr-12 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all focus-visible:ring-1 focus-visible:ring-white/20" 
                              style={inputStyle}
                              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Password Hint - Available for all methods except Admin */}
                      {role !== 'admin' && (
                        <div className="space-y-2">
                          <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Password Reset Hint (Optional)</Label>
                          <Input type="text" placeholder="e.g., Name of my first pet" 
                            className="h-[52px] px-4 rounded-xl text-[15px] font-medium text-white placeholder:text-slate-500 shadow-none transition-all focus-visible:ring-1 focus-visible:ring-white/20" 
                            style={inputStyle}
                            value={formData.passwordHint} onChange={e => setFormData({...formData, passwordHint: e.target.value})} 
                          />
                        </div>
                      )}
                      
                      {/* Category & Skills (Technician only) */}
                      {role === 'technician' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Primary Specialization</Label>
                            <div className="relative group">
                              <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 z-10" />
                              <select 
                                required
                                className="w-full h-[52px] pl-11 pr-10 rounded-xl text-[15px] font-medium text-white appearance-none transition-all focus-visible:ring-1 focus-visible:ring-white/20"
                                style={inputStyle}
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})}
                              >
                                <option value="" className="bg-slate-900">Select Category</option>
                                {ALL_SERVICES.map(cat => (
                                  <option key={cat.category} value={cat.category} className="bg-slate-900">{cat.category}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                            </div>
                          </div>

                          {formData.category && (
                            <div className="space-y-2">
                              <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Specific Services</Label>
                              <div className="max-h-[200px] overflow-y-auto p-3 rounded-xl space-y-2" style={inputStyle}>
                                {ALL_SERVICES.find(c => c.category === formData.category)?.items.map(item => (
                                  <label key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                                    <input 
                                      type="checkbox"
                                      className="size-4 rounded border-white/20 bg-transparent text-white focus:ring-white/20"
                                      checked={formData.skills.split(', ').includes(item)}
                                      onChange={e => {
                                        const current = formData.skills ? formData.skills.split(', ') : [];
                                        const next = e.target.checked 
                                          ? [...current, item]
                                          : current.filter(i => i !== item);
                                        setFormData({...formData, skills: next.filter(Boolean).join(', ')});
                                      }}
                                    />
                                    <span className="text-sm text-slate-300">{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-4 pt-4 border-t border-white/10">
                            <Label className="text-[13px] font-semibold text-slate-300 ml-0.5">Identity Verification</Label>
                            <p className="text-[11px] text-slate-500 -mt-2">Please upload a clear copy of your Aadhar or PAN card.</p>
                            <IdVerificationBox 
                              isSignup={true}
                              onUploadComplete={(url) => setFormData(prev => ({ ...prev, govIdUrl: url }))} 
                            />
                          </div>
                        </div>
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

                    {/* Submit */}
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <button 
                        disabled={loading} 
                        type="submit" 
                        className={`relative w-full h-[52px] rounded-xl font-bold text-[15px] tracking-wide mt-2 transition-all duration-300 flex items-center justify-center gap-2.5 overflow-hidden group disabled:opacity-60 ${
                          role === 'admin' ? 'text-slate-950' : 'text-white'
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
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                        <span className="relative z-10 flex items-center gap-2">
                          {loading ? 'Creating account...' : 'Create Account'}
                          {!loading && <CheckCircle2 className="w-4 h-4 transition-transform group-hover:scale-110" />}
                        </span>
                      </button>
                    </motion.div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Footer Link ─── */}
            <div className="text-center pt-1">
              <p className="text-[13px] text-slate-500 font-medium">
                Already have an account?{' '}
                <Link href={`/auth/login?role=${role || 'customer'}`} className="text-white hover:text-slate-200 transition-colors font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>


    </div>
  );
}
