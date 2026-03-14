/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        surface: '#020617',
        neonBlue: '#22d3ee',
        neonGreen: '#22c55e',
        neonYellow: '#eab308',
        neonRed: '#ef4444',
        textPrimary: '#e5e7eb',
        textSecondary: '#9ca3af',
      },
    },
  },
  plugins: [],
};

