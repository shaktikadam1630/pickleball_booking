/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'Segoe UI', 'sans-serif'],
        display: ['Sora', 'Trebuchet MS', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#effaf5',
          100: '#d7f2e4',
          200: '#b2e6cc',
          500: '#119a63',
          600: '#0c7d50',
          700: '#0b6441'
        },
        ink: {
          900: '#1b2b34',
          700: '#304554'
        }
      },
      boxShadow: {
        card: '0 12px 35px rgba(9, 30, 66, 0.12)'
      }
    }
  },
  plugins: []
};
