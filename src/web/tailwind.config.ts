import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        white: "#ffffff",
        "white-shade": "#f7f7f7",
        black: "#020304",
        blue: {
          DEFAULT: "#4cade9",
          light: "#edf6fd",
          shade: "#5eb5eb",
          dark: "#2487c5",
        },
        purple: {
          DEFAULT: "#41204b",
          light: "#8a8fd6",
          dark: "#5f65b9",
          soft: "#c3a2cd",
          shade: "#54365d",
          tint: "#e7d4ed",
        },
        pink: "#fe4d57",
        orange: {
          DEFAULT: "#f9ab3e",
          light: "#fdeed8",
        },
        green: {
          DEFAULT: "#387f6a",
          tint: "#4c8c79",
          light: "#e6f5f3",
          dark: "#4ca78c",
        },
        yellow: {
          DEFAULT: "#d48414",
          light: "#fddf99",
          tint: "#fae4c6",
        },
        gray: {
          DEFAULT: "#dce0e5",
          dark: "#565b6f",
          light: "#f3f6fa",
        },
        overlay: "rgba(0, 0, 0, 0.5)",
      },
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
      },
      //   fontSize: {
      //     xs: "0.775rem",
      //     sm: "0.9rem",
      //     base: "1.1rem",
      //     lg: "1.25rem",
      //     xl: "1.5rem",
      //     "2xl": "1.875rem",
      //     "3xl": "2.25rem",
      //     "4xl": "2.625rem",
      //     "5xl": "3.25rem",
      //     "6xl": "4.25rem",
      //     "7xl": "5.25rem",
      //     "8xl": "6.25rem",
      //     "9xl": "7.25rem",
      //   },
      //   lineHeight: {
      //     xs: "1rem",
      //     sm: "1.25rem",
      //     base: "1.5rem",
      //     lg: "1.75rem",
      //     xl: "1.75rem",
      //     "2xl": "2rem",
      //     "3xl": "2.5rem",
      //     "4xl": "2.75rem",
      //     "5xl": "1",
      //     "6xl": "1",
      //     "7xl": "1",
      //     "8xl": "1",
      //     "9xl": "1",
      //   },
      boxShadow: {
        custom:
          "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
      },
      transitionTimingFunction: {
        bounce: "cubic-bezier(0.175, 1.485, 0.320, 1.275)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-bottom": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-out-bottom": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        "slide-in-top": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-out-top": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-100%)", opacity: "0" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-left": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(-100%)", opacity: "0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        wiggle: {
          "0%": { transform: "rotate(-3deg)" },
          "25%": { transform: "rotate(3deg)" },
          "50%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
          "100%": { transform: "rotate(-3deg)" },
        },
        enter: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
            visibility: "visible",
          },
        },
        exit: {
          "0%": { opacity: "1", transform: "scale(1)", visibility: "visible" },
          "100%": {
            opacity: "0",
            transform: "scale(0.95)",
            visibility: "hidden",
          },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "spin-once": {
          "0%": { transform: "rotate(0deg)", opacity: "0" },
          "50%": { transform: "rotate(180deg)", opacity: "0.5" },
          "100%": { transform: "rotate(360deg)", opacity: "1" },
        },
        "bounce-once": {
          "0%": { transform: "scale(1)", opacity: "0" },
          "50%": { transform: "scale(1.2)", opacity: "0.7" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-in-out forwards",
        "fade-out": "fade-out 0.3s ease-in-out forwards",
        "slide-in-bottom": "slide-in-bottom 0.5s ease-in-out forwards",
        "slide-out-bottom": "slide-out-bottom 0.3s ease-in-out forwards",
        "slide-in-top": "slide-in-top 0.5s ease-in-out forwards",
        "slide-out-top": "slide-out-top 0.5s ease-in-out forwards",
        "slide-in-left": "slide-in-left 0.5s ease-in-out forwards",
        "slide-out-left": "slide-out-left 0.5s ease-in-out forwards",
        "slide-in-right": "slide-in-right 0.5s ease-in-out forwards",
        "slide-out-right": "slide-out-right 0.5s ease-in-out forwards",
        wiggle: "wiggle 2s ease-in-out infinite",
        "wiggle-once": "wiggle 0.5s ease-in-out forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-once": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) forwards",
        enter: "enter 0.3s ease-out forwards",
        exit: "exit 0.3s ease-in forwards",
        "spin-once": "spin-once 0.5s ease-in-out forwards",
        "bounce-once": "bounce-once 0.5s ease-in-out forwards",
      },
      inset: {
        "1/5": "20%", // Custom class for top: 20%
      },
    },
  },
  //darkMode: "class",
} satisfies Config;
