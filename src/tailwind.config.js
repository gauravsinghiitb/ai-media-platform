/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
      extend: {
        colors: {
          'futuristic-blue': '#00f0ff',
          'futuristic-purple': '#8b00ff',
          'dark-bg': '#1a1a2e',
        },
      },
    },
    plugins: [],
  };