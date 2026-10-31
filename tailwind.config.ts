import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "rgb(var(--cream) / <alpha-value>)",
        espresso: "rgb(var(--espresso) / <alpha-value>)",
        caramel: "rgb(var(--caramel) / <alpha-value>)",
        matcha: "rgb(var(--matcha) / <alpha-value>)",
        milk: "rgb(var(--milk) / <alpha-value>)",
        berry: "rgb(var(--berry) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Inter Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Fraunces Variable"', "ui-serif", "Georgia", "serif"],
      },
      boxShadow: { soft: "0 8px 30px rgba(59,36,23,.10)" },
    },
  },
  plugins: [],
};
export default config;
