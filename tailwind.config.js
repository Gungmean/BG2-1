/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        }
      },
      fontFamily: {
        sans: ['Paperlogy', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', 'sans-serif'],
        paperlogy: ['Paperlogy', '-apple-system', 'Segoe UI', 'Apple Color Emoji', 'Segoe UI Emoji', 'sans-serif'],
        nalsun: ['NalSun', 'Paperlogy', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
