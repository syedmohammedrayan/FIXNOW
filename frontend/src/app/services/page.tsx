'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Zap, Droplets, Wind, Wrench, Paintbrush, Home, Car, Hammer,
  Shield, Sparkles, ArrowRight, Search, ChevronRight, Globe2,
  Building2, Cpu, Smartphone, Tv, Monitor, Wifi, Sun, Moon,
  Trees, Fence, Bug, Flame, Lock, Camera, BrickWall,
  CircuitBoard, Cog, Truck, Bike, Ship, Plane, Factory,
  HardHat, Warehouse, Gauge, Fuel, Battery, Plug,
  Refrigerator, WashingMachine, CookingPot, Microwave,
  Star, CheckCircle2, Users, Clock, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

/* ─────────────────── SERVICE DATA ─────────────────── */

interface Service {
  icon: React.ReactNode;
  name: string;
  desc: string;
  popular?: boolean;
}

interface ServiceCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  glow: string;
  services: Service[];
}

const CATEGORIES: ServiceCategory[] = [
  {
    id: 'household',
    title: 'Household & Home',
    subtitle: 'Complete home care, from plumbing to painting.',
    icon: <Home className="size-7" />,
    gradient: 'from-indigo-500 to-violet-600',
    border: 'border-indigo-200',
    glow: 'rgba(99,102,241,0.15)',
    services: [
      { icon: <Zap className="size-5" />, name: 'Electrical Repair', desc: 'Wiring, switches, circuit breakers & panel upgrades', popular: true },
      { icon: <Droplets className="size-5" />, name: 'Plumbing', desc: 'Pipe repair, drain cleaning, fixture installation', popular: true },
      { icon: <Hammer className="size-5" />, name: 'Carpentry', desc: 'Furniture repair, shelving, custom woodwork' },
      { icon: <Paintbrush className="size-5" />, name: 'Painting & Finishing', desc: 'Interior & exterior painting, wall texturing' },
      { icon: <Wind className="size-5" />, name: 'AC & HVAC', desc: 'Installation, repair, gas refill & duct cleaning', popular: true },
      { icon: <Lock className="size-5" />, name: 'Locksmith', desc: 'Lock installation, key duplication, smart locks' },
      { icon: <BrickWall className="size-5" />, name: 'Masonry & Tiling', desc: 'Tile work, brick repair, flooring installation' },
      { icon: <Bug className="size-5" />, name: 'Pest Control', desc: 'Termite treatment, fumigation, rodent control' },
      { icon: <Flame className="size-5" />, name: 'Gas & Kitchen', desc: 'Gas leak repair, stove fitting, chimney service' },
      { icon: <Sun className="size-5" />, name: 'Solar Panel', desc: 'Installation, maintenance & inverter repair' },
    ],
  },
  {
    id: 'appliances',
    title: 'Appliances & Electronics',
    subtitle: 'Expert repair for all your home appliances.',
    icon: <Tv className="size-7" />,
    gradient: 'from-cyan-500 to-blue-600',
    border: 'border-cyan-200',
    glow: 'rgba(6,182,212,0.15)',
    services: [
      { icon: <Refrigerator className="size-5" />, name: 'Refrigerator Repair', desc: 'Cooling issues, compressor, thermostat & gas refill', popular: true },
      { icon: <WashingMachine className="size-5" />, name: 'Washing Machine', desc: 'Drum issues, drainage, motor & PCB repair', popular: true },
      { icon: <Microwave className="size-5" />, name: 'Microwave & Oven', desc: 'Heating element, magnetron & control board' },
      { icon: <Tv className="size-5" />, name: 'TV & Display', desc: 'LED, OLED, panel replacement & mounting' },
      { icon: <CookingPot className="size-5" />, name: 'Kitchen Appliances', desc: 'Mixer grinder, induction, dishwasher repair' },
      { icon: <Monitor className="size-5" />, name: 'Computer & Laptop', desc: 'Hardware repair, data recovery, OS installation' },
      { icon: <Smartphone className="size-5" />, name: 'Mobile & Tablet', desc: 'Screen replacement, battery, motherboard repair' },
      { icon: <Wifi className="size-5" />, name: 'Networking & WiFi', desc: 'Router setup, cabling, network troubleshooting' },
    ],
  },
  {
    id: 'automobile',
    title: 'Automobile Services',
    subtitle: 'Cars, bikes, trucks — roadside & workshop.',
    icon: <Car className="size-7" />,
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200',
    glow: 'rgba(16,185,129,0.15)',
    services: [
      { icon: <Car className="size-5" />, name: 'Car Repair & Service', desc: 'Engine diagnostics, oil change, brake service', popular: true },
      { icon: <Bike className="size-5" />, name: 'Two-Wheeler Service', desc: 'Bike servicing, tyre change, chain adjustment' },
      { icon: <Battery className="size-5" />, name: 'Battery & Electrical', desc: 'Jump start, alternator, wiring harness repair' },
      { icon: <Gauge className="size-5" />, name: 'AC & Climate Control', desc: 'Car AC gas refill, compressor, blower motor' },
      { icon: <Cog className="size-5" />, name: 'Transmission & Clutch', desc: 'Gearbox repair, clutch plate, differential' },
      { icon: <Paintbrush className="size-5" />, name: 'Denting & Painting', desc: 'Scratch removal, panel beating, full paint job' },
      { icon: <Fuel className="size-5" />, name: 'Fuel System', desc: 'Fuel pump, injector cleaning, carburettor tuning' },
      { icon: <Truck className="size-5" />, name: 'Commercial Vehicle', desc: 'Fleet maintenance, heavy vehicle repair' },
    ],
  },
  {
    id: 'outdoor',
    title: 'Outdoor & Landscape',
    subtitle: 'Garden, exterior & outdoor space services.',
    icon: <Trees className="size-7" />,
    gradient: 'from-lime-500 to-green-600',
    border: 'border-lime-200',
    glow: 'rgba(132,204,22,0.15)',
    services: [
      { icon: <Trees className="size-5" />, name: 'Garden & Lawn Care', desc: 'Mowing, trimming, irrigation system setup' },
      { icon: <Fence className="size-5" />, name: 'Fencing & Gates', desc: 'Installation, welding, automatic gate motors' },
      { icon: <Droplets className="size-5" />, name: 'Pool & Water Features', desc: 'Pool cleaning, pump repair, fountain setup' },
      { icon: <Sun className="size-5" />, name: 'Outdoor Lighting', desc: 'Landscape lighting, pathway lights, floodlights' },
      { icon: <Home className="size-5" />, name: 'Roofing & Gutters', desc: 'Leak repair, gutter cleaning, waterproofing', popular: true },
      { icon: <Camera className="size-5" />, name: 'CCTV & Security', desc: 'Camera installation, DVR setup, access control' },
    ],
  },
  {
    id: 'commercial',
    title: 'Commercial & Industrial',
    subtitle: 'Enterprise-grade maintenance & installation.',
    icon: <Building2 className="size-7" />,
    gradient: 'from-amber-500 to-orange-600',
    border: 'border-amber-200',
    glow: 'rgba(245,158,11,0.15)',
    services: [
      { icon: <Building2 className="size-5" />, name: 'Office Maintenance', desc: 'Electrical, plumbing & general office upkeep', popular: true },
      { icon: <Factory className="size-5" />, name: 'Factory Equipment', desc: 'Industrial machinery repair & installation' },
      { icon: <Warehouse className="size-5" />, name: 'Warehouse Services', desc: 'Racking systems, dock doors, conveyor belts' },
      { icon: <CircuitBoard className="size-5" />, name: 'Server & IT Infra', desc: 'Server rack setup, UPS systems, structured cabling' },
      { icon: <HardHat className="size-5" />, name: 'Construction Support', desc: 'Scaffolding, welding, civil engineering tasks' },
      { icon: <Plug className="size-5" />, name: 'Power & Generator', desc: 'Generator installation, transformer, HT/LT panels' },
    ],
  },
  {
    id: 'specialty',
    title: 'Specialty & Smart Home',
    subtitle: 'Future-ready tech services for modern living.',
    icon: <Cpu className="size-7" />,
    gradient: 'from-fuchsia-500 to-pink-600',
    border: 'border-fuchsia-200',
    glow: 'rgba(217,70,239,0.15)',
    services: [
      { icon: <Cpu className="size-5" />, name: 'Smart Home Setup', desc: 'Alexa, Google Home, automated lighting & curtains', popular: true },
      { icon: <Shield className="size-5" />, name: 'Home Security Systems', desc: 'Alarm systems, motion sensors, smart locks' },
      { icon: <Plug className="size-5" />, name: 'EV Charger Install', desc: 'Home & commercial EV charging station setup' },
      { icon: <Moon className="size-5" />, name: 'Home Theater', desc: 'Projector installation, surround sound, acoustic treatment' },
      { icon: <Globe2 className="size-5" />, name: 'Satellite & Antenna', desc: 'Dish installation, DTH setup, signal boosting' },
      { icon: <Wifi className="size-5" />, name: 'Whole-Home WiFi', desc: 'Mesh network setup, range extension, enterprise AP' },
    ],
  },
];

