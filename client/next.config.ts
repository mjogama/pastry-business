import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inlined into the server and browser bundles at build time (like a NEXT_PUBLIC_ variable), so set
  // SERVER_API before `next build`; changing it later needs a rebuild. Read through lib/env.ts.
  env: { SERVER_API: process.env.SERVER_API ?? "" },
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
