/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{ts,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border-color)",
        input: "var(--border-color)",
        ring: "var(--accent-color)",
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        primary: {
          DEFAULT: "var(--accent-color)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--bg-secondary)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "var(--error-bg)",
          foreground: "var(--error-color)",
        },
        muted: {
          DEFAULT: "var(--bg-tertiary)",
          foreground: "var(--text-secondary)",
        },
        accent: {
          DEFAULT: "var(--accent-light)",
          foreground: "var(--text-primary)",
        },
      },
    },
  },
  plugins: [],
}
