import type { NextConfig } from "next";

// Disable Tailwind lightning mode di Windows/CI
process.env.TAILWIND_DISABLE_LIGHTNING =
  process.env.TAILWIND_DISABLE_LIGHTNING ?? "1";

const nextConfig: NextConfig = {
  experimental: {
    useLightningcss: false,
  },

  // Exclude folder Windows yang sering bikin EPERM error
  outputFileTracingExcludes: {
    "*": [
      "C:\\Users\\*\\Application Data/**",
      "C:\\Users\\*\\AppData/**",
      "C:\\Users\\*\\Cookies/**",
      "C:\\Users\\*\\Local Settings/**",
      "C:\\Users\\*\\NTUSER.*",
      "C:\\Users\\*\\OneDrive/**",
    ],
  },

  // Jika butuh header vercel speed-insights
  // headers: async () => {
  //   return [
  //     {
  //       source: '/_vercel/speed-insights/script.js',
  //       headers: [
  //         {
  //           key: 'Cache-Control',
  //           value: 'public, max-age=31536000, immutable',
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;
