import type { Config } from "tailwindcss";
import { tailwindTokens } from "./styles/tailwind-tokens";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: tailwindTokens,
  },
  plugins: [],
};

export default config;
