import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8F0",
        espresso: "#3B2417",
        caramel: "#C68642",
        matcha: "#7A9E5A",
        milk: "#F3E5D0",
        berry: "#B5446E",
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
