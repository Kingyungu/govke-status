/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        govke: {
          green: '#006B3C',
          'green-dark': '#004D2A',
          'green-light': '#E8F5EE',
          'green-mid': '#A7D3BB',
          black: '#0B0C0C',
          'grey-1': '#F3F2F1',
          'grey-2': '#B1B4B6',
          'grey-3': '#505A5F',
          'grey-4': '#3D4348',
          border: '#B1B4B6',
          focus: '#FFDD00',
        },
        status: {
          up: '#006B3C',
          'up-bg': '#E8F5EE',
          'up-border': '#A7D3BB',
          degraded: '#B45309',
          'degraded-bg': '#FFFBEB',
          'degraded-border': '#FDE68A',
          down: '#991B1B',
          'down-bg': '#FEF2F2',
          'down-border': '#FECACA',
        },
      },
      fontFamily: {
        sans: [
          'Noto Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      backgroundColor: {
        page: '#F3F2F1',
      },
    },
  },
  plugins: [],
}
