"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Clock, ThumbsUp, MessageSquare, DollarSign, Send, Briefcase, ChevronRight, Plus, Sparkles, Trash2, Pencil, Check, X, BadgeCheck, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { distanceMiles } from "@/lib/geo";

interface Post {
  id: string;
  source: "job_post" | "feed_post";
  type: "job_request" | "work_showcase" | "promotion" | "update";
  author_id: string;
  author: { name: string; avatar: string | null; role: "customer" | "contractor"; is_admin: boolean; is_day_one: boolean; is_verified: boolean };
  location: string;
  lat: number | null;
  lng: number | null;
  category: string;
  title: string;
  content: string;
  photos: string[];
  timeline: string | null;
  budget: string | null;
  time: string;
  bids: number | null;
  likes_count: number;
  comments_count: number;
  status: "open" | null;
}

const FEED_FILTERS = ["All", "Job Requests", "Contractor Posts"];

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<"customer" | "contractor" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(50);

  const fetchPosts = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let lat: number | null = null;
    let lng: number | null = null;
    let radius = 50;

    if (user) {
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role, lat, lng, search_radius, is_admin")
        .eq("id", user.id)
        .single();
      if (profile) {
        setCurrentUserName(profile.full_name);
        setCurrentUserAvatar(profile.avatar_url);
        setCurrentUserRole(profile.role as "customer" | "contractor");
        setIsAdmin((profile as { is_admin?: boolean }).is_admin ?? false);
        lat = (profile as { lat?: number | null }).lat ?? null;
        lng = (profile as { lng?: number | null }).lng ?? null;
        radius = (profile as { search_radius?: number | null }).search_radius ?? 50;
        setUserLat(lat);
        setUserLng(lng);
        setSearchRadius(radius);
      }
    }

    // Job posts
    const { data: jobPosts } = await supabase
      .from("job_posts")
      .select("id, title, description, category, location, lat, lng, timeline, budget_range, photos, bid_count, created_at, status, profiles(id, full_name, avatar_url, is_admin, contractor_profiles(is_day_one, is_verified))")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100);

    // Contractor feed posts
    const { data: feedPosts } = await supabase
      .from("feed_posts")
      .select("id, content, post_type, category, location, lat, lng, photos, likes_count, comments_count, created_at, profiles(id, full_name, avatar_url, is_admin, contractor_profiles(is_day_one, is_verified))")
      .order("created_at", { ascending: false })
      .limit(100);

    const realJobPosts: Post[] = (jobPosts ?? []).map((p) => {
      const profile = p.profiles as unknown as { id: string; full_name: string; avatar_url: string | null; is_admin?: boolean; contractor_profiles?: { is_day_one?: boolean; is_verified?: boolean } | { is_day_one?: boolean; is_verified?: boolean }[] | null } | null;
      const cp = Array.isArray(profile?.contractor_profiles) ? profile?.contractor_profiles[0] : profile?.contractor_profiles;
      const pAny = p as { lat?: number | null; lng?: number | null };
      return {
        id: p.id,
        source: "job_post",
        type: "job_request",
        author_id: profile?.id ?? "",
        author: { name: profile?.full_name ?? "Anonymous", avatar: profile?.avatar_url ?? null, role: "customer", is_admin: profile?.is_admin ?? false, is_day_one: cp?.is_day_one ?? false, is_verified: cp?.is_verified ?? false },
        location: p.location,
        lat: pAny.lat ?? null,
        lng: pAny.lng ?? null,
        category: p.category,
        title: p.title,
        content: p.description,
        photos: p.photos ?? [],
        timeline: p.timeline,
        budget: p.budget_range,
        time: p.created_at,
        bids: p.bid_count ?? 0,
        likes_count: 0,
        comments_count: 0,
        status: "open",
      };
    });

    const realFeedPosts: Post[] = (feedPosts ?? []).map((p) => {
      const profile = p.profiles as unknown as { id: string; full_name: string; avatar_url: string | null; is_admin?: boolean; contractor_profiles?: { is_day_one?: boolean; is_verified?: boolean } | { is_day_one?: boolean; is_verified?: boolean }[] | null } | null;
      const cp = Array.isArray(profile?.contractor_profiles) ? profile?.contractor_profiles[0] : profile?.contractor_profiles;
      const postType = p.post_type as "work_showcase" | "promotion" | "update";
      const pAny = p as { lat?: number | null; lng?: number | null };
      return {
        id: p.id,
        source: "feed_post",
        type: postType,
        author_id: profile?.id ?? "",
        author: { name: profile?.full_name ?? "Contractor", avatar: profile?.avatar_url ?? null, role: "contractor", is_admin: profile?.is_admin ?? false, is_day_one: cp?.is_day_one ?? false, is_verified: cp?.is_verified ?? false },
        location: p.location ?? "",
        lat: pAny.lat ?? null,
        lng: pAny.lng ?? null,
        category: p.category ?? "",
        title: p.content.split("\n")[0].slice(0, 80),
        content: p.content,
        photos: p.photos ?? [],
        timeline: null,
        budget: null,
        time: p.created_at,
        bids: null,
        likes_count: p.likes_count ?? 0,
        comments_count: p.comments_count ?? 0,
        status: null,
      };
    });

    const all = [...realJobPosts, ...realFeedPosts].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
    setPosts(all);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filtered = posts.filter((post) => {
    if (activeFilter === "Job Requests" && post.type !== "job_request") return false;
    if (activeFilter === "Contractor Posts" && post.type === "job_request") return false;
    // Radius filter — only apply when user has a geocoded location AND post has coords
    if (userLat !== null && userLng !== null && post.lat !== null && post.lng !== null) {
      if (distanceMiles(userLat, userLng, post.lat, post.lng) > searchRadius) return false;
    }
    return true;
  });

  const getCategoryLabel = (id: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === id)?.label || id;
  const getCategoryIcon = (id: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === id)?.icon || "📋";

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-7">
        <div className="flex gap-6 items-start">

          {/* ── Main feed ── */}
          <div className="flex-1 min-w-0">

            {/* Composer */}
            {currentUserId && (
              <div className="bg-white dark:bg-[#0D1F3C] rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] p-4 mb-5 shadow-sm dark:shadow-none">
                <div className="flex items-center gap-3">
                  <Avatar src={currentUserAvatar} name={currentUserName || "?"} size="md" />
                  <Link
                    href={currentUserRole === "customer" ? "/post-job" : "/compose"}
                    className="flex-1 px-5 py-3 rounded-2xl border-2 border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#0A1628] text-[15px] text-[#94A3B8] dark:text-[#4B6A8A] hover:border-[#1E6FFF] transition-all cursor-pointer"
                  >
                    {currentUserRole === "contractor"
                      ? "Share an update or showcase your work..."
                      : "What do you need help with today?"}
                  </Link>
                </div>
                {currentUserRole === "customer" && (
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
                    <Link href="/post-job" className="flex items-center gap-2 text-[13px] font-semibold text-[#1E6FFF] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A5F] px-3 py-1.5 rounded-xl transition-colors">
                      <Plus size={15} />
                      Post a Job
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-5">
              {FEED_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[13px] font-semibold transition-all border",
                    activeFilter === f
                      ? "bg-[#1E6FFF] text-white border-[#1E6FFF] shadow-sm"
                      : "bg-transparent text-[#64748B] dark:text-[#94A3B8] border-[#CBD5E1] dark:border-[#1E3A5F] hover:border-[#1E6FFF] hover:text-[#1E6FFF] dark:hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Posts */}
            <div className="flex flex-col gap-4">
              {loading
                ? [1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-[#0D1F3C] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-6 animate-pulse shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded-full" />
                        <div className="flex-1">
                          <div className="h-3.5 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded-full w-36 mb-2" />
                          <div className="h-2.5 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded-full w-24" />
                        </div>
                      </div>
                      <div className="h-5 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded-full w-3/4 mb-3" />
                      <div className="h-3 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded-full w-full mb-2" />
                      <div className="h-3 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded-full w-2/3" />
                    </div>
                  ))
                : filtered.length === 0
                ? (
                  <div className="text-center py-20">
                    <Sparkles size={32} className="mx-auto mb-3 text-[#CBD5E1] dark:text-[#1E3A5F]" />
                    <p className="text-lg font-bold text-[#0F172A] dark:text-white">Nothing here yet</p>
                    <p className="text-sm mt-1 text-[#64748B] dark:text-[#4B6A8A]">Be the first to post something</p>
                  </div>
                )
                : filtered.map((post) => (
                    <FeedCard
                      key={post.id}
                      post={post}
                      currentUserId={currentUserId}
                      isAdmin={isAdmin}
                      getCategoryLabel={getCategoryLabel}
                      getCategoryIcon={getCategoryIcon}
                      onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                    />
                  ))
              }
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <aside className="hidden lg:flex flex-col gap-4 w-[268px] flex-shrink-0">
            <div className="bg-white dark:bg-[#0D1F3C] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-5 shadow-sm dark:shadow-none">
              <h3 className="text-[11px] font-bold text-[#94A3B8] dark:text-[#4B6A8A] uppercase tracking-widest mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-1">
                <Link href="/post-job">
                  <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A5F] transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-[#EFF6FF] dark:bg-[#1E3A5F] rounded-xl flex items-center justify-center group-hover:bg-[#1E6FFF] transition-colors flex-shrink-0">
                      <Plus size={18} className="text-[#1E6FFF] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#0F172A] dark:text-white">Post a Job</p>
                      <p className="text-[12px] text-[#64748B] dark:text-[#4B6A8A]">Get bids from local pros</p>
                    </div>
                  </div>
                </Link>
                <Link href="/search">
                  <div className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A5F] transition-colors cursor-pointer group">
                    <div className="w-10 h-10 bg-[#EFF6FF] dark:bg-[#1E3A5F] rounded-xl flex items-center justify-center group-hover:bg-[#1E6FFF] transition-colors flex-shrink-0">
                      <Briefcase size={18} className="text-[#1E6FFF] group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#0F172A] dark:text-white">Find Contractors</p>
                      <p className="text-[12px] text-[#64748B] dark:text-[#4B6A8A]">Browse by trade or location</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D1F3C] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-5 shadow-sm dark:shadow-none">
              <h3 className="text-[11px] font-bold text-[#94A3B8] dark:text-[#4B6A8A] uppercase tracking-widest mb-3">Browse by Trade</h3>
              <div className="flex flex-col">
                {SERVICE_CATEGORIES.slice(0, 8).map((cat) => (
                  <Link key={cat.id} href={`/search?category=${cat.id}`}>
                    <div className="flex items-center justify-between px-2.5 py-2.5 rounded-xl hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A5F] transition-colors group cursor-pointer">
                      <span className="text-[14px] font-medium text-[#334155] dark:text-[#E5E7EB] group-hover:text-[#1E6FFF] dark:group-hover:text-white transition-colors">
                        {cat.icon} {cat.label}
                      </span>
                      <ChevronRight size={14} className="text-[#CBD5E1] dark:text-[#4B6A8A] group-hover:text-[#1E6FFF] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
                <Link href="/search">
                  <span className="block px-2.5 pt-2 text-[13px] font-bold text-[#1E6FFF] hover:underline">
                    View all trades →
                  </span>
                </Link>
              </div>
            </div>

            {!currentUserId && (
              <div className="bg-[#1E6FFF] rounded-2xl p-5 text-center">
                <p className="text-white font-bold text-[15px] mb-1">Join Contrakr</p>
                <p className="text-blue-100 text-[13px] mb-4 leading-relaxed">Connect with contractors or find your next job.</p>
                <div className="flex flex-col gap-2">
                  <Link href="/signup">
                    <button className="w-full bg-white text-[#1E6FFF] text-sm font-bold py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
                      Sign Up Free
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="text-[13px] text-blue-100 hover:text-white transition-colors">
                      Already have an account?
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  link: string
) {
  await createClient().from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    data: { link },
  });
}

function FeedCard({
  post,
  currentUserId,
  isAdmin,
  getCategoryLabel,
  getCategoryIcon,
  onDelete,
}: {
  post: Post;
  currentUserId: string | null;
  isAdmin: boolean;
  getCategoryLabel: (id: string) => string;
  getCategoryIcon: (id: string) => string;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editTitle, setEditTitle] = useState(post.title);
  const [saving, setSaving] = useState(false);

  const handleSaveEdit = async () => {
    setSaving(true);
    const supabase = createClient();
    if (post.source === "feed_post") {
      await supabase.from("feed_posts").update({ content: editContent }).eq("id", post.id);
      post.content = editContent;
      post.title = editContent.split("\n")[0].slice(0, 80);
    } else {
      await supabase.from("job_posts").update({ title: editTitle, description: editContent }).eq("id", post.id);
      post.title = editTitle;
      post.content = editContent;
    }
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    const supabase = createClient();
    if (post.source === "feed_post") {
      await supabase.from("feed_posts").delete().eq("id", post.id);
    } else {
      await supabase.from("job_posts").delete().eq("id", post.id);
    }
    onDelete(post.id);
  };
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(post.comments_count);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [likePending, setLikePending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFeedPost = post.source === "feed_post";
  const isContractor = post.author.role === "contractor";

  // Load comments on mount
  useEffect(() => { loadComments(); }, [post.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if current user already liked this post
  useEffect(() => {
    if (!currentUserId) return;
    createClient()
      .from("likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", currentUserId)
      .single()
      .then(({ data }) => { if (data) setLiked(true); });
  }, [currentUserId, post.id]);

  const typeConfig = {
    job_request:   { label: "Looking for help", light: "text-[#1E6FFF] bg-[#EFF6FF]",  dark: "dark:text-[#60A5FA] dark:bg-[#1E3A5F]" },
    work_showcase: { label: "Work showcase",    light: "text-[#059669] bg-[#ECFDF5]",   dark: "dark:text-[#34D399] dark:bg-[#064E3B]" },
    promotion:     { label: "Special offer",    light: "text-[#D97706] bg-[#FFFBEB]",   dark: "dark:text-[#FCD34D] dark:bg-[#451A03]" },
    update:        { label: "Update",           light: "text-[#7C3AED] bg-[#F5F3FF]",   dark: "dark:text-[#A78BFA] dark:bg-[#2E1065]" },
  };
  const type = typeConfig[post.type] ?? typeConfig.update;

  const loadComments = async () => {
    const { data } = await createClient()
      .from("comments")
      .select("id, content, created_at, profiles(full_name, avatar_url)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    if (data) {
      setComments(data as unknown as Comment[]);
      setCommentCount(data.length);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUserId) return;
    setSubmitting(true);
    const supabase = createClient();

    // Get commenter name
    const { data: me } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", currentUserId)
      .single();

    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, author_id: currentUserId, content: commentText.trim() })
      .select("id, content, created_at, profiles(full_name, avatar_url)")
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data as unknown as Comment]);
      setCommentCount((prev) => prev + 1);
      setCommentText("");

      // Update comments_count on the post (feed posts only)
      if (isFeedPost) {
        await supabase
          .from("feed_posts")
          .update({ comments_count: commentCount + 1 })
          .eq("id", post.id);
      }

      // Notify post author if it's not the same person
      if (post.author_id && post.author_id !== currentUserId) {
        await createNotification(
          post.author_id,
          "comment",
          `${me?.full_name ?? "Someone"} commented on your post`,
          commentText.trim().slice(0, 100),
          `/feed`
        );
      }
    }
    setSubmitting(false);
  };

  const handleLike = async () => {
    if (!currentUserId || likePending) return;
    setLikePending(true);
    const supabase = createClient();

    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
      const newCount = Math.max(0, likeCount - 1);
      setLiked(false);
      setLikeCount(newCount);
      if (isFeedPost) await supabase.from("feed_posts").update({ likes_count: newCount }).eq("id", post.id);
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId });
      const newCount = likeCount + 1;
      setLiked(true);
      setLikeCount(newCount);
      if (isFeedPost) await supabase.from("feed_posts").update({ likes_count: newCount }).eq("id", post.id);

      // Notify post author
      if (post.author_id && post.author_id !== currentUserId) {
        const { data: me } = await supabase.from("profiles").select("full_name").eq("id", currentUserId).single();
        await createNotification(
          post.author_id,
          "like",
          `${me?.full_name ?? "Someone"} liked your post`,
          post.title.slice(0, 80),
          `/feed`
        );
      }
    }
    setLikePending(false);
  };

  const categoryLabel = getCategoryLabel(post.category);
  const categoryIcon  = isContractor ? "" : getCategoryIcon(post.category);

  return (
    <div className={cn(
      "bg-white dark:bg-[#0D1F3C] rounded-xl border border-[#E2E8F0] dark:border-[#1E3A5F] overflow-hidden transition-colors duration-150",
      "hover:border-[#CBD5E1] dark:hover:border-[#2A4A73]"
    )}>
      <div className={cn("p-5", post.photos && post.photos.length > 0 ? "pb-4" : "")}>
        {/* Header */}
        <div className="flex items-start gap-3 mb-3.5">
          <Avatar src={post.author.avatar} name={post.author.name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-[#0F172A] dark:text-white text-[15px] leading-tight">{post.author.name}</p>
                  {post.author.is_admin && (
                    <ShieldCheck size={15} className="text-[#1E6FFF] flex-shrink-0" aria-label="Founder" />
                  )}
                  {post.author.is_verified && (
                    <BadgeCheck size={15} className="text-[#059669] flex-shrink-0" aria-label="Verified" />
                  )}
                  {post.author.is_day_one && (
                    <Star size={13} className="text-[#D97706] fill-[#D97706] flex-shrink-0" aria-label="Day One Contractor" />
                  )}
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md tracking-wide whitespace-nowrap ml-0.5", type.light, type.dark)}>
                    {type.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-[12.5px] text-[#94A3B8] dark:text-[#64748B]">
                  <span className="capitalize">{post.author.role}</span>
                  {post.location && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />{post.location}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatRelativeTime(post.time)}</span>
                  {post.category && (
                    <>
                      <span>·</span>
                      <span className="text-[#1E6FFF] dark:text-[#60A5FA] font-medium">
                        {categoryIcon && <span className="mr-0.5">{categoryIcon}</span>}{categoryLabel}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {(currentUserId === post.author_id || isAdmin) && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 text-[#CBD5E1] hover:text-[#1E6FFF] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A5F] rounded-lg transition-colors"
                    title="Edit post"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-1.5 text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                    title="Delete post"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        {editing && post.source === "job_post" ? (
          <input
            className="w-full text-[18px] font-black text-[#0F172A] dark:text-white bg-[#F8FAFC] dark:bg-[#0A1628] border border-[#1E6FFF] rounded-lg px-3 py-2 mb-2.5 focus:outline-none"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
        ) : (
          <Link href={`/post/${post.id}?s=${post.source}`}>
            <h3 className="text-[16px] font-bold text-[#0F172A] dark:text-white leading-snug mb-2 hover:text-[#1E6FFF] dark:hover:text-[#60A5FA] transition-colors cursor-pointer">
              {post.title}
            </h3>
          </Link>
        )}

        {/* Body */}
        {editing ? (
          <textarea
            className="w-full text-[14px] text-[#475569] dark:text-[#E5E7EB] bg-[#F8FAFC] dark:bg-[#0A1628] border border-[#1E6FFF] rounded-lg px-3 py-2 leading-relaxed focus:outline-none resize-none mb-3"
            rows={5}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        ) : (
          <Link href={`/post/${post.id}?s=${post.source}`} className="block">
            <p className="text-[14px] text-[#475569] dark:text-[#E5E7EB] leading-relaxed line-clamp-3 cursor-pointer">
              {post.content}
            </p>
            {post.content.length > 180 && (
              <span className="text-[13px] text-[#1E6FFF] dark:text-[#60A5FA] font-semibold mt-1 hover:underline">
                ...see more
              </span>
            )}
          </Link>
        )}

        {/* Edit save/cancel */}
        {editing && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1E6FFF] text-white text-sm font-semibold rounded-lg hover:bg-[#1558CC] transition-colors disabled:opacity-50"
            >
              <Check size={14} />{saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setEditContent(post.content); setEditTitle(post.title); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#F1F5F9] dark:bg-[#1E3A5F] text-[#475569] dark:text-[#94A3B8] text-sm font-semibold rounded-lg hover:bg-[#E2E8F0] transition-colors"
            >
              <X size={14} />Cancel
            </button>
          </div>
        )}

        {/* Meta chips */}
        {(post.timeline || post.budget || (post.bids !== null && post.bids > 0)) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.timeline && (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#0A1628] border border-[#E2E8F0] dark:border-[#1E3A5F] px-3 py-1.5 rounded-full">
                <Clock size={11} />{post.timeline}
              </span>
            )}
            {post.budget && (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#0A1628] border border-[#E2E8F0] dark:border-[#1E3A5F] px-3 py-1.5 rounded-full">
                <DollarSign size={11} />{post.budget}
              </span>
            )}
            {post.bids !== null && post.bids > 0 && (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1E6FFF] dark:text-[#60A5FA] bg-[#EFF6FF] dark:bg-[#1E3A5F] px-3 py-1.5 rounded-full">
                {post.bids} bid{post.bids !== 1 ? "s" : ""} so far
              </span>
            )}
          </div>
        )}
      </div>

      {/* Photos — full-bleed, edge to edge */}
      {post.photos && post.photos.length > 0 && (
        <Link href={`/post/${post.id}?s=${post.source}`}>
          <div className={cn("grid gap-0.5 bg-[#0A1628]", post.photos.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
            {post.photos.slice(0, 4).map((url, i) => (
              <div key={i} className={cn("relative bg-[#F1F5F9] dark:bg-[#132A4A]", post.photos.length === 1 ? "aspect-[16/10]" : "aspect-square")}>
                <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="600px" />
                {i === 3 && post.photos.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-black text-xl">+{post.photos.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Link>
      )}

      {/* Like / comment counts always visible */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="px-5 py-2 flex items-center gap-3 text-[12px] text-[#94A3B8] dark:text-[#4B6A8A] border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
          {likeCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-[18px] h-[18px] bg-[#1E6FFF] rounded-full flex items-center justify-center">
                <ThumbsUp size={10} className="text-white" />
              </span>
              {likeCount}
            </span>
          )}
          {commentCount > 0 && (
            <span>{commentCount} comment{commentCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="border-t border-[#F1F5F9] dark:border-[#1E3A5F] px-3 py-1.5 flex items-center gap-1">
        <button
          onClick={handleLike}
          disabled={likePending || !currentUserId}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
            liked
              ? "text-[#1E6FFF] bg-[#EFF6FF] dark:text-[#60A5FA] dark:bg-[#1E3A5F]"
              : "text-[#64748B] dark:text-[#4B6A8A] hover:bg-[#F1F5F9] dark:hover:bg-[#1E3A5F] hover:text-[#1E6FFF] dark:hover:text-white disabled:opacity-50"
          )}
        >
          <ThumbsUp size={15} className={cn(liked && "fill-current")} />
          {liked ? "Liked" : "Like"}
        </button>

        {post.type === "job_request" && (
          <Link href={currentUserId ? `/jobs/${post.id}` : "/signup"} className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-[#1E6FFF] dark:text-[#60A5FA] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A5F] dark:hover:text-white transition-all">
              <Briefcase size={15} />
              Bid Now
            </button>
          </Link>
        )}

        {currentUserId !== post.author_id && (
          <Link href={currentUserId ? `/messages?with=${post.author_id}` : "/signup"} className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-[#64748B] dark:text-[#4B6A8A] hover:bg-[#F1F5F9] dark:hover:bg-[#1E3A5F] hover:text-[#1E6FFF] dark:hover:text-white transition-all">
              <MessageSquare size={15} />
              Message
            </button>
          </Link>
        )}
      </div>

      {/* Comments — always visible */}
      <div className="border-t border-[#F1F5F9] dark:border-[#1E3A5F] px-5 pt-4 pb-3.5">
        {comments.length > 0 && (
          <div className="flex flex-col gap-3 mb-3">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5">
                <Avatar name={c.profiles?.full_name ?? "?"} src={c.profiles?.avatar_url ?? undefined} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="bg-[#F8FAFC] dark:bg-[#0A1628] rounded-2xl px-4 py-2.5">
                    <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white mb-0.5">{c.profiles?.full_name ?? "Anonymous"}</p>
                    <p className="text-[14px] text-[#475569] dark:text-[#E5E7EB] leading-snug">{c.content}</p>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] dark:text-[#4B6A8A] mt-1 ml-3">{formatRelativeTime(c.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentUserId ? (
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 text-[14px] px-4 py-2.5 rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1F3C] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] dark:placeholder:text-[#4B6A8A] focus:outline-none focus:border-[#1E6FFF] focus:ring-2 focus:ring-[#1E6FFF]/20 transition-all"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="p-2.5 bg-[#1E6FFF] text-white rounded-2xl disabled:opacity-40 hover:bg-[#1a5fe0] transition-colors flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        ) : (
          <Link href="/login" className="text-[13px] text-[#1E6FFF] dark:text-[#60A5FA] font-semibold hover:underline">
            Sign in to comment
          </Link>
        )}
      </div>
    </div>
  );
}
