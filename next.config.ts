import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is left off for now: pages use the simpler per-request model
  // until the database is connected, when caching gets set up deliberately.
  // Lets the admin form upload a logo (the default limit is 1 MB).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // Baseline browser protections on every page: no embedding in other sites' frames (clickjacking),
  // no content-type guessing, and only the site address shared when a visitor follows a link out.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
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
