/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rise: {
          green: '#009ca6',
          'green-mid': '#8dc8c7',
          'green-light': '#ebf5f0',
          red: '#e83c63',
          'red-mid': '#f5a9ab',
          'red-light': '#fde8df',
          yellow: '#ffe500',
          'yellow-mid': '#ffee8d',
          'yellow-light': '#fff7dd',
          purple: '#482d55',
          'dark-green': '#0e4e65',
          grey1: '#f0f0f0',
          grey2: '#c8c8c8',
          grey3: '#828282',
          grey4: '#555555'
        },
        logic: {
          problem: '#e83c63',
          target: '#482d55',
          inputs: '#009ca6',
          activities: '#0e4e65',
          outputs: '#009ca6',
          short: '#482d55',
          long: '#0e4e65',
          impact: '#e83c63'
        }
      }
    }
  },
  plugins: []
};
