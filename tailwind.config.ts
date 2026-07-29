import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FDFBF7', // Warm Ivory
        card: '#FFFFFF',       // Porcelain White
        border: '#E5E7EB',
        primary: {
          DEFAULT: '#2E5A44',  // Forest Sage
          hover: '#244736',
          light: '#EAF2ED',
        },
        obsidian: {
          DEFAULT: '#111827',  // Deep Obsidian
          muted: '#4B5563',
          light: '#6B7280',
        },
        gold: {
          DEFAULT: '#D4AF37',  // Luxe Gold Accent
          muted: '#B89628',
        },
        ivory: {
          DEFAULT: '#FDFBF7',
          dark: '#F7F3EB',
        },
        sage: {
          50: '#F2F7F4',
          100: '#E2EFE7',
          200: '#C6DFD1',
          500: '#2E5A44',
          700: '#1F3F30',
        }
      },
      fontFamily: {
        serif: ['var(--font-instrument-serif)', 'Instrument Serif', 'Georgia', 'serif'],
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['var(--font-instrument-serif)', 'Instrument Serif', 'Georgia', 'serif'],
        body: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'luxe-sm': '0 2px 8px -2px rgba(17, 24, 39, 0.05)',
        'luxe': '0 8px 30px -4px rgba(17, 24, 39, 0.08)',
        'luxe-lg': '0 16px 40px -6px rgba(17, 24, 39, 0.12)',
      },
      animation: {
        'hero-fade-up': 'heroFadeUp 700ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
      },
      keyframes: {
        heroFadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)', filter: 'blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
