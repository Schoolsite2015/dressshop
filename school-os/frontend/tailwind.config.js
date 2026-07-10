/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // S.N Public School brand palette: deep indigo (uniform/authority)
        // + marigold (Varanasi festival gold) as the single accent.
        ink: "#1C2340",
        indigo: {
          50: "#EEF0F9", 100: "#D6DAF0", 500: "#2C3670", 600: "#232B5C", 700: "#1C2340",
        },
        marigold: {
          400: "#F5A623", 500: "#E8940F", 600: "#C97A08",
        },
        paper: "#FAF8F3",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
