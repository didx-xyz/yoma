import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "#FFFFFF",
        black: "#000000",
        blue: "#4CADE9",
        purple: "#41204B",
        pink: "#FE4D57",
        orange: "#F9AB3E",
        green: "#387F6A",
        yellow: "#AE9C3E",
        "gray-dark": "#565B6F",
        gray: "#DCE0E5",
        "gray-light": "#F3F6FA",
      },
      fontFamily: {
        sans: ["Open Sans"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
    },
  },
  darkMode: "class",
  plugins: [require("daisyui"), require("tailwindcss-animate")],
  daisyui: {
    themes: [
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        light: {
          // eslint-disable-next-line
          ...require("daisyui/src/theming/themes")["[data-theme=light]"],
          primary: "#41204B",
          "primary-focus": "#33193b",
          "primary-content": "#ffffff",
          // secondary: "#f000b8",
          // "secondary-focus": "#bd0091",
          // "secondary-content": "#ffffff",
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
