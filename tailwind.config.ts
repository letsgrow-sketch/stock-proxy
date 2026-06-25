import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0B0F14",
          50: "#12171E",
          100: "#1A202A",
          200: "#232B38",
          300: "#2D3648",
        },
        border: "#1E2538",
        text: {
          primary: "#EAECEF",
          secondary: "#8B92A8",
          muted: "#5C6378",
        },
        green: {
          DEFAULT: "#16C784",
          bg: "rgba(22,199,132,0.1)",
          light: "#1fdf9a",
        },
        red: {
          DEFAULT: "#EA3943",
          bg: "rgba(234,57,67,0.1)",
          light: "#ff5c64",
        },
        accent: {
          DEFAULT: "#16C784",
          light: "#1fdf9a",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}
export default config
