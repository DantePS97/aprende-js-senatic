import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta principal SENATIC EdTech
        primary: {
          // 400/500/600 driven by CSS custom properties — accent is switchable at runtime
          DEFAULT: 'rgb(var(--color-primary-500) / <alpha-value>)',
          50:  '#EEF2FF',  // fixed light tint — used in admin form sections
          100: '#E0E7FF',  // fixed light tint
          200: '#C7D2FE',  // fixed light tint — border on secondary admin buttons
          300: 'rgb(var(--color-primary-400) / 0.6)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: '#4338CA',  // fixed dark shade — hover on primary buttons
        },
        success: {
          DEFAULT: '#10B981', // Emerald
          400: '#34D399',
          500: '#10B981',
        },
        xp: {
          DEFAULT: '#F59E0B', // Amber — para XP y racha
          400: '#FBBF24',
          500: '#F59E0B',
        },
        surface: {
          // 800 and 900 are driven by CSS custom properties so they respond
          // to theme switching (light/dark) without touching component classes.
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          50: '#F8FAFC',
          100: '#F1F5F9',
          800: 'rgb(var(--surface-800) / <alpha-value>)',
          900: 'rgb(var(--surface-900) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'xp-fill': 'xpFill 0.8s ease-out forwards',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'fade-up': 'fadeUp 0.3s ease-out',
      },
      keyframes: {
        xpFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--xp-width)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
