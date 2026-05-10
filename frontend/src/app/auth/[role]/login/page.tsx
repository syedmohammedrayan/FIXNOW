'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Zap, Lock, Mail, Shield, User, Wrench, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { API_BASE } from '@/lib/config';

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
    customer: { icon: <User className="w-6 h-6" />, label: 'Customer', color: 'indigo' },
    technician: { icon: <Wrench className="w-6 h-6" />, label: 'Technician', color: 'cyan' },
    admin: { icon: <Shield className="w-6 h-6" />, label: 'Administrator', color: 'amber' },
  };

  const config = roleConfig[roleParam] || roleConfig.customer;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] text-slate-200 font-sans relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] animate-pulse-slow" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
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
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-blue-500/20 blur-3xl -z-10 rounded-[2.5rem]" />
        
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 sm:p-12">
          <div style={{ transform: "translateZ(40px)" }} className="relative z-10">
            <header className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className={`inline-flex items-center justify-center p-3 rounded-2xl bg-${config.color}-500/10 border border-${config.color}-500/20 mb-6`}
              >
                {config.icon}
              </motion.div>
              <h2 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">
                {config.label} Portal
              </h2>
              <p className="text-slate-400 text-sm font-medium tracking-wide">
                Initialize session for localized {roleParam} login
              </p>
            </header>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold ml-1">Comm Vector (Email)</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300 group-focus-within:text-indigo-400 transition-colors" />
                  <Input 
                    required 
                    type="email" 
                    placeholder="vector@nexus.com" 
                    className="pl-12 h-14 rounded-2xl bg-slate-950/40 border-white/5 text-white placeholder:text-indigo-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/50" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold ml-1">Login Cipher (Password)</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300 group-focus-within:text-indigo-400 transition-colors" />
                  <Input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-12 pr-12 h-14 rounded-2xl bg-slate-950/40 border-white/5 text-white placeholder:text-indigo-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/50" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                disabled={loading} 
                type="submit" 
                className={`w-full h-16 rounded-2xl font-black text-xs tracking-[0.2em] uppercase mt-4 transition-all duration-500 shadow-xl ${
                  roleParam === 'admin'
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
                }`}
              >
                {loading ? 'Verifying Login...' : 'Initialize Dashboard'}
              </Button>
            </form>

            <footer className="mt-12 text-center pt-8 border-t border-white/5">
              <Link href="/auth/login" className="flex items-center justify-center gap-2 text-[10px] font-black text-indigo-300 hover:text-indigo-400 transition-colors uppercase tracking-widest">
                <ArrowLeft className="w-3 h-3" /> Revert to Nexus Terminal
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
        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.5em] flex items-center gap-3">
          <span className="w-8 h-px bg-slate-800" />
          {roleParam.toUpperCase()} NODE • SECURE LINK
          <span className="w-8 h-px bg-slate-800" />
        </p>
      </motion.div>
    </div>
  );
}
