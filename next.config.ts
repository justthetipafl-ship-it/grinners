import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is left off for now: pages use the simpler per-request model
  // until the database is connected, when caching gets set up deliberately.
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
