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
          base:       '#F5F6F8',
          surface:    '#FFFFFF',
          subtle:     '#EDEEF1',
          wash:       '#F0F2F5',
        },
        accent: {
          primary:      '#2563EB',
          'primary-lt': '#DBEAFE',
          'primary-dim':'#93C5FD',
          amber:        '#D97706',
          'amber-lt':   '#FEF3C7',
          green:        '#059669',
          'green-lt':   '#D1FAE5',
          red:          '#DC2626',
          'red-lt':     '#FEE2E2',
        },
        neutral: {
          900: '#0F1117',
          700: '#374151',
          500: '#6B7280',
          400: '#9CA3AF',
          200: '#E5E7EB',
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
