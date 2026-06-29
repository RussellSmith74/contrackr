"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Clock, ThumbsUp, MessageSquare, DollarSign, Send, Briefcase, ChevronRight, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const MOCK_CONTRACTOR_POSTS = [
  {
    id: "mock-2",
    type: "work_showcase" as const,
    author: { name: "Ridgeline Roofing Co.", avatar: null, role: "contractor" as const },
    location: "Brandon, MS",
    category: "Roofing",
    title: "GAF Timberline roof replacement — before & after",
    content: "Just wrapped up a full roof replacement on this 2,400 sq ft home. Removed old 3-tab shingles, installed GAF Timberline HDZ in Charcoal. 30-year warranty. Completed in 2 days. Call us for a free inspection and estimate.",
    photos: [] as string[],
    timeline: null,
    budget: null,
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    bids: null,
    rating: 4.9,
    reviewCount: 47,
    status: null,
  },
  {
    id: "mock-4",
    type: "promotion" as const,
    author: { name: "Precision Electric", avatar: null, role: "contractor" as const },
    location: "Jackson, MS",
    category: "Electrical",
    title: "Summer Special — Panel Upgrades 15% Off",
    content: "Now through July 31st, we're offering 15% off all electrical panel upgrades and whole-home rewires. Licensed and insured. Free estimates — call or message us today.",
    photos: [] as string[],
    timeline: null,
    budget: null,
    time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    bids: null,
    rating: 4.7,
    reviewCount: 31,
    status: null,
  },
];

interface Post {
  id: string;
  type: "job_request" | "work_showcase" | "promotion";
  author: { name: string; avatar: string | null; role: "customer" | "contractor" };
  location: string;
  category: string;
  title: string;
  content: string;
  photos: string[];
  timeline: string | null;
  budget: string | null;
  time: string;
  bids: number | null;
  rating?: number;
  reviewCount?: number;
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

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, role")
          .eq("id", user.id)
          .single();
        if (profile) {
          setCurrentUserName(profile.full_name);
          setCurrentUserAvatar(profile.avatar_url);
          setCurrentUserRole(profile.role as "customer" | "contractor");
        }
      }

      const { data: jobPosts } = await supabase
        .from("job_posts")
        .select("id, title, description, category, location, timeline, budget_range, photos, bid_count, created_at, status, profiles(full_name, avatar_url)")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      const realPosts: Post[] = (jobPosts || []).map((p) => ({
        id: p.id,
        type: "job_request" as const,
        author: {
          name: (p.profiles as unknown as { full_name: string; avatar_url: string | null } | null)?.full_name ?? "Anonymous",
          avatar: (p.profiles as unknown as { full_name: string; avatar_url: string | null } | null)?.avatar_url ?? null,
          role: "customer" as const,
        },
        location: p.location,
        category: p.category,
        title: p.title,
        content: p.description,
        photos: p.photos ?? [],
        timeline: p.timeline,
        budget: p.budget_range,
        time: p.created_at,
        bids: p.bid_count ?? 0,
        status: "open",
      }));

      const all = [...realPosts, ...MOCK_CONTRACTOR_POSTS].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      setPosts(all);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const filtered = posts.filter((post) => {
    if (activeFilter === "Job Requests" && post.type !== "job_request") return false;
    if (activeFilter === "Contractor Posts" && post.type === "job_request") return false;
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
                    href={currentUserRole === "customer" ? "/post-job" : "/feed"}
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
                      getCategoryLabel={getCategoryLabel}
                      getCategoryIcon={getCategoryIcon}
                    />
                  ))
              }
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <aside className="hidden lg:flex flex-col gap-4 w-[268px] flex-shrink-0">

            {/* Quick Actions */}
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

            {/* Browse by Trade */}
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

            {/* Signup CTA */}
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

