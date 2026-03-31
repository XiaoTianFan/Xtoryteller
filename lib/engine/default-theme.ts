import { ThemeConfig } from '@/lib/types/theme';

export const DEFAULT_THEME: ThemeConfig = {
  name: 'Default Narrative',
  fonts: {
    heading: {
      family: '"Playfair Display"',
      source: 'system',
      fallbacks: ['Georgia', '"Times New Roman"', 'serif']
    },
    body: {
      family: 'Inter',
      source: 'system',
      fallbacks: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif']
    },
    mono: {
      family: '"JetBrains Mono"',
      source: 'system',
      fallbacks: ['Consolas', 'monospace']
    }
  },
  colors: {
    background: '#f6f1e8',
    surface: '#fff9f0',
    panel: '#efe6d8',
    foreground: '#1d1b19',
    muted: '#60584f',
    border: '#d9ccb8',
    primary: '#8d4f2d',
    secondary: '#2a6c64',
    accent: '#d89a4f',
    success: '#2d7a54',
    warning: '#b86a20',
    error: '#a53a3a',
    overlay: 'rgba(255, 249, 240, 0.82)'
  },
  typography: {
    h1: 'clamp(2.8rem, 4vw, 5rem)',
    h2: 'clamp(2.2rem, 3vw, 3.6rem)',
    h3: 'clamp(1.6rem, 2.4vw, 2.4rem)',
    body: 'clamp(1rem, 1.2vw, 1.15rem)',
    small: 'clamp(0.82rem, 1vw, 0.95rem)',
    lead: 'clamp(1.15rem, 1.5vw, 1.4rem)',
    code: 'clamp(0.88rem, 1vw, 1rem)'
  },
  spacing: {
    page: 'clamp(1.4rem, 3vw, 3rem)',
    section: 'clamp(1.2rem, 2.4vw, 2rem)',
    gap: 'clamp(0.8rem, 1.4vw, 1.4rem)',
    cluster: 'clamp(1rem, 1.5vw, 1.5rem)'
  },
  radii: {
    small: '0.75rem',
    medium: '1.2rem',
    large: '1.8rem',
    pill: '999px'
  },
  shadows: {
    soft: '0 20px 60px rgba(54, 38, 23, 0.12)',
    strong: '0 24px 80px rgba(54, 38, 23, 0.18)'
  },
  borders: {
    subtle: '1px solid rgba(96, 88, 79, 0.18)',
    strong: '1px solid rgba(141, 79, 45, 0.28)'
  },
  motion: {
    fast: '180ms',
    normal: '360ms',
    slow: '700ms',
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
  }
};
