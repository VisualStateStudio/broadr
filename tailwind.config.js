/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          base:       '#F5F5F5',
          surface:    '#FFFFFF',
          subtle:     '#F0F0F0',
          wash:       '#FAFAFA',
        },
        accent: {
          primary:      '#FF5C00',
          'primary-lt': '#FFF0E8',
          'primary-dim':'#FFAD8A',
          'primary-hover': 'rgba(255,92,0,0.18)',
          amber:        '#D97706',
          'amber-lt':   '#FEF3C7',
          green:        '#10B981',
          'green-lt':   '#D1FAE5',
          red:          '#DC2626',
          'red-lt':     '#FEE2E2',
          purple:       '#8B5CF6',
          sky:          '#0EA5E9',
        },
        neutral: {
          900: '#0A0A0A',
          700: '#374151',
          500: '#6B7280',
          400: '#9CA3AF',
          200: '#E5E7EB',
          150: '#EBEBEB',
          100: '#F3F4F6',
          50:  '#F9FAFB',
        },
        chart: {
          blue:  '#3B82F6',
          sky:   '#0EA5E9',
          teal:  '#14B8A6',
          amber: '#F59E0B',
          slate: '#94A3B8',
        },
      },
    },
  },
  plugins: [],
}
