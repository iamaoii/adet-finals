/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f2f6f5',
          100: '#e1ecea',
          200: '#c3dbd8',
          300: '#9bc1bd',
          400: '#6a9d97',
          500: '#2E4F4F', // Dark Olive Green theme
          600: '#243f3f', // Hover Dark Olive Green
          700: '#1c3131',
          800: '#152424',
          900: '#0e1818',
        },
        accent: {
          50:  '#eaf9f9',
          100: '#cbefef',
          200: '#9ce0e0',
          300: '#5ecaca',
          400: '#0E8388', // Mint Green / Teal accents
          500: '#0c6f73',
          600: '#095558',
          700: '#06393b',
          800: '#042627',
          900: '#021415',
        },
        surface: {
          DEFAULT: '#F5F5F5', // Soft gray-workspace background from Figma
          card:    '#FFFFFF',
          border:  '#E5E5E5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,.07), 0 1px 2px -1px rgba(0,0,0,.07)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,.07), 0 2px 4px -2px rgba(0,0,0,.07)',
      },
    },
  },
  plugins: [],
}
