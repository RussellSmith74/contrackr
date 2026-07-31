import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Contrakr — Find & Hire Blue Collar Pros",
    short_name: "Contrakr",
    description:
      "Post a job, compare bids, and hire trusted local contractors. Free for everyone.",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A1628",
    theme_color: "#0A1628",
    categories: ["business", "productivity", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Maskable icons let Android crop to whatever shape the launcher uses
      // without clipping the logo. Needs ~20% padding built into the artwork.
      { src: "/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Post a Job",  short_name: "Post Job", url: "/post-job" },
      { name: "Messages",    short_name: "Messages", url: "/messages" },
      { name: "Find Pros",   short_name: "Search",   url: "/search" },
    ],
  };
}