const STATS = [
  { value: '25K+', label: 'Verified Technicians', icon: <Users className="size-5" /> },
  { value: '150+', label: 'Service Categories', icon: <Wrench className="size-5" /> },
  { value: '4.9★', label: 'Average Rating', icon: <Star className="size-5" /> },
  { value: '<15min', label: 'Avg Response Time', icon: <Clock className="size-5" /> },
];

/* ─────────────────── PAGE COMPONENT ─────────────────── */

export default function ServicesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  // Filter by search
  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    services: cat.services.filter(s =>
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.services.length > 0);

  // Popular services across all categories
  const popularServices = CATEGORIES.flatMap(cat =>
    cat.services.filter(s => s.popular).map(s => ({ ...s, categoryTitle: cat.title, gradient: cat.gradient }))
  );

  return (
    <div className="min-h-screen font-sans">
      <Navbar />

      {/* ─── Hero Section ─── */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 right-[5%] w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel text-indigo-600 text-sm font-semibold tracking-wide mb-8">
              <Globe2 className="size-4" />
              <span>150+ Services Worldwide</span>
              <Sparkles className="size-4 text-indigo-500 animate-pulse" />
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              <span className="glow-heading">Every Service,</span>
              <br />
              <span className="glow-heading-gradient">One Platform.</span>
            </h1>

            <p className="text-lg md:text-xl glow-subtext max-w-2xl mx-auto leading-relaxed mb-10">
              From fixing a leaky faucet to setting up smart home systems — we connect you
              with verified professionals for household, automobile, commercial & specialty services.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel-strong rounded-2xl p-6 text-center hover:shadow-[0_8px_40px_rgba(99,102,241,0.1)] transition-all"
            >
              <div className="flex items-center justify-center gap-2 text-indigo-500 mb-2">
                {stat.icon}
              </div>
              <h3 className="text-2xl font-extrabold text-slate-200">{stat.value}</h3>
              <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── Popular Services ─── */}
      {!searchQuery && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <SectionHeader
            title="Most Popular"
            subtitle="Top-requested services by our customers"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularServices.map((service, i) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6, scale: 1.01 }}
                onClick={() => router.push('/auth/login?role=customer')}
                className="glass-panel-strong rounded-3xl p-6 cursor-pointer hover:shadow-[0_12px_48px_rgba(99,102,241,0.12)] transition-all group border border-transparent hover:border-indigo-200"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${service.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-200">{service.name}</h3>
                      <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg uppercase tracking-wider">Popular</span>
                    </div>
                    <p className="text-sm text-indigo-300 mt-1 leading-relaxed">{service.desc}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{service.categoryTitle}</p>
                  </div>
                  <ArrowRight className="size-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Category Navigation Pills ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeCategory === null
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                : 'glass-panel text-indigo-200 hover:text-indigo-600 hover:border-indigo-200'
            }`}
          >
            All Services
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                  : 'glass-panel text-indigo-200 hover:text-indigo-600 hover:border-indigo-200'
              }`}
            >
              {cat.icon}
              <span className="hidden sm:inline">{cat.title}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── All Categories Grid ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="space-y-16">
          <AnimatePresence mode="popLayout">
            {filteredCategories
              .filter(cat => !activeCategory || cat.id === activeCategory)
              .map((category, catIdx) => (
                <CategorySection key={category.id} category={category} index={catIdx} />
              ))}
          </AnimatePresence>

          {filteredCategories.filter(cat => !activeCategory || cat.id === activeCategory).length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <Search className="size-16 text-slate-200 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-400">No services found</h3>
              <p className="text-indigo-300 mt-2">Try a different search term or browse all categories.</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory(null); }}
                className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-500 transition"
              >
                Show All Services
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="relative overflow-hidden mt-12 rounded-3xl border border-indigo-200/50 mx-4 sm:mx-6 lg:mx-8 shadow-2xl">
        <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-md" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />
        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Can&apos;t find what you need?
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Simply describe your issue and our AI will match you with the right professional.
              We cover 150+ service types across 50+ cities.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup?role=customer"
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-extrabold text-lg hover:bg-indigo-700 transition-all shadow-xl active:scale-95 flex items-center gap-3"
              >
                Book a Service Now
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="/auth/signup?role=technician"
                className="px-10 py-4 bg-slate-900/5 text-white border-2 border-slate-900/10 rounded-2xl font-bold text-lg hover:bg-slate-900/10 transition-all active:scale-95"
              >
                Join as Technician
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer spacer ─── */}
      <div className="h-4" />
    </div>
  );
}

