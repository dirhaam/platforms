import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
    "./types/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#696cff',
          light: '#e7e7ff',
          dark: '#5f61e6',
        },
        secondary: '#8592a3',
        success: '#71dd37',
        danger: '#ff3e1d',
        warning: '#ffab00',
        info: '#03c3ec',
        body: '#f5f5f9',
        paper: '#ffffff',
        txt: {
          primary: '#566a7f',
          secondary: '#697a8d',
          muted: '#a1acb8',
        },
      },
      borderRadius: {
        card: '0.5rem',
      },
      boxShadow: {
        card: '0 2px 6px 0 rgba(67, 89, 113, 0.12)',
        nav: '0 0.375rem 1rem 0 rgba(161, 172, 184, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
