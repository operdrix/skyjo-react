/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        kalam: ['Kalam', 'sans-serif'],
        courgette: ['Courgette', 'cursive'],
      },
      colors: {
        'card-negative': '#5992e7', // Dark Blue
        'card-zero': '#a0c4ff', // Light Blue
        'card-green': '#7ace7a', // Green
        'card-yellow': '#f3e948', // Yellow
        'card-red': '#f56e6e', // Red
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["light", "dark"],
  }
}