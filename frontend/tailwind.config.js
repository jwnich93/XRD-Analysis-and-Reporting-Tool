/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F5EFE6",
          50: "#FDFAF6",
          100: "#F5EFE6",
          200: "#EBD9C4",
          300: "#E8DFD0",
        },
        navy: {
          DEFAULT: "#0D1B3E",
          light: "#162347",
          700: "#0A1530",
        },
        accent: {
          DEFAULT: "#1D4ED8",
          light: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
