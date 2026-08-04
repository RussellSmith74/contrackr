import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only. Lets a Cloudflare quick tunnel reach the dev server so phones can
  // load it over real HTTPS — required for auth cookies and service workers,
  // neither of which work over a plain http LAN address.
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    // Photos are downscaled in the browser before upload (see src/lib/image.ts),
    // so they arrive already sized for display. Running them through Vercel's
    // optimizer on top of that bought us nothing and burned the Hobby quota.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yljlrzrcdhulfyefworo.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Never cache the service worker — a stale one can pin users to an
        // old version of the app indefinitely.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
