/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#080D19',
        surface: {
          DEFAULT: '#111827',
          light: '#1F2937',
          dark: '#0B1120',
          glass: 'rgba(17, 24, 39, 0.75)',
        },
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          glow: 'rgba(59, 130, 246, 0.35)',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          glow: 'rgba(139, 92, 246, 0.35)',
        },
        accent: {
          DEFAULT: '#06B6D4',
          hover: '#0891B2',
          glow: 'rgba(6, 182, 212, 0.35)',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        text: {
          DEFAULT: '#F8FAFC',
          muted: '#94A3B8',
          dim: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'nitro-glow': 'nitroGlow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        nitroGlow: {
          '0%': { boxShadow: '0 0 10px rgba(6, 182, 212, 0.4)' },
          '100%': { boxShadow: '0 0 25px rgba(6, 182, 212, 0.8), 0 0 40px rgba(59, 130, 246, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};
