'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md flex flex-col items-center"
      >
        <Logo className="mb-12" />
        <div className="text-8xl font-black glow-heading-gradient mb-4 animate-float">404</div>
        <h2 className="text-2xl font-bold text-slate-300 mb-3">Protocol Interrupted</h2>
        <p className="text-slate-400 mb-8">The requested node is currently inaccessible or has been purged from the network.</p>
        <Link href="/" className="px-10 py-4 rounded-[1.5rem] bg-white text-slate-950 font-black uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:shadow-[0_0_35px_rgba(255,255,255,0.5)] active:scale-95">
          Return to Base
        </Link>
      </motion.div>
    </div>
  );
}