/* ─────────────────── CATEGORY SECTION ─────────────────── */

function CategorySection({ category, index }: { category: ServiceCategory; index: number }) {
  const router = useRouter();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
    >
      {/* Category Header */}
      <div className="flex items-center gap-5 mb-8">
        <div className={`p-4 rounded-3xl bg-gradient-to-br ${category.gradient} text-white shadow-xl`}>
          {category.icon}
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-200">{category.title}</h2>
          <p className="text-indigo-300 text-sm mt-1 font-medium">{category.subtitle}</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.services.map((service, i) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.04 + 0.2 }}
            whileHover={{ y: -4 }}
            onClick={() => router.push('/auth/login?role=customer')}
            className={`glass-panel-strong rounded-2xl p-5 cursor-pointer group transition-all hover:shadow-[0_8px_40px_${category.glow}] border border-transparent hover:${category.border}`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${category.gradient} text-white shadow-md group-hover:scale-110 transition-transform`}>
                {service.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-indigo-600 transition-colors">{service.name}</h3>
                  {service.popular && (
                    <Star className="size-3 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <p className="text-xs text-indigo-300 mt-1 leading-relaxed">{service.desc}</p>
              </div>
              <ChevronRight className="size-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all mt-0.5 shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Divider */}
      <div className="mt-12 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </motion.div>
  );
}

/* ─────────────────── SECTION HEADER ─────────────────── */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="mb-10"
    >
      <h2 className="text-3xl font-extrabold glow-heading">{title}</h2>
      <p className="text-indigo-300 mt-2 font-medium">{subtitle}</p>
    </motion.div>
  );
}
