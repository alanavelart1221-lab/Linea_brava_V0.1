import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // OLED-leaning dark base — deep, premium, power-efficient
        ink: {
          950: "#08090A",
          900: "#0C0D0F",
          800: "#141518",
          700: "#1C1E22",
          600: "#26282E",
        },
        // "Trail" orange — the single bold accent (matches the brand mark)
        trail: {
          50: "#FEF3E8",
          200: "#FBD0A4",
          300: "#F9B26D",
          400: "#F79A42",
          500: "#F5821F",
          600: "#DD6C10",
          700: "#B4540A",
        },
        // "Go" emerald — live/active indicators only
        go: {
          400: "#34D399",
          500: "#10B981",
        },
        bone: "#F5F3EF",
        mute: "#9CA0A8",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      maxWidth: {
        content: "1200px",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245,130,31,0.18), 0 18px 60px -20px rgba(245,130,31,0.35)",
        lift: "0 24px 70px -30px rgba(0,0,0,0.85)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "grain-shift": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(-2%, 1%)" },
          "50%": { transform: "translate(1%, -2%)" },
          "75%": { transform: "translate(2%, 2%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
