/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6', // AtSpaces primary teal/green
          900: '#134e4a',
        },
        dark: {
          900: '#0f172a',
          800: '#1e293b',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      }
    },
  },
  plugins: [],
}
