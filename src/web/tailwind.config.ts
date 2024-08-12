import { type Config } from "tailwindcss";

/* eslint-disable */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "#FFFFFF",
        "white-shade": "#F7F7F7",
        black: "#020304",
        blue: "#4CADE9",
        "blue-light": "#EDF6FD",
        "blue-shade": "#5eb5eb",
        "blue-dark": "#2487C5",
        purple: "#41204B",
        "purple-light": "#8A8FD6",
        "purple-dark": "#5F65B9",
        "purple-soft": "#C3A2CD",
        "purple-shade": "#54365D",
        "purple-tint": "#E7D4ED",
        pink: "#FE4D57",
        orange: "#F9AB3E",
        "orange-light": "#FDEED8",
        green: "#387F6A",
        "green-tint": "#4C8C79",
        "green-light": "#E6F5F3",
        "green-dark": "#4CA78C",
        yellow: "#D48414",
        "yellow-light": "#FDDF99",
        "yellow-tint": "#FAE4C6",
        "gray-dark": "#565B6F",
        gray: "#DCE0E5",
        "gray-light": "#F3F6FA",
        overlay: "rgba(0, 0, 0, 0.5)",
      },
      fontFamily: {
        // openSans: ["var(--font-open-sans)"],
        nunito: ["var(--font-nunito)"],
      },
      boxShadow: {
        custom:
          "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
      },
      transitionTimingFunction: {
        bounce: "cubic-bezier(0.175, 1.485, 0.320, 1.275)",
      },
      keyframes: {
        wiggle: {
          "0%, 50%, 100%": { transform: "rotate(-3deg)" },
          "25%, 75%": { transform: "rotate(3deg)" },
        },
      },
      animation: {
        wiggle: "wiggle 2s ease-in-out",
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
          info: "#4CADE9",
          success: "#387F6A",
          warning: "#F9AB3E",
          error: "#FE4D57",
        },
      },
    ],
  },
} satisfies Config;
/* eslint-enable */
