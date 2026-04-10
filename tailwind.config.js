/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        brand: {
          green:  '#00e676',
          yellow: '#ffd600',
          red:    '#ff1744',
          blue:   '#2979ff',
          purple: '#818cf8',
          pink:   '#f472b6',
        },
        surface: {
          DEFAULT: '#141414',
          2: '#1a1a1a',
          3: '#242424',
        },
      },
    },
  },
  plugins: [],
}
