/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      'xs': '400px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          50:  '#eff4ff',
          100: '#dce7fe',
          200: '#c1d3fc',
          300: '#96b6f9',
          400: '#6590f4',
          500: '#4070ee',
          600: '#2864e8', // LISAN Blue
          700: '#1e4dd6',
          800: '#1d3fae',
          900: '#1d3589',
        },
        warm: {
          50:  '#fffbf5',
          100: '#fff3e0',
          200: '#ffe0b2',
          300: '#ffcc80',
          400: '#ffa726',
          500: '#ff9800',
        },
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        soft: '0 2px 8px 0 rgb(0 0 0 / 0.08)',
      },
      animation: {
        // Entrance utilities — longer, smoother
        'fade-in':  'fadeIn 0.65s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up': 'slideUp 0.75s cubic-bezier(0.16,1,0.3,1) both',
        // Continuous — slower cycles feel more premium
        'bounce-gentle': 'bounceGentle 3s ease-in-out infinite',
        'pulse-soft':    'pulseSoft 3s ease-in-out infinite',
        // Float variants — independent speeds, never synced
        'float-slow':   'floatSlow 7s ease-in-out infinite',    // hero dashboard
        'float-medium': 'floatMedium 8.5s ease-in-out infinite',// achievement cards
        'float-fast':   'floatFast 6.5s ease-in-out infinite',  // small objects
        // Waveform — slightly slower so bars feel like audio, not ticker
        'waveform': 'waveform 1.6s ease-in-out infinite',
        // SVG check draw — deliberate, not instant
        'draw-check': 'drawCheck 0.55s cubic-bezier(0,0.55,0.45,1) forwards',
        // Count up — matches CountUp component timing
        'count-up': 'countUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        // Shimmer — slow enough to read as a quality detail
        'shimmer': 'shimmer 2.8s linear infinite',
        // Pulse ring — slow, calm breathing, not alarm-like
        'pulse-ring': 'pulseRing 2.8s ease-out infinite',
        // Typing dots — unhurried
        'typing-dot': 'typingDot 1.8s ease-in-out infinite',
        // Progress fill / score ring — driven by framer-motion inline, kept for fallback
        'progress-fill': 'progressFill 1.1s cubic-bezier(0.16,1,0.3,1) forwards',
        'score-ring':    'scoreRing 1.6s cubic-bezier(0.16,1,0.3,1) forwards',
        // Blob morph — very slow, barely noticeable
        'blob': 'blob 12s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },  // was 16px — matches fadeUp variant
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-3px)' },   // 3px — barely perceptible
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.75' },                 // softer fade
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },   // was -10px
        },
        floatMedium: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-5px)' },   // was -8px
        },
        floatFast: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-4px)' },   // was -6px
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.35)' },  // narrower range — calmer waveform
          '50%':      { transform: 'scaleY(1)' },
        },
        drawCheck: {
          from: { 'stroke-dashoffset': '24' },
          to: { 'stroke-dashoffset': '0' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        pulseRing: {
          '0%':   { transform: 'scale(1)',   opacity: '0.7' },
          '100%': { transform: 'scale(1.55)', opacity: '0' }, // smaller expand — less alarming
        },
        typingDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-6px)', opacity: '1' },
        },
        progressFill: {
          from: { width: '0%' },
          to: { width: 'var(--progress-width)' },
        },
        scoreRing: {
          from: { 'stroke-dashoffset': '283' },
          to: { 'stroke-dashoffset': 'var(--score-offset)' },
        },
        blob: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
      },
    },
  },
  plugins: [],
}