function FeedCard({
  post,
  currentUserId,
  getCategoryLabel,
  getCategoryIcon,
}: {
  post: Post;
  currentUserId: string | null;
  getCategoryLabel: (id: string) => string;
  getCategoryIcon: (id: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount] = useState(Math.floor(Math.random() * 14) + 1);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMock = post.id.startsWith("mock-");
  const isContractor = post.author.role === "contractor";

  const typeConfig = {
    job_request:   { label: "Looking for help", light: "text-[#1E6FFF] bg-[#EFF6FF]",       dark: "dark:text-[#60A5FA] dark:bg-[#1E3A5F]" },
    work_showcase: { label: "Work showcase",    light: "text-[#059669] bg-[#ECFDF5]",        dark: "dark:text-[#34D399] dark:bg-[#064E3B]" },
    promotion:     { label: "Special offer",    light: "text-[#D97706] bg-[#FFFBEB]",        dark: "dark:text-[#FCD34D] dark:bg-[#451A03]" },
  };
  const type = typeConfig[post.type];

  const loadComments = async () => {
    if (isMock) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("post_comments")
      .select("id, content, created_at, profiles(full_name, avatar_url)")
      .eq("job_post_id", post.id)
      .order("created_at", { ascending: true });
    if (data) {
      setComments(data as unknown as Comment[]);
      setCommentCount(data.length);
    }
  };

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) loadComments();
    setShowComments((prev) => !prev);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUserId || isMock) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ job_post_id: post.id, author_id: currentUserId, content: commentText.trim() })
      .select("id, content, created_at, profiles(full_name, avatar_url)")
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, data as unknown as Comment]);
      setCommentCount((prev) => prev + 1);
      setCommentText("");
    }
    setSubmitting(false);
  };

  const categoryLabel = isContractor ? post.category : getCategoryLabel(post.category);
  const categoryIcon  = isContractor ? "" : getCategoryIcon(post.category);

  return (
    <div className={cn(
      "bg-white dark:bg-[#0D1F3C] rounded-2xl border overflow-hidden transition-all duration-200 shadow-sm dark:shadow-none",
      "hover:shadow-md hover:border-[#1E6FFF]/50 dark:hover:border-[#1E6FFF] dark:hover:shadow-[0_0_0_1px_rgba(30,111,255,0.3)]",
      isContractor
        ? "border-l-[3px] border-l-[#1E6FFF] border-[#E2E8F0] dark:border-[#1E3A5F]"
        : "border-[#E2E8F0] dark:border-[#1E3A5F]"
    )}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <Avatar src={post.author.avatar} name={post.author.name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-[#0F172A] dark:text-white text-[15px] leading-tight">{post.author.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[13px] text-[#64748B] dark:text-[#94A3B8] capitalize font-medium">{post.author.role}</span>
                  <span className="text-[#CBD5E1] dark:text-[#1E3A5F]">·</span>
                  <span className="flex items-center gap-1 text-[13px] text-[#94A3B8] dark:text-[#4B6A8A]">
                    <MapPin size={11} />{post.location}
                  </span>
                  <span className="text-[#CBD5E1] dark:text-[#1E3A5F]">·</span>
                  <span className="text-[13px] text-[#94A3B8] dark:text-[#4B6A8A]">{formatRelativeTime(post.time)}</span>
                </div>
              </div>
              <span className={cn("text-[11px] font-bold px-3 py-1.5 rounded-full flex-shrink-0 tracking-wide uppercase whitespace-nowrap", type.light, type.dark)}>
                {type.label}
              </span>
            </div>
          </div>
        </div>

        {/* Category badge */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1E6FFF] bg-[#EFF6FF] dark:text-[#60A5FA] dark:bg-[#1E3A5F] px-3 py-1.5 rounded-full">
            {categoryIcon && <span>{categoryIcon}</span>}
            {categoryLabel}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[18px] font-black text-[#0F172A] dark:text-white leading-snug mb-2.5">
          {post.title}
        </h3>

        {/* Body */}
        <p className={cn("text-[14px] text-[#475569] dark:text-[#E5E7EB] leading-relaxed", !expanded && "line-clamp-3")}>
          {post.content}
        </p>
        {post.content.length > 180 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[13px] text-[#1E6FFF] dark:text-[#60A5FA] font-semibold mt-1 hover:underline"
          >
            {expanded ? "see less" : "...see more"}
          </button>
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

        {/* Photos */}
        {post.photos && post.photos.length > 0 && (
          <div className={cn("mt-4 grid gap-1.5 rounded-xl overflow-hidden", post.photos.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
            {post.photos.slice(0, 4).map((url, i) => (
              <div key={i} className={cn("relative bg-[#F1F5F9] dark:bg-[#1E3A5F]", post.photos.length === 1 ? "aspect-[16/9]" : "aspect-square")}>
                <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="300px" />
                {i === 3 && post.photos.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-black text-xl">+{post.photos.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Like count row */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="px-6 py-2 flex items-center justify-between text-[12px] text-[#94A3B8] dark:text-[#4B6A8A] border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
          <span className="flex items-center gap-1.5">
            <span className="w-[18px] h-[18px] bg-[#1E6FFF] rounded-full flex items-center justify-center">
              <ThumbsUp size={10} className="text-white" />
            </span>
            {likeCount + (liked ? 1 : 0)}
          </span>
          {commentCount > 0 && (
            <button onClick={handleToggleComments} className="hover:text-[#1E6FFF] dark:hover:text-[#60A5FA] hover:underline transition-colors">
              {commentCount} comment{commentCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="border-t border-[#F1F5F9] dark:border-[#1E3A5F] px-3 py-1.5 flex items-center gap-1">
        <button
          onClick={() => setLiked(!liked)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
            liked
              ? "text-[#1E6FFF] bg-[#EFF6FF] dark:text-[#60A5FA] dark:bg-[#1E3A5F]"
              : "text-[#64748B] dark:text-[#4B6A8A] hover:bg-[#F1F5F9] dark:hover:bg-[#1E3A5F] hover:text-[#1E6FFF] dark:hover:text-white"
          )}
        >
          <ThumbsUp size={15} className={cn(liked && "fill-current")} />
          Like
        </button>

        {!isMock && (
          <button
            onClick={handleToggleComments}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
              showComments
                ? "text-[#1E6FFF] bg-[#EFF6FF] dark:text-[#60A5FA] dark:bg-[#1E3A5F]"
                : "text-[#64748B] dark:text-[#4B6A8A] hover:bg-[#F1F5F9] dark:hover:bg-[#1E3A5F] hover:text-[#1E6FFF] dark:hover:text-white"
            )}
          >
            <MessageSquare size={15} />
            Comment
          </button>
        )}

        {post.type === "job_request" ? (
          <Link href={currentUserId ? `/jobs/${post.id}` : "/signup"} className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-[#1E6FFF] dark:text-[#60A5FA] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A5F] dark:hover:text-white transition-all">
              <Briefcase size={15} />
              Bid Now
            </button>
          </Link>
        ) : (
          <Link href={currentUserId ? "/messages" : "/signup"} className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-[#64748B] dark:text-[#4B6A8A] hover:bg-[#F1F5F9] dark:hover:bg-[#1E3A5F] hover:text-[#1E6FFF] dark:hover:text-white transition-all">
              <MessageSquare size={15} />
              Message
            </button>
          </Link>
        )}
      </div>

      {/* Comments */}
      {showComments && !isMock && (
        <div className="border-t border-[#F1F5F9] dark:border-[#1E3A5F] px-6 py-4 bg-[#F8FAFC] dark:bg-[#0A1628]">
          {comments.length > 0 && (
            <div className="flex flex-col gap-3 mb-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar name={c.profiles?.full_name ?? "?"} src={c.profiles?.avatar_url ?? undefined} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-white dark:bg-[#0D1F3C] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl px-4 py-3">
                      <p className="text-[13px] font-bold text-[#0F172A] dark:text-white mb-0.5">{c.profiles?.full_name ?? "Anonymous"}</p>
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
      )}
    </div>
  );
}
