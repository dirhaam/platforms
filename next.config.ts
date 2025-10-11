import type { NextConfig } from "next";

process.env.TAILWIND_DISABLE_LIGHTNING = process.env.TAILWIND_DISABLE_LIGHTNING ?? "1";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable experimental features if needed
    useLightningcss: false,
  },
  // Ensure proper handling of Vercel Analytics and Speed Insights
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