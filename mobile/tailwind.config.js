/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        obsidian: {
          canvas: "#0B0F17",
          card: "#121927",
          border: "#212C3D",
          muted: "#192233",
          accent: "#1D273B",
          fg: "#F1F5F9",
          mutedFg: "#94A3B8",
        },
        crisp: {
          canvas: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          muted: "#F1F5F9",
          accent: "#E2E8F0",
          fg: "#0F172A",
          mutedFg: "#64748B",
        },
        sapphire: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          deep: "#2563EB",
        },
        emeraldGlow: {
          DEFAULT: "#10B981",
          bright: "#34D399",
          deep: "#059669",
        },
        amberLed: {
          DEFAULT: "#F59E0B",
          bright: "#FBBF24",
          deep: "#D97706",
        },
        skyDoor: {
          DEFAULT: "#38BDF8",
          cyan: "#06B6D4",
          deep: "#0284C7",
        },
        crimsonAlarm: {
          DEFAULT: "#EF4444",
          deep: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};

