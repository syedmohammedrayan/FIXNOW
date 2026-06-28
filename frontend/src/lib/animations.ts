// ═══════════════════════════════════════════════════════════
// FixNow Animation Primitives — Framer Motion presets
// All animations respect prefers-reduced-motion
// ═══════════════════════════════════════════════════════════

import { Variants } from 'framer-motion';

// ─── Page Transitions ───
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

// ─── Fade In ───
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// ─── Slide Up ───
export const slideUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: 16, transition: { duration: 0.3 } },
};

// ─── Scale In ───
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
};

// ─── Stagger Container (for lists/grids) ───
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

// ─── Stagger Item ───
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Card Hover ───
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.01, y: -2, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

// ─── Modal / Dialog ───
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.97, y: 10, transition: { duration: 0.2 } },
};

// ─── AI Thinking Dots ───
export const aiThinkingDot = (delay: number): Variants => ({
  initial: { opacity: 0.3, scale: 0.8 },
  animate: {
    opacity: [0.3, 1, 0.3],
    scale: [0.8, 1, 0.8],
    transition: {
      duration: 1.4,
      ease: 'easeInOut',
      repeat: Infinity,
      delay,
    },
  },
});

// ─── Progress Bar ───
export const progressBar = (percent: number): Variants => ({
  initial: { width: '0%' },
  animate: { width: `${percent}%`, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
});

// ─── Gauge (SVG stroke animation) ───
export const gaugeStroke = (dashOffset: number): Variants => ({
  initial: { strokeDashoffset: 283 }, // Full circle circumference (2 * PI * 45)
  animate: {
    strokeDashoffset: dashOffset,
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
  },
});

// ─── Notification Badge Pop ───
export const badgePop: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 500, damping: 25 },
  },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.15 } },
};
