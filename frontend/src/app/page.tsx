'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, MapPin, Zap, ArrowRight, Activity, Shield, Sparkles, Star, CheckCircle, Clock, Users } from 'lucide-react';
import Testimonials from '@/components/Testimonials';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500/30">
      <Navbar />

      {/* ─── Hero Section ─── */}
      <main className="relative flex-grow">
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-16">

          {/* Soft radial glow behind hero text */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="hero-radial-glow" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 max-w-5xl w-full flex flex-col items-center gap-7 text-center"
          >

            {/* ── Premium Badge ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full hero-badge animate-float"
            >
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-cyan-500" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/90">
                Premium Service Logistics
              </span>
              <Sparkles className="w-3 h-3 text-cyan-400 opacity-80" />
            </motion.div>

            {/* ── Hero Heading ── */}
            <div className="flex flex-col items-center gap-1 w-full">
              {/* "HOME SERVICES" — PRIMARY focal point */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.28 }}
                className="hero-heading-primary select-none"
              >
                Home Services
              </motion.h1>

              {/* "RELIABLE" — Secondary, slightly smaller */}
              <motion.span
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.42 }}
                className="hero-heading-secondary select-none"
              >
                Reliable
              </motion.span>
            </div>

            {/* ── Sub-headline ── */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.6 }}
              className="text-sm sm:text-base text-white/55 font-semibold max-w-md mx-auto leading-relaxed tracking-[0.12em] uppercase"
            >
              High-Precision Home Service Ecosystem
            </motion.p>

            {/* ── CTA Buttons ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md sm:max-w-none"
            >
              {/* Primary CTA */}
              <Link
                href="/auth/signup?role=customer"
                className="hero-btn-primary group w-full sm:w-auto"
              >
                Book a Service
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/auth/signup?role=technician"
                className="hero-btn-secondary w-full sm:w-auto"
              >
                Join as Technician
              </Link>
            </motion.div>

            {/* ── Trust Indicators ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.88, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-1"
            >
              <TrustBadge icon={<Star className="w-3 h-3 text-amber-400" />} label="100% Rated Services" />
              <span className="hidden sm:block w-px h-4 bg-white/10" aria-hidden />
              <TrustBadge icon={<Shield className="w-3 h-3 text-cyan-400" />} label="Verified Technicians" />
              <span className="hidden sm:block w-px h-4 bg-white/10" aria-hidden />
              <TrustBadge icon={<Clock className="w-3 h-3 text-emerald-400" />} label="24/7 Support" />
            </motion.div>

          </motion.div>
        </section>

        {/* ─── Steps Section ─── */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full mt-0 sm:mt-10 pb-20 sm:pb-32">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col items-center mb-16 sm:mb-20"
          >
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 drop-shadow-2xl tracking-[-0.05em] mb-4 uppercase italic text-center">
              Operational Protocol
            </h2>
            <div className="w-24 sm:w-40 h-1.5 sm:h-2 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <StepCard
              icon={<Search className="w-10 h-10" />}
              title="Issue Detection"
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

        {/* ─── Feature Section ─── */}
        <section className="mt-16 sm:mt-32 mb-24 sm:mb-36 w-full max-w-6xl mx-auto flex flex-col items-center text-center px-4">
          <div className="space-y-8 max-w-4xl">
            <h2 className="text-[3rem] sm:text-6xl md:text-[8rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 drop-shadow-2xl tracking-[-0.06em] leading-[0.92] uppercase italic">
              Premium <br /> Logistics <br />{' '}
              <span className="relative text-cyan-400 [text-shadow:0_0_24px_rgba(6,182,212,0.4)]">
                Infrastructure.
              </span>
            </h2>
            <p className="text-lg text-slate-300 font-bold uppercase tracking-[0.1em] opacity-80">
              Proprietary Architecture for High-Stake Execution.
            </p>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <div className="w-full pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Testimonials />
        </div>
      </main>
    </div>
  );
}

// ── Trust Badge ──
function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-[0.18em]">
        {label}
      </span>
    </div>
  );
}

// ── Step Card ──
function StepCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="p-8 sm:p-10 flex flex-col items-center text-center group cursor-default bg-slate-900/50 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl hover:shadow-white/5 hover:bg-slate-900/70 transition-all duration-500 relative overflow-hidden"
    >
      <div className="size-20 sm:size-24 rounded-[1.5rem] sm:rounded-[2rem] bg-white/[0.08] border border-white/[0.15] flex items-center justify-center mb-6 sm:mb-8 shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 relative z-10 text-white backdrop-blur-xl">
        {icon}
      </div>
      <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 drop-shadow-md mb-3 uppercase tracking-tight relative z-10 italic">
        {title}
      </h3>
      <p className="text-white/60 font-medium text-[13px] leading-relaxed tracking-wide relative z-10">
        {desc}
      </p>
    </motion.div>
  );
}
