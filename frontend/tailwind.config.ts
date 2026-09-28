import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        accent: {
          DEFAULT: "var(--accent)",
          light: "#2563EB",
          dark: "#3B82F6",
        },
        danger: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)",
        // Semantic token aliases
        "app-bg": "var(--bg-app)",
        "surface-bg": "var(--bg-surface)",
        "surface-elevated": "var(--bg-surface-elevated)",
        "main-text": "var(--text-main)",
        "muted-text": "var(--text-muted)",
        "token-border": "var(--border-color)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
export default config;
