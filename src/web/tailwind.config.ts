import { type Config } from "tailwindcss";

/* eslint-disable */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "#FFFFFF",
        black: "#020304",
        blue: "#4CADE9",
        "blue-dark": "#2487C5",
        purple: "#41204B",
        "purple-light": "#8A8FD6",
        "purple-dark": "#5F65B9",
        "purple-soft": "#C3A2CD",
        "purple-shade": "#54365D",
        pink: "#FE4D57",
        orange: "#F9AB3E",
        green: "#387F6A",
        "green-light": "#E6F5F3",
        "green-dark": "#4CA78C",
        // yellow: "#AE9C3E",
        yellow: "#D48414",
        "yellow-light": "#FDDF99",
        "gray-dark": "#565B6F",
        gray: "#DCE0E5",
        "gray-light": "#F3F6FA",
        overlay: "rgba(0, 0, 0, 0.5)",
      },
      fontFamily: {
        openSans: ["var(--font-open-sans)"],
      },
    },
  },
  darkMode: "class",
  plugins: [require("daisyui"), require("tailwindcss-animate")],
  daisyui: {
    logs: false,
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["[data-theme=light]"],
          primary: "#41204B",
          "primary-focus": "#33193b",
          "primary-content": "#ffffff",
          secondary: "#387F6A",
          "secondary-focus": "#bd0091",
          "secondary-content": "#ffffff",
          // accent: "#37cdbe",
          // "accent-focus": "#2aa79b",
          // "accent-content": "#ffffff",
          // neutral: "#2a2e37",
          // "neutral-focus": "#16181d",
          // "neutral-content": "#ffffff",
          // "base-100": "#3d4451",
          // "base-200": "#2a2e37",
          // "base-300": "#16181d",
          // "base-content": "#ebecf0",
          // info: "#66c6ff",
          success: "#387F6A",
          warning: "#F9AB3E",
          error: "#FE4D57",
        },
      },
    ],
  },
} satisfies Config;
/* eslint-enable */
