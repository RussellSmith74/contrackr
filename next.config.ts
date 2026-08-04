import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only. Lets a Cloudflare quick tunnel reach the dev server so phones can
  // load it over real HTTPS — required for auth cookies and service workers,
  // neither of which work over a plain http LAN address.
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    // Do NOT set unoptimized here. Turning the optimizer off made the feed
    // serve full-size camera originals; a 4000px JPEG decodes to ~48MB in
    // memory, and enough of them on one page make iOS discard the whole
    // document's backing store — the feed renders blank while keeping its
    // scroll height. New uploads are downscaled (src/lib/image.ts), but every
    // photo uploaded before that change is still full size.
    // Vercel's default is 4 hours, so every optimized variant was regenerated
    // four times a day — that's what blew the Hobby "Image Optimization -
    // Cache Writes" limit (126K/100K on 2026-08-04) while Transformations sat
    // at only 2.7K/5K. 47 writes per source image is revalidation, not variety.
    //
    // Safe to hold for a month here because no image URL is ever reused with
    // different content: job photos get a timestamped random path, and avatar
    // URLs carry a ?t= cache-buster written at upload time. There is no cache
    // invalidation API, so this would be unsafe if any src were mutable.
    minimumCacheTTL: 2678400, // 31 days
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
