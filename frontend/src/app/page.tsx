'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, MapPin, Zap, ArrowRight, Activity, Shield, Sparkles } from 'lucide-react';
import Testimonials from '@/components/Testimonials';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500/30">
      <Navbar />
      
      {/* Hero Section */}
      <main className="flex-grow pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center">
        <section className="w-full py-20 flex flex-col items-center justify-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl space-y-10"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/40 backdrop-blur-2xl border border-white/60 text-slate-900 text-[11px] font-black uppercase tracking-[0.25em] shadow-xl shadow-white/20 animate-float"
            >
              <span className="size-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <span>Premium Service Logistics</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            </motion.div>
            
            <h1 className="text-[5.5rem] sm:text-[8rem] md:text-[12rem] font-black tracking-[-0.07em] leading-[0.75] text-slate-950 uppercase italic relative group">
              <motion.span 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="block hover:skew-x-2 transition-transform duration-500 cursor-default"
              >
                Reliable
              </motion.span>
              <div className="relative inline-block mt-[-0.1em]">
                <span className="relative text-white [text-shadow:0_0_80px_rgba(255,255,255,0.4)]">
                  Home Services,
                  <span className="absolute inset-0 bg-gradient-to-r from-rose-500 via-cyan-400 via-purple-500 to-amber-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient-text">
                    Home Services,
                  </span>
                  <motion.span 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                      opacity: [0.2, 0.5, 0.2]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute -inset-10 bg-cyan-400/20 blur-[100px] rounded-full -z-10" 
                  />
                </span>
              </div>
              <br/>
              <motion.span 
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1, delay: 0.6 }}
                className="block text-transparent bg-clip-text bg-gradient-to-b from-slate-600 to-slate-900 font-black tracking-[-0.02em] not-italic mt-[-0.1em] relative"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}
              >
                Lucid Execution.
                <span className="absolute left-0 top-0 text-slate-400/10 blur-[2px] -z-10">Lucid Execution.</span>
              </motion.span>
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-800 font-black max-w-2xl mx-auto leading-relaxed uppercase tracking-[0.2em] drop-shadow-2xl opacity-90">
              <span className="bg-slate-950 text-white px-4 py-1 rounded-lg mr-2">High-Precision</span> 
              Service Ecosystem.
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
            >
              <Link href="/auth/signup?role=customer" className="group w-full sm:w-auto px-10 py-5 rounded-[2rem] bg-slate-950 text-white font-black text-xl transition-all shadow-2xl shadow-slate-950/20 hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-4">
                Book Service
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link href="/auth/signup?role=technician" className="w-full sm:w-auto px-10 py-5 rounded-[2rem] bg-white/40 backdrop-blur-3xl border border-white/60 text-slate-900 font-black text-xl hover:shadow-2xl hover:bg-white/60 transition-all hover:scale-[1.05] active:scale-95 text-center flex items-center justify-center border-t-white shadow-xl shadow-white/10">
                Join Network
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Steps Section */}
        <section className="mt-20 sm:mt-40 w-full max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center mb-20"
          >
            <h2 className="text-4xl md:text-8xl font-black text-slate-950 tracking-[-0.05em] mb-4 uppercase italic">Operational Protocol</h2>
            <div className="w-48 h-3 bg-gradient-to-r from-slate-950 via-slate-600 to-slate-950 rounded-full shadow-2xl" />
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <StepCard 
              icon={<Search className="w-10 h-10" />}
              title="Identity Request"
              desc="Pinpoint your service requirements via our AI-assisted terminal. Verification happens in real-time."
              delay={0}
            />
            <StepCard 
              icon={<Zap className="w-10 h-10" />}
              title="Expert Dispatch"
              desc="Proprietary logistics assign the top-tier local specialist to your exact geolocation instantly."
              delay={0.15}
            />
            <StepCard 
              icon={<MapPin className="w-10 h-10" />}
              title="Live Execution"
              desc="Monitor your technician with sub-meter accuracy and verify completion with secure OTP authentication."
              delay={0.3}
            />
          </div>
        </section>

        {/* Feature Grid */}
        <section className="mt-40 sm:mt-60 mb-40 w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <h2 className="text-6xl md:text-[8rem] font-black text-slate-950 tracking-[-0.06em] leading-[0.75] uppercase italic">
                Premium <br/> Logistics <br/> <span className="relative text-white">Infrastructure.</span>
              </h2>
              <p className="text-xl text-slate-600 font-black uppercase tracking-[0.1em] opacity-70">
                Proprietary Architecture for High-Stake Execution.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <FeatureCard 
                icon={<Activity className="size-6 text-cyan-600" />}
                title="Gemini AI Support"
                desc="Multilingual voice understanding for seamless communication."
                delay={0}
              />
              <FeatureCard 
                icon={<Shield className="size-6 text-cyan-600" />}
                title="Secure Settlement"
                desc="Encrypted payments and transparent material cost estimation."
                delay={0.1}
              />
              <FeatureCard 
                icon={<Sparkles className="size-6 text-cyan-600" />}
                title="Quality Protocol"
                desc="Top-rated professionals vetted through a multi-point verification."
                delay={0.2}
              />
              <FeatureCard 
                icon={<Zap className="size-6 text-cyan-600" />}
                title="Instant Sync"
                desc="Real-time updates between customers, technicians, and admin."
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <div className="w-full pb-20">
          <Testimonials />
        </div>
      </main>
    </div>
  );
}

function StepCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="p-10 flex flex-col items-center text-center group cursor-default bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] shadow-2xl hover:shadow-white/40 hover:bg-white/60 transition-all duration-500 relative overflow-hidden"
    >
      <div className="w-24 h-24 rounded-[2rem] bg-slate-950 flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 relative z-10 text-white">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tighter relative z-10 italic">{title}</h3>
      <p className="text-slate-600 font-bold text-[13px] leading-relaxed uppercase tracking-wider relative z-10">{desc}</p>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      className="p-8 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-xl hover:shadow-white/50 transition-all duration-500 cursor-default group"
    >
      <div className="mb-4 bg-white/60 p-3 rounded-2xl w-fit shadow-inner border border-white/40">
        {icon}
      </div>
      <h4 className="text-lg font-black text-slate-950 mb-2 uppercase tracking-tighter italic">{title}</h4>
      <p className="text-slate-500 font-bold text-[11px] leading-relaxed uppercase tracking-widest">{desc}</p>
    </motion.div>
  );
}
