/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        logic: {
          problem: '#ef4444',
          target: '#f97316',
          inputs: '#f59e0b',
          activities: '#22c55e',
          outputs: '#3b82f6',
          short: '#6366f1',
          long: '#a855f7',
          impact: '#ec4899'
        }
      }
    }
  },
  plugins: []
};
