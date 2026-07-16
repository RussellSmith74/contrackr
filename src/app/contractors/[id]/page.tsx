"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Phone,
  Globe,
  Shield,
  Star,
  Briefcase,
  CheckCircle,
  MessageSquare,
  ChevronLeft,
  Calendar,
  Camera,
  Crown,
  ShieldCheck,
  Share2,
  Check,
  Award,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ContractorProfile {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  bio: string | null;
  logo_url: string | null;
  categories: string[];
  service_areas: string[];
  years_experience: number | null;
  website: string | null;
  license_number: string | null;
  is_insured: boolean;
  avg_rating: number;
  total_reviews: number;
  total_jobs_completed: number;
  is_verified: boolean;
  is_licensed: boolean;
  created_at: string;
  profiles: {
    avatar_url: string | null;
    location: string | null;
    phone: string | null;
    is_admin: boolean | null;
    is_founder: boolean | null;
  } | null;
}

interface ContractorPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
}

interface FeedPost {
  id: string;
  content: string;
  created_at: string;
  post_type: string;
  photos: string[];
  likes_count: number;
  comments_count: number;
}

type Tab = "posts" | "photos" | "reviews" | "jobs";

export default function ContractorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [contractor, setContractor] = useState<ContractorProfile | null>(null);
  const [photos, setPhotos] = useState<ContractorPhoto[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const startConversation = useCallback(async () => {
    if (!contractor) return;
    setMessaging(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Upsert conversation (customer_id = current user, contractor_id = this contractor profile)
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("customer_id", user.id)
      .eq("contractor_id", contractor.id)
      .single();

    if (existing) {
      router.push("/messages");
      return;
    }

    await supabase.from("conversations").insert({
      customer_id: user.id,
      contractor_id: contractor.id,
    });

    router.push("/messages");
  }, [contractor, router]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data: cp } = await supabase
        .from("contractor_profiles")
        .select(`
          id, user_id, business_name, owner_name, bio, logo_url,
          categories, service_areas, years_experience, website,
          license_number, is_insured, avg_rating, total_reviews,
          total_jobs_completed, is_verified, is_licensed, created_at,
          profiles ( avatar_url, location, phone, is_admin, is_founder )
        `)
        .eq("id", id)
        .single();

      if (!cp) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setContractor(cp as unknown as ContractorProfile);

      const [{ data: photosData }, { data: postsData }, { data: reviewsData }] = await Promise.all([
        supabase
          .from("contractor_photos")
          .select("id, photo_url, caption")
          .eq("contractor_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("feed_posts")
          .select("id, content, created_at, post_type, photos, likes_count, comments_count")
          .eq("author_id", cp.user_id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, profiles ( full_name )")
          .eq("contractor_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (photosData) setPhotos(photosData);
      if (postsData) setPosts(postsData);
      if (reviewsData) setReviews(reviewsData as unknown as Review[]);

      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[#6B7280] dark:text-[#94A3B8]">
          Loading…
        </div>
      </div>
    );
  }

  if (notFound || !contractor) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-lg font-bold text-[#0A1628] dark:text-white mb-2">Contractor not found</p>
          <Link href="/search" className="text-sm text-[#1E6FFF] hover:underline">
            ← Back to search
          </Link>
        </div>
      </div>
    );
  }

  const c = contractor;
  const avatar = c.profiles?.avatar_url ?? null;
  const location = c.profiles?.location ?? null;
  const phone = c.profiles?.phone ?? null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
        <Link href="/search" className="flex items-center gap-1 text-sm text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0D0D] dark:hover:text-white w-fit mb-4">
          <ChevronLeft size={16} />
          Back to search
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        {/* Profile Header */}
        <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl overflow-hidden mb-5">
          <div className="h-32 bg-gradient-to-br from-[#0A1628] via-[#12294a] to-[#1E3A5F] relative">
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative">
                <Avatar
                  src={avatar}
                  name={c.business_name}
                  size="xl"
                  className="!w-24 !h-24 border-4 border-white dark:border-[#0D1F3C] shadow-md"
                />
                {c.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#1E6FFF] rounded-full flex items-center justify-center border-2 border-white dark:border-[#0D1F3C]">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-12">
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-[#E5E7EB] dark:border-[#1E3A5F] text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F3F4F6] dark:hover:bg-[#1E3A5F] transition-colors"
                  title="Share profile"
                >
                  {copied ? <Check size={16} className="text-[#059669]" /> : <Share2 size={16} />}
                </button>
                {currentUserId === c.user_id ? (
                  <Link href="/onboarding/contractor">
                    <Button variant="primary" size="md">
                      <Pencil size={16} />
                      Edit Profile
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button variant="outline" size="md" onClick={startConversation} loading={messaging}>
                      <MessageSquare size={16} />
                      Message
                    </Button>
                    <Link href="/post-job">
                      <Button variant="primary" size="md">
                        Hire Now
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-[#0A1628] dark:text-white">{c.business_name}</h1>
                {c.profiles?.is_founder && (
                  <Crown size={18} className="text-[#D4AF37] fill-[#D4AF37]" aria-label="Founder" />
                )}
                {c.profiles?.is_admin && (
                  <ShieldCheck size={18} className="text-[#1E6FFF]" aria-label="Moderator" />
                )}
                {c.is_verified && (
                  <Badge variant="blue" size="sm">
                    <CheckCircle size={11} className="mr-1" />
                    Verified
                  </Badge>
                )}
                {c.is_licensed && (
                  <Badge size="sm" className="bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#2E1065] dark:text-[#A78BFA]">
                    <Award size={11} className="mr-1" />
                    Licensed
                  </Badge>
                )}
                {c.is_insured && (
                  <Badge variant="green" size="sm">
                    <Shield size={11} className="mr-1" />
                    Insured
                  </Badge>
                )}
              </div>
              <p className="text-[#6B7280] dark:text-[#94A3B8] text-[15px] mt-0.5">
                {c.owner_name}{c.categories.length > 0 ? ` · ${c.categories[0]}` : ""}{location ? ` · ${location}` : ""}
              </p>
            </div>

            {/* Stat row */}
            <div className="flex items-center gap-6 mb-4 pb-4 border-t border-[#F1F5F9] dark:border-[#1E3A5F] pt-4">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-bold text-[#0A1628] dark:text-white leading-none">{c.avg_rating}</p>
                  <Star size={14} className="text-[#F59E0B] fill-[#F59E0B]" />
                </div>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">{c.total_reviews} reviews</p>
              </div>
              <div className="w-px h-8 bg-[#F1F5F9] dark:bg-[#1E3A5F]" />
              <div>
                <p className="text-lg font-bold text-[#0A1628] dark:text-white leading-none">{c.total_jobs_completed}</p>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">Jobs done</p>
              </div>
              {c.years_experience != null && (
                <>
                  <div className="w-px h-8 bg-[#F1F5F9] dark:bg-[#1E3A5F]" />
                  <div>
                    <p className="text-lg font-bold text-[#0A1628] dark:text-white leading-none">{c.years_experience}</p>
                    <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">Yrs exp.</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mb-4 text-sm text-[#6B7280] dark:text-[#94A3B8]">
              {location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {location}
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={14} />
                  <a href={`tel:${phone}`} className="hover:text-[#1E6FFF]">{phone}</a>
                </div>
              )}
              {c.website && (
                <div className="flex items-center gap-1.5">
                  <Globe size={14} />
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#1E6FFF]">
                    Website
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                Member since {formatDate(c.created_at)}
              </div>
            </div>

            {c.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {c.categories.map((cat) => (
                  <span
                    key={cat}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-[#F3F4F6] dark:bg-[#1E3A5F] text-[#374151] dark:text-[#CBD5E1] px-3 py-1.5 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {c.service_areas.length > 0 && (
              <div className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                <span className="font-semibold text-[#374151] dark:text-[#CBD5E1]">Serves: </span>
                {c.service_areas.join(", ")}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left: tabs content */}
          <div className="lg:col-span-2">
            <div className="flex gap-1 bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-1 mb-4">
              {(["posts", "photos", "reviews", "jobs"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                    activeTab === tab
                      ? "bg-[#0A1628] dark:bg-[#1E6FFF] text-white"
                      : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0D0D] dark:hover:text-white"
                  }`}
                >
                  {tab}
                  {tab === "reviews" && c.total_reviews > 0 && (
                    <span className="ml-1 text-xs opacity-70">({c.total_reviews})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Posts */}
            {activeTab === "posts" && (
              <div className="flex flex-col gap-4">
                {posts.length === 0 ? (
                  <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-8 text-center">
                    <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">No posts yet.</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <Link key={post.id} href={`/post/${post.id}?s=feed_post`}>
                      <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl overflow-hidden hover:border-[#1E6FFF]/50 transition-colors">
                        <div className="p-5 pb-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar src={avatar} name={c.business_name} size="sm" />
                            <div>
                              <p className="text-sm font-bold text-[#0D0D0D] dark:text-white">{c.business_name}</p>
                              <p className="text-xs text-[#9CA3AF] dark:text-[#64748B]">{formatDate(post.created_at)}</p>
                            </div>
                          </div>
                          <p className="text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed">{post.content}</p>
                        </div>

                        {post.photos && post.photos.length > 0 && (
                          <div className={`grid gap-0.5 bg-[#0A1628] ${post.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                            {post.photos.slice(0, 4).map((url, i) => (
                              <div key={i} className={`relative bg-[#F1F5F9] dark:bg-[#132A4A] ${post.photos.length === 1 ? "aspect-[16/10]" : "aspect-square"}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                {i === 3 && post.photos.length > 4 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white font-black text-xl">+{post.photos.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {(post.likes_count > 0 || post.comments_count > 0) && (
                          <div className="px-5 py-2.5 flex items-center gap-3 text-xs text-[#9CA3AF] dark:text-[#64748B] border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
                            {post.likes_count > 0 && <span>{post.likes_count} like{post.likes_count !== 1 ? "s" : ""}</span>}
                            {post.comments_count > 0 && <span>{post.comments_count} comment{post.comments_count !== 1 ? "s" : ""}</span>}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Photos */}
            {activeTab === "photos" && (
              <div>
                {photos.length === 0 ? (
                  <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-8 text-center">
                    <Camera size={32} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
                    <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">No photos uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#F3F4F6] dark:bg-[#1E3A5F] group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.photo_url}
                          alt={photo.caption ?? "Work photo"}
                          className="w-full h-full object-cover"
                        />
                        {photo.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-white truncate">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            {activeTab === "reviews" && (
              <div className="flex flex-col gap-4">
                {reviews.length === 0 ? (
                  <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-8 text-center">
                    <Star size={32} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
                    <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">No reviews yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-5 flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-5xl font-black text-[#0A1628] dark:text-white">{c.avg_rating}</p>
                        <StarRating rating={c.avg_rating} size="sm" className="mt-1 justify-center" />
                        <p className="text-xs text-[#9CA3AF] dark:text-[#64748B] mt-1">{c.total_reviews} verified reviews</p>
                      </div>
                    </div>
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={review.profiles?.full_name ?? "Customer"} size="sm" />
                            <div>
                              <p className="text-sm font-bold text-[#0D0D0D] dark:text-white">
                                {review.profiles?.full_name ?? "Customer"}
                              </p>
                              <p className="text-xs text-[#9CA3AF] dark:text-[#64748B]">{formatDate(review.created_at)}</p>
                            </div>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Job History */}
            {activeTab === "jobs" && (
              <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={18} className="text-[#059669]" />
                  <h3 className="font-bold text-[#0D0D0D] dark:text-white">
                    {c.total_jobs_completed} Verified Jobs Completed
                  </h3>
                </div>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] leading-relaxed">
                  Every job {c.business_name} completes through Contrakr is logged here automatically — building a verified professional track record over time.
                </p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-4">
            {c.bio && (
              <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-5">
                <h3 className="font-bold text-[#0D0D0D] dark:text-white mb-3">About</h3>
                <p className="text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed">{c.bio}</p>
              </div>
            )}

            <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-5">
              <h3 className="font-bold text-[#0D0D0D] dark:text-white mb-4">Quick Facts</h3>
              <div className="flex flex-col gap-3">
                {c.years_experience != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280] dark:text-[#94A3B8]">Experience</span>
                    <span className="font-semibold text-[#0D0D0D] dark:text-white">{c.years_experience} years</span>
                  </div>
                )}
                {c.license_number && (
                  <div className="flex items-center justify-between text-sm gap-3">
                    <span className="text-[#6B7280] dark:text-[#94A3B8] flex-shrink-0">License</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-[#0D0D0D] dark:text-white truncate">{c.license_number}</span>
                      {c.is_licensed ? (
                        <Badge size="sm" className="bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#2E1065] dark:text-[#A78BFA] flex-shrink-0">
                          <Award size={10} className="mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="yellow" size="sm" className="flex-shrink-0">Pending review</Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280] dark:text-[#94A3B8]">Insured</span>
                  <Badge variant={c.is_insured ? "green" : "default"} size="sm">
                    {c.is_insured ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>

            {currentUserId !== c.user_id && (
            <div className="bg-[#0A1628] rounded-2xl p-5 text-white text-center">
              <h3 className="font-black text-lg mb-2">Ready to hire?</h3>
              <p className="text-[#94A3B8] text-sm mb-4">
                Post your job and {c.business_name} will be notified right away.
              </p>
              <Link href="/post-job">
                <Button variant="primary" size="lg" fullWidth>
                  Post a Job
                </Button>
              </Link>
              <Button variant="ghost" size="md" fullWidth className="mt-2 text-white hover:bg-white/10" onClick={startConversation} loading={messaging}>
                <MessageSquare size={16} />
                Send a Message
              </Button>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
