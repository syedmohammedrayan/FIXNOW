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
import { cn } from '@/lib/utils';

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
    gradient: 'from-slate-800 to-slate-950',
    border: 'border-white/20',
    glow: 'rgba(255,255,255,0.1)',
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
    gradient: 'from-cyan-500 to-cyan-600',
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
    gradient: 'from-slate-700 to-slate-900',
    border: 'border-white/20',
    glow: 'rgba(255,255,255,0.05)',
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
    id: 'specialty',
    title: 'Specialty & Smart Home',
    subtitle: 'Future-ready tech services for modern living.',
    icon: <Cpu className="size-7" />,
    gradient: 'from-cyan-600 to-cyan-800',
    border: 'border-cyan-400/30',
    glow: 'rgba(6,182,212,0.2)',
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
  { value: '25K+', label: 'Verified Experts', icon: <Users className="size-5" /> },
  { value: '150+', label: 'Service Classes', icon: <Wrench className="size-5" /> },
  { value: '4.9★', label: 'Satisfaction Rate', icon: <Star className="size-5" /> },
  { value: '<15min', label: 'Dispatch Latency', icon: <Clock className="size-5" /> },
];

export default function ServicesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    services: cat.services.filter(s =>
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.services.length > 0);

  const popularServices = CATEGORIES.flatMap(cat =>
    cat.services.filter(s => s.popular).map(s => ({ ...s, categoryTitle: cat.title, gradient: cat.gradient }))
  );

  return (
    <div className="min-h-screen font-sans selection:bg-cyan-500/30">
      <Navbar />

      <section ref={heroRef} className="relative pt-40 pb-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto relative z-10"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/40 backdrop-blur-2xl border border-white/60 text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-xl animate-float">
            <Globe2 className="size-4 text-cyan-600" />
            <span>Premium Logistics Grid</span>
            <Sparkles className="size-4 text-cyan-500 animate-pulse" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-8 text-slate-950 uppercase italic">
            Operational <br/> <span className="text-white [text-shadow:0_0_60px_rgba(255,255,255,1)]">Excellence.</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 font-bold max-w-3xl mx-auto leading-relaxed uppercase tracking-tight mb-12">
            A comprehensive terminal for every maintenance requirement. 
            From smart ecosystems to industrial diagnostics — unified under one professional standard.
          </p>

          <div className="relative max-w-2xl mx-auto group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-slate-400 group-focus-within:text-cyan-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Query Service Protocol..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] pl-16 pr-6 py-6 text-slate-950 font-bold text-lg focus:outline-none focus:bg-white/60 focus:border-cyan-500/30 transition-all shadow-2xl"
            />
          </div>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 text-center hover:bg-white/60 transition-all shadow-xl"
            >
              <div className="flex items-center justify-center gap-2 text-cyan-600 mb-4 bg-white/50 size-12 mx-auto rounded-2xl border border-white/40 shadow-inner">
                {stat.icon}
              </div>
              <h3 className="text-3xl font-black text-slate-950 tracking-tighter">{stat.value}</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-40">
        <div className="flex flex-wrap gap-4 justify-center mb-20">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
              activeCategory === null 
                ? "bg-slate-950 text-white shadow-2xl scale-105" 
                : "bg-white/40 border border-white/60 text-slate-600 hover:bg-white/60"
            )}
          >
            All Services
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3",
                activeCategory === cat.id 
                  ? "bg-slate-950 text-white shadow-2xl scale-105" 
                  : "bg-white/40 border border-white/60 text-slate-600 hover:bg-white/60"
              )}
            >
              {cat.icon}
              {cat.title}
            </button>
          ))}
        </div>

        <div className="space-y-32">
          <AnimatePresence mode="popLayout">
            {filteredCategories
              .filter(cat => !activeCategory || cat.id === activeCategory)
              .map((category, catIdx) => (
                <CategorySection key={category.id} category={category} index={catIdx} />
              ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function CategorySection({ category, index }: { category: ServiceCategory; index: number }) {
  const router = useRouter();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.1 }}
    >
      <div className="flex items-center gap-6 mb-12 border-l-8 border-slate-950 pl-8">
        <div className={cn("p-6 rounded-[2rem] bg-gradient-to-br text-white shadow-2xl", category.gradient)}>
          {category.icon}
        </div>
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-950 uppercase tracking-tighter italic">{category.title}</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mt-2">{category.subtitle}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {category.services.map((service, i) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.05 + 0.3 }}
            whileHover={{ y: -8, scale: 1.02 }}
            onClick={() => router.push('/auth/login?role=customer')}
            className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] p-8 cursor-pointer hover:bg-white/70 transition-all shadow-xl group"
          >
            <div className="flex items-start gap-5">
              <div className={cn("p-4 rounded-2xl bg-gradient-to-br text-white shadow-xl transition-transform group-hover:rotate-6", category.gradient)}>
                {service.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-slate-950 uppercase tracking-tighter mb-2 italic group-hover:text-cyan-600 transition-colors">{service.name}</h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase tracking-wide">{service.desc}</p>
                {service.popular && (
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 text-[9px] font-black uppercase tracking-widest">
                    <Sparkles className="size-3" /> Popular
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
