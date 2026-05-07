/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: '#0f172a',
        board: '#1e293b',
        'board-hover': '#334155',
      },
    },
  },
  plugins: [],
};
