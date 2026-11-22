/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#070B1A',
          900: '#0A0F24',
          800: '#0E1533',
          700: '#151D45',
          600: '#1E2860',
        },
        accent: {
          violet: '#8B5CF6',
          purple: '#A855F7',
          blue: '#3B82F6',
        },
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(139, 92, 246, 0.45)',
        soft: '0 20px 60px -20px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)',
        'brand-radial':
          'radial-gradient(ellipse at top, rgba(139,92,246,0.18), transparent 60%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
