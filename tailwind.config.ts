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
      boxShadow: {
        soft: "0 1px 0 rgb(255 255 255 / .55) inset, 0 14px 32px -16px rgb(59 36 23 / .28)",
        float: "0 18px 40px -14px rgb(59 36 23 / .35)",
      },
    },
  },
  plugins: [],
};
export default config;
