import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#184D3E',
          'green-light': '#1a5c4a',
          'green-dark': '#0f2e25',
        },
        dark: {
          900: '#0d0d0d',
          800: '#141414',
          700: '#1a1a1a',
          600: '#212121',
          500: '#2a2a2a',
          400: '#333333',
          300: '#444444',
        }
      }
    },
  },
  plugins: [],
}
export default config
