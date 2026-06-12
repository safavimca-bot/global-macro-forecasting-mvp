import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#06111f",
          900: "#0a1627",
          850: "#0f1f34",
          800: "#14263d"
        },
        signal: {
          blue: "#38bdf8",
          cyan: "#22d3ee",
          amber: "#f59e0b",
          red: "#ef4444",
          green: "#22c55e"
        }
      },
      boxShadow: {
        panel: "0 18px 50px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
