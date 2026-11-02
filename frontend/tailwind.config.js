/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F1B2F',
          DEFAULT: '#172B4D',
          light: '#243B66',
        },
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          DEFAULT: '#2563EB',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          bg: '#F5F7FA',
        },
        charcoal: {
          DEFAULT: '#1F2937',
          light: '#4B5563',
          lighter: '#6B7280',
        },
        status: {
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
          info: '#2563EB',
        }
      },
    },
  },
  plugins: [],
}
