import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://contrakr.com";

// Rebuilt hourly. New contractors and posts show up on the next revalidation
// rather than on every crawler hit.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                  lastModified: new Date(), changeFrequency: "daily",   priority: 1 },
    { url: `${SITE_URL}/search`,      lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/feed`,        lastModified: new Date(), changeFrequency: "hourly",  priority: 0.8 },
    { url: `${SITE_URL}/login`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/signup`,      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${SITE_URL}/privacy`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${SITE_URL}/terms`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  ];

  // Plain anon client — no cookies, so this stays cacheable. Everything read
  // here is already publicly readable under RLS.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [{ data: contractors }, { data: posts }] = await Promise.all([
    supabase
      .from("contractor_profiles")
      .select("id, updated_at, created_at")
      .order("avg_rating", { ascending: false })
      .limit(5000),
    supabase
      .from("feed_posts")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const contractorRoutes: MetadataRoute.Sitemap = (contractors ?? []).map((c) => ({
    url: `${SITE_URL}/contractors/${c.id}`,
    lastModified: new Date(
      (c as { updated_at?: string | null }).updated_at ?? c.created_at ?? Date.now()
    ),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${SITE_URL}/post/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...contractorRoutes, ...postRoutes];
}
