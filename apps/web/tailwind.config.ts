import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
          border: "var(--surface-border)",
        },
        primary: {
          DEFAULT: "#0B3954",
          light: "#1F77B4",
          dark: "#062233",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#E8871E",
          foreground: "#FFFFFF",
        },
        scientific: {
          valid: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          neutral: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
