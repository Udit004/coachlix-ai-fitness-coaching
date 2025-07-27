/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // Add explicit paths to ensure all files are scanned
    './**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // This is correct
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [],
  // Add safelist for dark mode classes to ensure they're generated
  safelist: [
    'dark',
    'light',
    // Common dark mode classes
    'dark:bg-gray-800',
    'dark:bg-gray-900',
    'dark:text-white',
    'dark:text-gray-300',
    'dark:border-gray-700',
    'dark:border-gray-800',
    'dark:hover:bg-gray-700',
    'dark:hover:text-blue-400',
  ]
}