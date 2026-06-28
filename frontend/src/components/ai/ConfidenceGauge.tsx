'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { gaugeStroke } from '@/lib/animations';

interface ConfidenceGaugeProps {
  value: number; // 0-100
  size?: number;
  label?: string;
}

export default function ConfidenceGauge({ value, size = 120, label = 'Confidence' }: ConfidenceGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedValue / 100) * circumference;

  const gaugeClass = clampedValue >= 80 ? 'gauge-high' : clampedValue >= 50 ? 'gauge-medium' : 'gauge-low';
  const glowColor = clampedValue >= 80 
    ? 'rgba(16, 185, 129, 0.3)' 
    : clampedValue >= 50 
      ? 'rgba(245, 158, 11, 0.3)' 
      : 'rgba(239, 68, 68, 0.3)';

  return (
    <div className="flex flex-col items-center gap-2" role="meter" aria-label={`${label}: ${clampedValue}%`} aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          className="transform -rotate-90"
          style={{ width: size, height: size, filter: `drop-shadow(0 0 8px ${glowColor})` }}
        >
          {/* Track */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            className="gauge-track"
            strokeWidth="6"
          />
          {/* Value arc */}
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none"
            className={gaugeClass}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            variants={gaugeStroke(dashOffset)}
            initial="initial"
            animate="animate"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-white font-black text-2xl tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {clampedValue}%
          </motion.span>
        </div>
      </div>
      <span className="text-overline text-white/40">{label}</span>
    </div>
  );
}
