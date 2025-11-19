import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Inter'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(59, 130, 246, 0.25)",
        card: "0 12px 30px -16px rgba(15, 23, 42, 0.35)",
      },
      borderRadius: {
        xl: "18px",
        "2xl": "24px",
      },
      colors: {
        brand: {
          primary: "#2563eb",
          muted: "#dbeafe",
          gradientFrom: "#89f7fe",
          gradientTo: "#66a6ff",
        },
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.98)", opacity: "0.7" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        fade: "fadeIn 200ms ease-out",
        slideIn: "slideIn 250ms ease-out",
        pop: "pop 200ms ease-out",
      },
    },
  },
  plugins: [typography],
};

export default config;
