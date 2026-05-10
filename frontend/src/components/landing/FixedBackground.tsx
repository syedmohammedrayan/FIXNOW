'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function FixedBackground() {
  const { scrollYProgress } = useScroll();
  const glowIntensity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.5, 0.3]);
  const blurAmount = useTransform(scrollYProgress, [0, 0.5, 1], ["50px", "70px", "50px"]);

  return (
    <>
      <div className="bg-atmospheric" />
      <div className="orange-glow-panel" />
      <motion.div 
        style={{ 
          opacity: glowIntensity,
          filter: `blur(${blurAmount})`
        }}
        className="fixed inset-0 bg-orange-500/10 pointer-events-none z-[-1] bg-pulse-glow"
      />
      <div className="fixed inset-0 pointer-events-none z-[-1]">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full" />
      </div>
    </>
  );
}
