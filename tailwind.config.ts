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
        },
        sand: {
          DEFAULT: '#F5F0E4', // Warm paper — hero & editorial bands
          dark: '#E5E2D9',    // Hairline borders on warm backgrounds
        },
        mist: '#EAF2ED',      // Palest sage — chips, hovers, fills
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
        // Tailwind v4 named the smallest steps xs/2xs; the codebase already uses
        // those names, so define them here rather than rewriting every call site.
        'xs': '0 1px 2px 0 rgba(17, 24, 39, 0.05)',
        '2xs': '0 1px 1px 0 rgba(17, 24, 39, 0.04)',
      },
      blur: {
        xs: '2px',
      },
      backdropBlur: {
        xs: '2px',
      },
      scale: {
        '108': '1.08',
      },
      spacing: {
        '5.5': '1.375rem',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      animation: {
        'hero-fade-up': 'heroFadeUp 700ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'pop-in': 'luxePopIn 180ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
        'marquee-slow': 'marquee 50s linear infinite',
      },
      keyframes: {
        heroFadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)', filter: 'blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        luxePopIn: {
          '0%': { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
