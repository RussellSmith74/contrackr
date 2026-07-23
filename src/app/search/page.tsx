"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, CheckCircle, Shield, Briefcase, Loader2, Award } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { StarRating } from "@/components/ui/StarRating";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { distanceMiles } from "@/lib/geo";

interface Contractor {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  bio: string | null;
  avatar_url: string | null;
  categories: string[];
  service_areas: string[];
  years_experience: number | null;
  is_insured: boolean;
  is_verified: boolean;
  is_licensed: boolean;
  avg_rating: number;
  total_reviews: number;
  total_jobs_completed: number;
  location: string | null;
  lat: number | null;
  lng: number | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [licensedOnly, setLicensedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "jobs">("rating");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(50);

  useEffect(() => {
    const fetchContractors = async () => {
      const supabase = createClient();

      // Load current user's location prefs
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("lat, lng, search_radius")
          .eq("id", user.id)
          .single();
        if (prof) {
          setUserLat((prof as { lat?: number | null }).lat ?? null);
          setUserLng((prof as { lng?: number | null }).lng ?? null);
          setSearchRadius((prof as { search_radius?: number | null }).search_radius ?? 50);
        }
      }

      const { data } = await supabase
        .from("contractor_profiles")
        .select(`
          id,
          user_id,
          business_name,
          owner_name,
          bio,
          categories,
          service_areas,
          years_experience,
          is_insured,
          is_verified,
          is_licensed,
          avg_rating,
          total_reviews,
          total_jobs_completed,
          lat,
          lng,
          profiles:user_id(avatar_url, location)
        `)
        .order("avg_rating", { ascending: false });

      if (data) {
        setContractors(
          data.map((c) => {
            const profile = c.profiles as unknown as { avatar_url: string | null; location: string | null } | null;
            const cAny = c as { lat?: number | null; lng?: number | null };
            return {
              ...c,
              avatar_url: profile?.avatar_url ?? null,
              location: profile?.location ?? null,
              lat: cAny.lat ?? null,
              lng: cAny.lng ?? null,
            };
          })
        );
      }
      setLoading(false);
    };

    fetchContractors();
  }, []);

