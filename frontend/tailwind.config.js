/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // ✅ FIX: prevent Tailwind from purging dynamic classes
  safelist: [
    'bg-red-600',
    'bg-amber-600',
    'bg-gold',
    'bg-seafoam',
    'text-red-600',
    'text-amber-600',
    'text-gold',
    'text-seafoam',
  ],

  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          50: '#E8EDF2',
          100: '#C5D2DE',
          200: '#8AA5BE',
          300: '#4F789F',
          400: '#2A4D6E',
          500: '#0D1B2A',
          600: '#0A1620',
          700: '#071117',
          800: '#040B0F',
          900: '#020507',
        },
        ocean: {
          DEFAULT: '#1B6CA8',
          50: '#E8F3FB',
          100: '#C0DCF3',
          200: '#80BAE8',
          300: '#4097DC',
          400: '#1B6CA8',
          500: '#155686',
          600: '#104064',
          700: '#0A2B43',
          800: '#051521',
          900: '#030B11',
        },
        seafoam: {
          DEFAULT: '#4ECDC4',
          50: '#EDFAF9',
          100: '#D5F4F2',
          200: '#ABE9E4',
          300: '#81DED7',
          400: '#4ECDC4',
          500: '#2EB5AC',
          600: '#228D86',
          700: '#176560',
          800: '#0B3D3A',
          900: '#061F1E',
        },
        sand: {
          DEFAULT: '#F5F0E8',
          50: '#FDFCFA',
          100: '#FAF8F4',
          200: '#F5F0E8',
          300: '#EDE5D3',
          400: '#DCCFB5',
          500: '#CBB997',
          600: '#B09B71',
          700: '#8A7754',
          800: '#635538',
          900: '#3C331B',
        },
        gold: {
          DEFAULT: '#C9A84C',
          50: '#FBF6E9',
          100: '#F5E9C5',
          200: '#EDD38B',
          300: '#E4BC51',
          400: '#C9A84C',
          500: '#A6893D',
          600: '#836A2E',
          700: '#5F4B1F',
          800: '#3C2D0F',
          900: '#1E1508',
        },
      },

      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      backgroundImage: {
        'wave-pattern':
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='20'%3E%3Cpath d='M0 10 Q25 0 50 10 Q75 20 100 10' fill='none' stroke='%234ECDC4' stroke-opacity='0.15' stroke-width='2'/%3E%3C/svg%3E\")",
        'ocean-gradient':
          'linear-gradient(135deg, #0D1B2A 0%, #1B3A5C 50%, #1B6CA8 100%)',
        'card-gradient':
          'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
      },

      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        wave: 'wave 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },

      boxShadow: {
        card: '0 4px 24px rgba(13, 27, 42, 0.12)',
        'card-hover': '0 8px 40px rgba(13, 27, 42, 0.2)',
        glow: '0 0 24px rgba(78, 205, 196, 0.3)',
      },
    },
  },

  plugins: [],
};