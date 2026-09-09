import type { Config } from "tailwindcss";

const config: Config = {
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
        "primary-bg": "var(--bg-primary)",
        "secondary-bg": "var(--bg-secondary)",
        "card-bg": "var(--bg-card)",
        "primary-text": "var(--text-primary)",
        "secondary-text": "var(--text-secondary)",
        "border-color": "var(--border-color)",
        "accent-color": "var(--accent-color)",
      },
    },
  },
  plugins: [],
};
export default config;
