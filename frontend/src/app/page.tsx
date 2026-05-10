'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic, Search, MapPin, Zap, Sparkles, ArrowRight } from 'lucide-react';
import Testimonials from '@/components/Testimonials';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      {/* Hero Section */}
      <main className="flex-grow pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl space-y-8"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em] animate-float"
          >
            <span className="size-2 bg-white rounded-full animate-pulse" />
            <span>Dynamic Service Logistics</span>
            <ArrowRight className="w-3 h-3 text-white" />
          </motion.div>
          
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
            <span className="text-white drop-shadow-2xl">Reliable Home Services,</span>
            <br/>
            <span className="text-slate-400 drop-shadow-lg">
              Precision Orchestrated.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 font-bold max-w-2xl mx-auto leading-relaxed uppercase tracking-tight drop-shadow-md">
            Connect with verified local experts in seconds. 
            Smart routing meets real-time execution for a seamless repair experience.
          </p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link href="/auth/signup?role=customer" className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold text-lg transition-all pulse-glow hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3">
              Book a Service
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/auth/signup?role=technician" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 text-white font-bold text-lg hover:shadow-lg hover:border-white/40 hover:shadow-white/5 transition-all hover:scale-[1.02] active:scale-95 text-center flex items-center justify-center">
              Join as Technician
            </Link>
          </motion.div>
        </motion.div>

        {/* Steps Section */}
        <div className="mt-20 sm:mt-36 w-full max-w-5xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-16 glow-heading"
          >
            How it Works
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              icon={<Search className="w-8 h-8 text-slate-900" />}
              title="1. Request Protocol"
              desc="Identify your service needs through our streamlined interface. Our system validates requirements in milliseconds."
              delay={0}
            />
            <StepCard 
              icon={<Zap className="w-8 h-8 text-slate-900" />}
              title="2. Expert Dispatch"
              desc="Proprietary routing algorithms assign the highest-rated local specialist to your exact coordinates."
              delay={0.15}
            />
            <StepCard 
              icon={<MapPin className="w-8 h-8 text-slate-900" />}
              title="3. Live Execution"
              desc="Monitor arrival via high-precision tracking and verify service with secure OTP-based completion."
              delay={0.3}
            />
          </div>
        </div>

        {/* Core AI Features */}
        <div className="mt-20 sm:mt-36 mb-20 sm:mb-36 w-full max-w-5xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-16 glow-heading"
          >
            Powered by Advanced AI
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard 
              title="Multilingual Voice Input"
              desc="Speak your problem in your native language. Our Gemini-backed processor translates and understands intent instantly."
              delay={0}
            />
            <FeatureCard 
              title="Smart Pricing & Materials"
              desc="Get instant cost estimates and a list of recommended materials required for the job before you even book."
              delay={0.1}
            />
            <FeatureCard 
              title="Intelligent Recommendations"
              desc="We don't just find anyone; we rank providers by a custom algorithm factoring in ratings and live traffic routing."
              delay={0.2}
            />
            <FeatureCard 
              title="Dynamic Support Chatbot"
              desc="A floating context-aware assistant ready to help both customers and technicians step-by-step."
              delay={0.3}
            />
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="w-full">
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
      whileHover={{ y: -8, scale: 1.02 }}
      className="p-8 sm:p-12 flex flex-col items-center text-center group cursor-default bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl hover:border-white/30 transition-all duration-500 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-inner transition-all duration-500 group-hover:bg-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:border-white relative z-10">
        <div className="transition-all duration-500 group-hover:text-slate-900 group-hover:scale-110 text-white">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter group-hover:text-white transition-colors duration-300 relative z-10">{title}</h3>
      <p className="text-slate-400 font-bold text-xs leading-relaxed uppercase tracking-wider group-hover:text-slate-200 transition-colors duration-300 relative z-10">{desc}</p>
    </motion.div>
  );
}

function FeatureCard({ title, desc, delay }: { title: string, desc: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="p-6 sm:p-10 border-l-4 sm:border-l-8 border-l-white hover:border-l-white bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 hover:shadow-2xl rounded-r-[2rem] sm:rounded-r-[2.5rem] rounded-l-md transition-all duration-500 cursor-default relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h4 className="text-lg font-black text-white mb-4 uppercase tracking-tighter group-hover:text-white transition-colors duration-300 relative z-10">{title}</h4>
      <p className="text-slate-400 font-bold text-xs leading-relaxed uppercase tracking-widest group-hover:text-slate-200 transition-colors duration-300 relative z-10">{desc}</p>
    </motion.div>
  );
}
