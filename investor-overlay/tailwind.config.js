/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,tsx,ts}"],
  theme: {
    extend: {
      colors: {
        vv: {
          bg: "#0d0f14",
          panel: "#141720",
          surface2: "#1a1e2a",
          surface3: "#1f2435",
          accent: "#4ade80",
          accent2: "#22d3ee",
          accent3: "#f59e0b",
          danger: "#f87171",
          text: "#e8eaf0",
          muted: "#8b92a8",
          text3: "#555e78",
          success: "#22c55e",
          warn: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        syne: ["'Syne'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
