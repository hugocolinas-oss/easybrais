import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#f0f7f4",
          100: "#dbeee3",
          200: "#b9ddc9",
          300: "#89c4a5",
          400: "#56a57d",
          500: "#348862",
          600: "#246d4e",
          700: "#1d5740",
          800: "#194535",
          900: "#003C2F",
          950: "#002620",
        },
        gold: {
          50: "#fdf8f0",
          100: "#f9edda",
          200: "#f2d8b4",
          300: "#e8bc84",
          400: "#dca05e",
          500: "#C49A6C",
          600: "#b0834e",
          700: "#936a3f",
          800: "#785538",
          900: "#634730",
        },
        sage: {
          50: "#f4f6f0",
          100: "#e7ebdf",
          200: "#d1d9c4",
          300: "#b5c1a0",
          400: "#A3B18A",
          500: "#8a9a6e",
          600: "#6e7c55",
          700: "#566144",
          800: "#474f39",
          900: "#3d4332",
        },
        cream: {
          50: "#FDFCF9",
          100: "#F8F4EC",
          200: "#F0EAD2",
          300: "#E5DBBD",
          400: "#D5C8A3",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 60, 47, 0.06), 0 1px 2px -1px rgba(0, 60, 47, 0.06)",
        "card-hover": "0 4px 12px -2px rgba(0, 60, 47, 0.1), 0 2px 4px -2px rgba(0, 60, 47, 0.06)",
        soft: "0 2px 8px -2px rgba(0, 60, 47, 0.08)",
        glow: "0 0 0 3px rgba(196, 154, 108, 0.15)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
