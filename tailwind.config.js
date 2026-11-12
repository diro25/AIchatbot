/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './client/src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#101513',
        paper: '#f6f7f2',
        mint: '#9fe870',
        amber: '#f0b35b',
        steel: '#9aa59e',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        dock: '0 20px 60px rgba(10, 17, 14, 0.16)',
      },
    },
  },
  plugins: [],
};
