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
        background: '#070A12', // Deep Midnight
        surface: {
          DEFAULT: '#101625', // Elevated Surface
          light: '#151D2D',   // Secondary Surface
          dark: '#05070E',
          glass: 'rgba(16, 22, 37, 0.75)',
        },
        primary: {
          DEFAULT: '#3B82F6', // Electric Blue
          hover: '#2563EB',
          glow: 'rgba(59, 130, 246, 0.35)',
        },
        secondary: {
          DEFAULT: '#8B5CF6', // Violet
          hover: '#7C3AED',
          glow: 'rgba(139, 92, 246, 0.35)',
        },
        accent: {
          DEFAULT: '#55E6F2', // Ice Cyan
          hover: '#22D3EE',
          glow: 'rgba(85, 230, 242, 0.35)',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        text: {
          DEFAULT: '#F5F7FC',
          muted: '#9BA8BC',
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
          '0%': { boxShadow: '0 0 10px rgba(85, 230, 242, 0.4)' },
          '100%': { boxShadow: '0 0 25px rgba(85, 230, 242, 0.8), 0 0 40px rgba(59, 130, 246, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};