  const filtered = contractors
    .filter((c) => {
      if (category && !c.categories.includes(category)) return false;
      if (minRating && c.avg_rating < minRating) return false;
      if (verifiedOnly && !c.is_verified) return false;
      if (licensedOnly && !c.is_licensed) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !c.business_name.toLowerCase().includes(q) &&
          !(c.bio ?? "").toLowerCase().includes(q) &&
          !c.categories.some((cat) => cat.includes(q))
        )
          return false;
      }
      // Radius filter — only when both user and contractor have coords
      if (userLat !== null && userLng !== null && c.lat !== null && c.lng !== null) {
        if (distanceMiles(userLat, userLng, c.lat, c.lng) > searchRadius) return false;
      }
      return true;
    })
    .sort((a, b) =>
      sortBy === "rating"
        ? b.avg_rating - a.avg_rating
        : b.total_jobs_completed - a.total_jobs_completed
    );

  const getCategoryLabel = (id: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === id)?.label || id;
  const getCategoryIcon = (id: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === id)?.icon || "📋";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628] transition-colors">
      <Navbar />

      {/* Search header */}
      <div className="bg-[#0A1628] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-black text-white mb-4">
            Find the right contractor
          </h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search by trade, service, or name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1E6FFF]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Category chips */}
        <div className="relative mb-4">
          <div className="flex overflow-x-auto gap-2 pb-2" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setCategory("")}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all",
                !category
                  ? "bg-[#0A1628] text-white border-[#0A1628]"
                  : "bg-white dark:bg-[#0D1F3C] border-[#E5E7EB] dark:border-[#1E3A5F] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#1E6FFF]"
              )}
            >
              All Trades
            </button>
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id === category ? "" : cat.id)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all",
                  category === cat.id
                    ? "bg-[#1E6FFF] text-white border-[#1E6FFF]"
                    : "bg-white dark:bg-[#0D1F3C] border-[#E5E7EB] dark:border-[#1E3A5F] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#1E6FFF]"
                )}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-[#F8FAFC] dark:from-[#0A1628] to-transparent pointer-events-none" />
        </div>

        {/* Trust filters */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8]">Filter:</span>
          <button
            onClick={() => setVerifiedOnly((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              verifiedOnly
                ? "bg-[#EFF6FF] dark:bg-[#1E3A5F] border-[#1E6FFF] text-[#1E6FFF] dark:text-[#60A5FA]"
                : "bg-white dark:bg-[#0D1F3C] border-[#E5E7EB] dark:border-[#1E3A5F] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#1E6FFF]"
            )}
          >
            <CheckCircle size={12} />
            Verified
          </button>
          <button
            onClick={() => setLicensedOnly((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              licensedOnly
                ? "bg-[#F5F3FF] dark:bg-[#2E1065] border-[#7C3AED] text-[#7C3AED] dark:text-[#A78BFA]"
                : "bg-white dark:bg-[#0D1F3C] border-[#E5E7EB] dark:border-[#1E3A5F] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#7C3AED]"
            )}
          >
            <Award size={12} />
            Licensed
          </button>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
            {loading ? "Loading..." : (
              <><strong className="text-[#0D0D0D] dark:text-white">{filtered.length}</strong> contractor{filtered.length !== 1 ? "s" : ""} found</>
            )}
          </p>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-[#6B7280] dark:text-[#94A3B8]">Sort:</span>
            <button
              onClick={() => setSortBy("rating")}
              className={cn("font-semibold", sortBy === "rating" ? "text-[#1E6FFF]" : "text-[#6B7280] dark:text-[#94A3B8]")}
            >
              Top Rated
            </button>
            <span className="text-[#E5E7EB] mx-1">·</span>
            <button
              onClick={() => setSortBy("jobs")}
              className={cn("font-semibold", sortBy === "jobs" ? "text-[#1E6FFF]" : "text-[#6B7280] dark:text-[#94A3B8]")}
            >
              Most Jobs
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#E5E7EB] dark:bg-[#1E3A5F] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-[#E5E7EB] dark:bg-[#1E3A5F] rounded w-1/3 mb-2" />
                    <div className="h-3 bg-[#E5E7EB] dark:bg-[#1E3A5F] rounded w-1/4 mb-3" />
                    <div className="h-3 bg-[#E5E7EB] dark:bg-[#1E3A5F] rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            {contractors.length === 0 ? (
              <>
                <p className="text-lg font-bold text-[#0D0D0D] dark:text-white">No contractors yet</p>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">Be the first — sign up as a contractor and get found by customers.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-[#0D0D0D] dark:text-white">No contractors found</p>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">Try a different category or clear your filters</p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((contractor, index) => (
              <Link key={contractor.id} href={`/contractors/${contractor.id}`}>
                <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-5 hover:shadow-md hover:border-[#1E6FFF] transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <Avatar src={contractor.avatar_url} name={contractor.business_name} size="lg" />
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#1E6FFF] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-black">{index + 1}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1 flex-wrap">
                        <h3 className="font-black text-[#0A1628] dark:text-white">{contractor.business_name}</h3>
                        {contractor.is_verified && (
                          <Badge variant="blue" size="sm">
                            <CheckCircle size={10} className="mr-1" />
                            Verified
                          </Badge>
                        )}
                        {contractor.is_licensed && (
                          <Badge size="sm" className="bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#2E1065] dark:text-[#A78BFA]">
                            <Award size={10} className="mr-1" />
                            Licensed
                          </Badge>
                        )}
                        {contractor.is_insured && (
                          <Badge variant="green" size="sm">
                            <Shield size={10} className="mr-1" />
                            Insured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-2">{contractor.owner_name}</p>

                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {contractor.avg_rating > 0 && (
                          <StarRating
                            rating={contractor.avg_rating}
                            size="sm"
                            showCount
                            count={contractor.total_reviews}
                          />
                        )}
                        {contractor.total_jobs_completed > 0 && (
                          <div className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                            <Briefcase size={11} />
                            {contractor.total_jobs_completed} jobs
                          </div>
                        )}
                        {contractor.location && (
                          <div className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                            <MapPin size={11} />
                            {contractor.location}
                          </div>
                        )}
                      </div>

                      {contractor.bio && (
                        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] leading-snug line-clamp-2 mb-3">
                          {contractor.bio}
                        </p>
                      )}

                      {contractor.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {contractor.categories.map((cat) => (
                            <span
                              key={cat}
                              className="text-xs font-semibold bg-[#F3F4F6] dark:bg-[#1E3A5F] text-[#374151] dark:text-[#CBD5E1] px-2 py-0.5 rounded-full"
                            >
                              {getCategoryIcon(cat)} {getCategoryLabel(cat)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
