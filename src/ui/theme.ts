/**
 * AI Promptbook – Design Tokens & Theme
 *
 * Dark-first palette with blue/green accents. Every visual primitive
 * references these tokens so the look-and-feel can be changed in one place.
 */

export const colors = {
  // Backgrounds
  bg: {
    primary: '#0f1117',
    secondary: '#161922',
    tertiary: '#1c1f2e',
    surface: '#232738',
    elevated: '#2a2e42',
    hover: '#323750',
  },

  // Accents
  accent: {
    blue: '#3b82f6',
    blueHover: '#2563eb',
    green: '#22c55e',
    greenHover: '#16a34a',
    purple: '#a855f7',
    amber: '#f59e0b',
    red: '#ef4444',
  },

  // Text
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    muted: '#64748b',
    inverse: '#0f172a',
  },

  // Borders
  border: {
    subtle: '#2a2e42',
    default: '#334155',
    strong: '#475569',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
} as const;

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const font = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  size: {
    xs: '0.75rem',
    sm: '0.8125rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
  },
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,.3)',
  md: '0 4px 12px rgba(0,0,0,.4)',
  lg: '0 8px 24px rgba(0,0,0,.5)',
  glow: (color: string) => `0 0 20px ${color}33`,
} as const;

export const transition = {
  fast: '120ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
} as const;
