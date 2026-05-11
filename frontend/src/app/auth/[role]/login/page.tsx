'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Lock, Mail, Shield, User, Wrench, ArrowLeft, Eye, EyeOff, Activity } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

export default function DynamicLoginPage() {
  const router = useRouter();
  const params = useParams();
  const roleParam = params.role as 'customer' | 'technician' | 'admin';
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 3D Animation Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const profileRes = await fetch(`${API_BASE}/api/users/${user.uid}`);
      const profileData = await profileRes.json();

      if (profileData.success) {
        const dbRole = profileData.user.role;
        
        if (dbRole !== roleParam) {
          setError(`Access Denied: This is a ${dbRole} account.`);
          await signOut(auth);
          setLoading(false);
          return;
        }

        if (dbRole === 'technician' && !profileData.user.approved) {
          setError('Account pending administrative approval.');
          await signOut(auth);
          setLoading(false);
          return;
        }

        router.push(`/${dbRole}/dashboard`);
      } else {
        router.push(`/${roleParam}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication sequence failed.');
      setLoading(false);
    }
  };

  const roleConfig = {
    customer: { icon: <User className="w-6 h-6" />, label: 'Customer', accent: 'cyan' },
    technician: { icon: <Wrench className="w-6 h-6" />, label: 'Technician', accent: 'cyan' },
    admin: { icon: <Shield className="w-6 h-6" />, label: 'Administrator', accent: 'amber' } as const,
  };

  // Removed unused config

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-200 font-sans relative overflow-hidden selection:bg-cyan-500/30">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-slate-500/5 blur-[150px] animate-pulse-slow" />
      </div>

      <motion.div 
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-slate-500/10 blur-3xl -z-10 rounded-[2.5rem]" />
        
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden p-6 sm:p-12">
          <div style={{ transform: "translateZ(40px)" }} className="relative z-10">
            <header className="text-center mb-8 sm:mb-10">
              <Logo 
                isAdmin={roleParam === 'admin'} 
                className="justify-center mb-6 sm:mb-8"
              />
              <div className="flex items-center justify-center gap-2 mt-2">
                <Activity className="size-3 text-cyan-400 animate-pulse" />
                <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                  Secure Authentication Node
                </p>
              </div>
            </header>

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black ml-1">Identity Vector</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-white transition-colors" />
                  <Input 
                    required 
                    type="email" 
                    placeholder="ENTER EMAIL ADDRESS" 
                    className="pl-12 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-700 focus-visible:ring-white/10 focus-visible:border-white font-bold uppercase text-xs" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black ml-1">Access Cipher</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-white transition-colors" />
                  <Input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-12 pr-12 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-700 focus-visible:ring-white/10 focus-visible:border-white font-bold text-xs" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                disabled={loading} 
                type="submit" 
                className="w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl font-black text-xs tracking-[0.4em] uppercase mt-4 transition-all duration-500 shadow-xl bg-white text-slate-950 hover:bg-slate-200 shadow-white/10 active:scale-[0.98]"
              >
                {loading ? 'Verifying Cipher...' : 'Initialize Session'}
              </Button>
            </form>

            <footer className="mt-12 text-center pt-8 border-t border-white/5">
              <Link href="/auth/login" className="flex items-center justify-center gap-3 text-[10px] font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em]">
                <ArrowLeft className="w-3.5 h-3.5" /> Revert to Global Terminal
              </Link>
            </footer>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-center z-10"
      >
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] flex items-center gap-4">
          <span className="w-12 h-px bg-white/5" />
          {roleParam.toUpperCase()} NODE • ENCRYPTED LINK
          <span className="w-12 h-px bg-white/5" />
        </p>
      </motion.div>
    </div>
  );
}
