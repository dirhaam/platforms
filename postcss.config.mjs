process.env.TAILWIND_DISABLE_LIGHTNING = process.env.TAILWIND_DISABLE_LIGHTNING ?? "1";

const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
