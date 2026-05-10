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
            className="max-w-5xl w-full flex flex-col items-center gap-8"
          >
            {/* Badge */}
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
            
            {/* Hero Heading — clean stacked lines, zero overlap */}
            <div className="flex flex-col items-center gap-0 leading-none w-full">
              {/* Line 1: RELIABLE — light, glowing */}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="block font-black uppercase italic tracking-[-0.05em] text-white drop-shadow-lg [text-shadow:0_0_20px_rgba(255,255,255,0.15)] text-[4rem] sm:text-[6rem] md:text-[9rem] leading-none select-none"
              >
                Reliable
              </motion.span>

              {/* Line 2: HOME SERVICES — animated gradient, clearly below line 1 */}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45 }}
                className="block font-black uppercase italic tracking-[-0.05em] leading-none text-[4rem] sm:text-[6rem] md:text-[9rem] select-none
                  bg-gradient-to-r from-rose-500 via-violet-500 to-cyan-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient-text
                  drop-shadow-[0_4px_20px_rgba(139,92,246,0.2)]"
              >
                Home Services
              </motion.span>
            </div>

            {/* Subtext */}
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-base md:text-lg text-slate-700 font-bold max-w-xl mx-auto leading-relaxed uppercase tracking-[0.18em]"
            >
              High-Precision Service Ecosystem.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <Link href="/auth/signup?role=customer" className="group w-full sm:w-auto px-10 py-5 rounded-[2.5rem] bg-white text-slate-950 font-black text-lg uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:bg-slate-50 hover:scale-[1.05] active:scale-95 flex items-center justify-center gap-4">
                Book Service
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link href="/auth/signup?role=technician" className="w-full sm:w-auto px-10 py-5 rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border border-white/40 text-white font-black text-lg uppercase tracking-widest hover:bg-white/20 transition-all hover:scale-[1.05] active:scale-95 text-center flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
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
            <h2 className="text-4xl md:text-8xl font-black text-white drop-shadow-lg [text-shadow:0_0_15px_rgba(255,255,255,0.15)] tracking-[-0.05em] mb-4 uppercase italic">Operational Protocol</h2>
            <div className="w-48 h-3 bg-gradient-to-r from-white/80 via-white to-white/80 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
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

        {/* Feature Section */}
        <section className="mt-40 sm:mt-60 mb-40 w-full max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="space-y-10 max-w-4xl">
            <h2 className="text-6xl md:text-[8rem] font-black text-white drop-shadow-lg [text-shadow:0_0_15px_rgba(255,255,255,0.15)] tracking-[-0.06em] leading-[0.75] uppercase italic">
              Premium <br/> Logistics <br/> <span className="relative text-cyan-400 [text-shadow:0_0_15px_rgba(6,182,212,0.2)]">Infrastructure.</span>
            </h2>
            <p className="text-xl text-slate-300 font-black uppercase tracking-[0.1em] opacity-90 drop-shadow-md">
              Proprietary Architecture for High-Stake Execution.
            </p>
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
      <div className="w-24 h-24 rounded-[2rem] bg-white/20 border border-white/40 flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 relative z-10 text-white backdrop-blur-xl">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-white drop-shadow-md mb-4 uppercase tracking-tighter relative z-10 italic">{title}</h3>
      <p className="text-slate-200 font-bold text-[13px] leading-relaxed uppercase tracking-wider relative z-10 drop-shadow-sm">{desc}</p>
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
      <div className="mb-4 bg-white/20 backdrop-blur-xl p-3 rounded-2xl w-fit shadow-inner border border-white/40">
        {icon}
      </div>
      <h4 className="text-lg font-black text-white drop-shadow-md mb-2 uppercase tracking-tighter italic">{title}</h4>
      <p className="text-slate-200 font-bold text-[11px] leading-relaxed uppercase tracking-widest drop-shadow-sm">{desc}</p>
    </motion.div>
  );
}
