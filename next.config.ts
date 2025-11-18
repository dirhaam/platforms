import type { NextConfig } from "next";

// Disable Tailwind lightning mode di Windows/CI
process.env.TAILWIND_DISABLE_LIGHTNING =
  process.env.TAILWIND_DISABLE_LIGHTNING ?? "1";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    useLightningcss: false,
    optimizePackageImports: ["@radix-ui/react-*"],
  },

  // Exclude folder Windows yang sering bikin EPERM error
  outputFileTracingExcludes: {
    "*": [
      "C:\\\\Users\\\\*\\\\Application Data/**",
      "C:\\\\Users\\\\*\\\\AppData/**",
      "C:\\\\Users\\\\*\\\\Cookies/**",
      "C:\\\\Users\\\\*\\\\Local Settings/**",
      "C:\\\\Users\\\\*\\\\NTUSER.*",
      "C:\\\\Users\\\\*\\\\OneDrive/**",
    ],
  },

  // Konfigurasi webpack untuk mengecualikan modul Node.js dari bundle client
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Jika di lingkungan client, buat modul Node.js menjadi external
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        path: false,
        stream: false,
        pg: false,
        "pg-native": false,
        "drizzle-orm": false,
        "@supabase/supabase-js": false,
      };
    }
    return config;
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

  // Suppress static generation errors for special routes
  onDemandEntries: {
    maxInactiveAge: 60000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;