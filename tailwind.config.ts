import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#060a0f",
        panel: "#0d1520",
        panel2: "#101c2a",
        pitch: "#00c853",
        gold: "#FFD700",
        border: "rgba(255,255,255,0.1)",
        muted: "#8da0b8"
      },
      fontFamily: {
        display: ["var(--font-bebas)", "Impact", "sans-serif"],
        label: ["var(--font-barlow-condensed)", "Arial Narrow", "sans-serif"],
        sans: ["var(--font-barlow)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 26px rgba(0, 200, 83, 0.24)",
        gold: "0 0 24px rgba(255, 215, 0, 0.18)"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(255, 215, 0, 0)" },
          "50%": { boxShadow: "0 0 24px rgba(255, 215, 0, 0.32)" }
        }
      },
      animation: {
        fadeUp: "fadeUp 0.45s ease both",
        glowPulse: "glowPulse 2.2s ease-in-out infinite"
      }
    }
  },
  plugins: [animate]
};

export default config;
