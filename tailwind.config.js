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
          DEFAULT: '#7e79b8',
          50: '#f5f5fa',
          100: '#ebeaf5',
          200: '#d6d4eb',
          300: '#b8b5d9',
          400: '#9591c4',
          500: '#7e79b8',
          600: '#6b65a3',
          700: '#5a5488',
          800: '#4a4670',
          900: '#3e3b5c',
        },
        accent: {
          DEFAULT: '#e55fa2',
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#e55fa2',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        dark: {
          DEFAULT: '#333333',
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#333333',
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
