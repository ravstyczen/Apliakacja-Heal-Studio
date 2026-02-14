/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        heal: {
          bg: '#FAF9F7',
          primary: '#2C3E2D',
          accent: '#B8A88A',
          light: '#E8E4DE',
          dark: '#1A1A1A',
          white: '#FFFFFF',
        },
        instructor: {
          agnieszka: '#D4A843',
          rafal: '#1A1A1A',
          ola: '#4A90D9',
          ania: '#D94A4A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
