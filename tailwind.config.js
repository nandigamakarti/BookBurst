/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fff9c4",
          100: "#fff59d",
          200: "#fff176",
          300: "#ffee58",
          400: "#ffca28",
          500: "#ffc107",
          600: "#ffb300",
          700: "#ffa000",
          800: "#ff8f00",
          900: "#ff6f00",
        },
        cream: {
          50: "#fffde7",
          100: "#fff8e1",
          200: "#fff3bf",
          300: "#ffe082",
          400: "#ffd54f",
          500: "#ffa726",
          600: "#ff9800",
          700: "#fb8c00",
          800: "#f57c00",
          900: "#ef6c00",
        },
        accent: {
          50: "#e8f5e9",
          100: "#c8e6c9",
          200: "#a5d6a7",
          300: "#81c784",
          400: "#66bb6a",
          500: "#4caf50",
          600: "#43a047",
          700: "#388e3c",
          800: "#2e7d32",
          900: "#1b5e20",
        },
      },
    },
  },
  plugins: [],
}
