import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        'grace-ink': '#0A0A0A',
        'grace-red': '#C8372D',
        'grace-mist': '#F7F7F7',
        'grace-stone': '#6B6B6B',
        'grace-border': '#E4E4E4',
        // Keep brand-green for backward compat with design studio phases (Module 1)
        brand: {
          green: '#0A0A0A',
          'green-light': '#222222',
          'green-dark': '#000000',
        },
      },
    },
  },
  plugins: [],
}
export default config
