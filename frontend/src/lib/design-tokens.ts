// ═══════════════════════════════════════════════════════════
// FixNow Design Tokens — Single source of truth for the UI
// ═══════════════════════════════════════════════════════════

export const colors = {
  // Core palette
  slate: {
    950: '#020617',
    900: '#0f172a',
    800: '#1e293b',
    700: '#334155',
    600: '#475569',
    500: '#64748b',
    400: '#94a3b8',
    300: '#cbd5e1',
    200: '#e2e8f0',
    100: '#f1f5f9',
    50: '#f8fafc',
  },
  // Semantic colors
  success: { base: '#10b981', light: '#34d399', glow: 'rgba(16, 185, 129, 0.3)' },
  warning: { base: '#f59e0b', light: '#fbbf24', glow: 'rgba(245, 158, 11, 0.3)' },
  error: { base: '#ef4444', light: '#f87171', glow: 'rgba(239, 68, 68, 0.3)' },
  info: { base: '#3b82f6', light: '#60a5fa', glow: 'rgba(59, 130, 246, 0.3)' },
  // AI accent
  ai: { base: '#8b5cf6', light: '#a78bfa', glow: 'rgba(139, 92, 246, 0.25)' },
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
} as const;

export const typography = {
  display: { size: 'clamp(2rem, 5vw, 3.5rem)', weight: '900', tracking: '-0.04em', lineHeight: '1.1' },
  headline: { size: 'clamp(1.25rem, 3vw, 2rem)', weight: '800', tracking: '-0.03em', lineHeight: '1.2' },
  title: { size: 'clamp(1rem, 2vw, 1.25rem)', weight: '700', tracking: '-0.02em', lineHeight: '1.3' },
  body: { size: '0.875rem', weight: '500', tracking: '0', lineHeight: '1.6' },
  caption: { size: '0.75rem', weight: '600', tracking: '0.02em', lineHeight: '1.5' },
  overline: { size: '0.625rem', weight: '800', tracking: '0.2em', lineHeight: '1.4' },
} as const;

export const animation = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  spring: { type: 'spring', stiffness: 400, damping: 30 },
  springGentle: { type: 'spring', stiffness: 260, damping: 25 },
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;

export const radius = {
  sm: '0.75rem',    // 12px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '2.5rem',  // 40px
  full: '9999px',
} as const;

export const shadows = {
  card: '0 8px 32px rgba(0, 0, 0, 0.2)',
  cardElevated: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255,255,255,0.05)',
  cardHover: '0 24px 48px -12px rgba(0, 0, 0, 0.4)',
  glow: (color: string) => `0 0 20px ${color}, 0 0 60px ${color}`,
  insetBorder: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
} as const;

export const glass = {
  light: { bg: 'rgba(255, 255, 255, 0.04)', blur: '20px', border: 'rgba(255, 255, 255, 0.08)' },
  medium: { bg: 'rgba(255, 255, 255, 0.06)', blur: '32px', border: 'rgba(255, 255, 255, 0.12)' },
  strong: { bg: 'rgba(255, 255, 255, 0.10)', blur: '40px', border: 'rgba(255, 255, 255, 0.18)' },
} as const;
