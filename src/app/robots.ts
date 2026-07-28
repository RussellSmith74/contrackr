import type { MetadataRoute } from "next";

const SITE_URL = "https://contrakr.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in surfaces and anything user-specific. Most of these already
      // redirect to /login, but saying so up front saves crawl budget.
      disallow: [
        "/admin",
        "/api",
        "/compose",
        "/dashboard",
        "/forgot-password",
        "/messages",
        "/my-jobs",
        "/notifications",
        "/onboarding",
        "/post-job",
        "/profile",
        "/reset-password",
        "/settings",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
