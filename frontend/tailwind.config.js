/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // FinSight Purple/Indigo Theme - Original
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1', // Main primary (Indigo)
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        secondary: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#8B5CF6', // Main secondary (Purple)
          700: '#7C3AED',
          800: '#6D28D9',
          900: '#5B21B6',
        },
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B', // Gold accent
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        success: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        danger: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        warning: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
        },
        info: {
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
        },
        // Dark mode foundation - Deep purple-tinted
        dark: {
          bg: '#0F0B1E',        // Deep purple background
          surface: '#1A1625',   // Purple-tinted surface
          card: '#221B2E',      // Card background
          border: '#2D2436',    // Border
          hover: '#342940',     // Hover state
        },
        // Text colors
        text: {
          primary: '#F9FAFB',
          secondary: '#9CA3AF',
          tertiary: '#6B7280',
          disabled: '#4B5563',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.2)',
        'glow-primary': '0 0 20px rgba(99, 102, 241, 0.4), 0 0 40px rgba(99, 102, 241, 0.2)',
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(99, 102, 241, 0.15)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.15)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.15)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.15)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.15)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'gradient-ai': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'gradient-finance': 'linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
        'gradient-premium': 'linear-gradient(135deg, #F59E0B 0%, #FB7185 50%, #8B5CF6 100%)',
        'gradient-bg': 'linear-gradient(180deg, #0F0B1E 0%, #1A1625 100%)',
        'gradient-hover': 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.4s ease',
        'slide-down': 'slideDown 0.4s ease',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'bounce-subtle': 'bounceSubtle 0.5s ease',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideDown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.6)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        bounceSubtle: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-5px)',
          },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
  safelist: [
    // Safelist dynamic classes
    'bg-primary-100',
    'text-primary-600',
    'bg-green-100',
    'bg-green-500',
    'text-green-600',
    'bg-red-100',
    'bg-red-500',
    'text-red-600',
    'bg-blue-100',
    'text-blue-600',
    'bg-amber-500',
    'bg-purple-100',
    'text-purple-600',
  ],
}
