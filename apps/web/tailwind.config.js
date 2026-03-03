/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand guideline colors
        brand: {
          50: '#fff3ed',
          100: '#ffe4d3',
          200: '#ffc6a2',
          300: '#ffa066',
          400: '#ff772c',
          500: '#FF5B04', // AtSpaces Orange (brand guideline)
          600: '#ef4400',
          700: '#c62e02',
          800: '#a3250b',
          900: '#83210d',
        },
        dark: {
          950: 'rgb(var(--surface-950) / <alpha-value>)',
          900: 'rgb(var(--surface-900) / <alpha-value>)',
          850: 'rgb(var(--surface-850) / <alpha-value>)',
          800: 'rgb(var(--surface-800) / <alpha-value>)',
          700: 'rgb(var(--surface-700) / <alpha-value>)',
        },
        'bright-gray': '#E3EEEF',
        'brand-gray': {
          700: '#1F2122',
          500: '#4A4C4E',
          300: '#757779',
          200: '#9FA3A5',
          100: '#CACED0',
          50:  '#F3F6F8',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      boxShadow: {
        'apple': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'apple-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
        'apple-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
        'float': '0 30px 60px -12px rgba(0, 0, 0, 0.25)',
        'brand-glow': '0 0 20px rgba(255, 91, 4, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-hover': '0 16px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glass-brand': '0 8px 32px rgba(255, 91, 4, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      transitionTimingFunction: {
        'apple-ease': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
}
