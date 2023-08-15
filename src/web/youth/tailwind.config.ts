import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [require("daisyui"), require("tailwindcss-animate")],
  daisyui: {
    logs: false,
  },
} satisfies Config;
