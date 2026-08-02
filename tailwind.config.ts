/** @type {import('tailwindcss').Config} */
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
        tryonity: {
          bg:            '#0f0d0e',
          surface:       '#181517',
          surfaceBorder: 'rgba(224, 122, 95, 0.25)',
          lightBg:       '#0f0d0e',
          text:          '#fdfbf7',
          muted:         '#a8a29e',
          accent:        '#e07a5f',
          'accent-hover':'#f4a261',
          gold:          '#e07a5f',
        },
        luxury: {
          obsidian:  '#0f0d0e',
          charcoal:  '#181517',
          elevated:  '#201c1e',
          copper:    '#e07a5f',
          amber:     '#f4a261',
          gold:      '#e07a5f',
          goldLight: '#f4a261',
          linen:     '#fdfbf7',
          cream:     '#fdfbf7',
          muted:     '#a8a29e',
          subtle:    '#2c2729',
          ring:      'rgba(224,122,95,0.30)',
          ringHover: 'rgba(244,162,97,0.55)',
          hairline:  'rgba(224,122,95,0.18)',
        },
        apple: {
          bg:          '#0f0d0e',
          card:        '#181517',
          lightBg:     '#0f0d0e',
          lightCard:   '#181517',
          blue:        '#e07a5f',
          blueHover:   '#f4a261',
          cyan:        '#f4a261',
          gray:        '#a8a29e',
          grayLight:   '#262225',
          border:      'rgba(224, 122, 95, 0.25)',
          lightBorder: 'rgba(224, 122, 95, 0.2)',
        },
      },
      fontFamily: {
        sans:  ['var(--font-inter)',   '-apple-system', 'system-ui', 'sans-serif'],
        serif: ['var(--font-cinzel)',  'Georgia', 'serif'],
        mono:  ['"JetBrains Mono"',   'monospace'],
      },
      borderRadius: {
        luxury:  '0.875rem',
        card:    '1.25rem',
        panel:   '1.625rem',
        pill:    '9999px',
      },
      borderWidth: {
        hairline: '0.5px',
      },
      boxShadow: {
        'silk-card':   '0 20px 50px rgba(0, 0, 0, 0.8)',
        'silk-hover':  '0 25px 60px rgba(224, 122, 95, 0.25)',
        'gold-glow':   '0 0 35px rgba(224, 122, 95, 0.35)',
        'gold-ring':   '0 0 0 1px rgba(224,122,95,0.30)',
        'gold-focus':  '0 0 0 2px rgba(244,162,97,0.55)',
        'luxury-soft': '0 12px 36px rgba(0, 0, 0, 0.6)',
        'luxury-gold': '0 4px 20px rgba(224, 122, 95, 0.30)',
        'card-glass':  '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
        'nav-glass':   '0 8px 40px rgba(0,0,0,0.70), 0 0 0 1px rgba(224,122,95,0.15)',
        'stat-card':   '0 4px 24px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.035)',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0', transform: 'scale(0.98)' },       '100%': { opacity: '1', transform: 'scale(1)' } },
        slideUp:   { '0%': { transform: 'translateY(24px)', opacity: '0' },  '100%': { transform: 'translateY(0)', opacity: '1' } },
        marquee:   { '0%': { transform: 'translateX(0%)' },                  '100%': { transform: 'translateX(-50%)' } },
        glowPulse: { '0%,100%': { boxShadow: '0 0 18px rgba(224,122,95,0.20)' }, '50%': { boxShadow: '0 0 36px rgba(224,122,95,0.45)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% center' },           '100%': { backgroundPosition: '200% center' } },
        glowIn:    { '0%': { opacity: '0', boxShadow: '0 0 0 rgba(224,122,95,0)' }, '100%': { opacity: '1', boxShadow: '0 0 30px rgba(224,122,95,0.3)' } },
      },
      animation: {
        'fade-in':    'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up':   'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'marquee':    'marquee 25s linear infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'glow-in':    'glowIn 0.6s ease forwards',
      },
    },
  },
  plugins: [],
};

export default config;
