"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Calendar, ChevronLeft, MessageSquare, Share2, Check, ShieldCheck, Crown, Briefcase, FileText } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location: string | null;
  role: "customer" | "contractor";
  bio: string | null;
  is_admin: boolean;
  is_founder: boolean;
  created_at: string;
}

interface ActivityPost {
  id: string;
  source: "feed_post" | "job_post";
  title: string;
  content: string;
  photos: string[];
  created_at: string;
}

type Tab = "activity" | "jobs";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("activity");

  const startConversation = useCallback(async () => {
    if (!profile) return;
    setMessaging(true);
    router.push(`/messages?with=${profile.id}`);
  }, [profile, router]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location, role, bio, is_admin, is_founder, created_at")
        .eq("id", id)
        .single();

      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Contractors have a richer profile page — send them there instead.
      if (p.role === "contractor") {
        const { data: cp } = await supabase
          .from("contractor_profiles")
          .select("id")
          .eq("user_id", p.id)
          .single();

        if (cp) {
          setRedirecting(true);
          router.replace(`/contractors/${cp.id}`);
          return;
        }
      }

      setProfile(p as Profile);

      const [{ data: feedPosts }, { data: jobPosts }] = await Promise.all([
        supabase
          .from("feed_posts")
          .select("id, content, photos, created_at")
          .eq("author_id", p.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("job_posts")
          .select("id, title, description, photos, created_at")
          .eq("customer_id", p.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const activity: ActivityPost[] = [
        ...(feedPosts ?? []).map((fp) => ({
          id: fp.id,
          source: "feed_post" as const,
          title: fp.content.split("\n")[0].slice(0, 80),
          content: fp.content,
          photos: fp.photos ?? [],
          created_at: fp.created_at,
        })),
        ...(jobPosts ?? []).map((jp) => ({
          id: jp.id,
          source: "job_post" as const,
          title: jp.title,
          content: jp.description,
          photos: jp.photos ?? [],
          created_at: jp.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPosts(activity);
      setLoading(false);
    }

    load();
  }, [id, router]);

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center text-[#6B7280] dark:text-[#94A3B8]">
          Loading…
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-lg font-bold text-[#0A1628] dark:text-white mb-2">Profile not found</p>
          <Link href="/feed" className="text-sm text-[#1E6FFF] hover:underline">
            ← Back to feed
          </Link>
        </div>
      </div>
    );
  }

  const isSelf = currentUserId === profile.id;
  const jobCount = posts.filter((p) => p.source === "job_post").length;
  const postCount = posts.filter((p) => p.source === "feed_post").length;
  const visiblePosts = activeTab === "jobs" ? posts.filter((p) => p.source === "job_post") : posts;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
        <Link href="/feed" className="flex items-center gap-1 text-sm text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0D0D] dark:hover:text-white w-fit mb-4">
          <ChevronLeft size={16} />
          Back to feed
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        {/* Profile header */}
        <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl overflow-hidden mb-5">
          <div className="h-32 bg-gradient-to-br from-[#0A1628] via-[#12294a] to-[#1E3A5F] relative">
            <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name}
                size="xl"
                className="!w-24 !h-24 border-4 border-white dark:border-[#0D1F3C] shadow-md"
              />
              <div className="flex items-center gap-2 mt-12">
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-[#E5E7EB] dark:border-[#1E3A5F] text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F3F4F6] dark:hover:bg-[#1E3A5F] transition-colors"
                  title="Share profile"
                >
                  {copied ? <Check size={16} className="text-[#059669]" /> : <Share2 size={16} />}
                </button>
                {!isSelf && (
                  <Button variant="primary" size="md" onClick={startConversation} loading={messaging}>
                    <MessageSquare size={16} />
                    Message
                  </Button>
                )}
                {isSelf && (
                  <Link href="/settings">
                    <Button variant="outline" size="md">Edit Profile</Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-[#0A1628] dark:text-white">{profile.full_name}</h1>
              {profile.is_founder && (
                <Crown size={18} className="text-[#D4AF37] fill-[#D4AF37]" aria-label="Founder" />
              )}
              {profile.is_admin && (
                <ShieldCheck size={18} className="text-[#1E6FFF]" aria-label="Moderator" />
              )}
            </div>
            <p className="text-[#6B7280] dark:text-[#94A3B8] text-[15px] mt-0.5">
              Homeowner{profile.location ? ` · ${profile.location}` : ""}
            </p>

            {profile.bio && (
              <p className="text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed mt-3 max-w-xl">{profile.bio}</p>
            )}

            {/* Stat row */}
            <div className="flex items-center gap-6 mt-5 pt-5 border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
              <div>
                <p className="text-lg font-bold text-[#0A1628] dark:text-white leading-none">{postCount}</p>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">Posts</p>
              </div>
              <div className="w-px h-8 bg-[#F1F5F9] dark:bg-[#1E3A5F]" />
              <div>
                <p className="text-lg font-bold text-[#0A1628] dark:text-white leading-none">{jobCount}</p>
                <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">Jobs posted</p>
              </div>
              <div className="w-px h-8 bg-[#F1F5F9] dark:bg-[#1E3A5F]" />
              <div className="flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                <Calendar size={14} />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-1 mb-4">
          {([["activity", "Activity", FileText], ["jobs", "Jobs", Briefcase]] as [Tab, string, React.ElementType][]).map(([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-[#0A1628] dark:bg-[#1E6FFF] text-white"
                  : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0D0D] dark:hover:text-white"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Activity */}
        <div className="flex flex-col gap-4">
          {visiblePosts.length === 0 ? (
            <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-10 text-center">
              <Briefcase size={32} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#374151] dark:text-[#CBD5E1]">Nothing here yet</p>
              <p className="text-xs text-[#9CA3AF] dark:text-[#64748B] mt-1">
                {activeTab === "jobs" ? "No jobs posted yet." : "No activity to show."}
              </p>
            </div>
          ) : (
            visiblePosts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}?s=${post.source}`}>
                <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl overflow-hidden hover:border-[#CBD5E1] dark:hover:border-[#2A4A73] transition-colors">
                  <div className="p-5 pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-[#0D0D0D] dark:text-white">{profile.full_name}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${post.source === "job_post" ? "text-[#1E6FFF] bg-[#EFF6FF] dark:bg-[#1E3A5F] dark:text-[#60A5FA]" : "text-[#7C3AED] bg-[#F5F3FF] dark:bg-[#2E1065] dark:text-[#A78BFA]"}`}>
                            {post.source === "job_post" ? "Job request" : "Post"}
                          </span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] dark:text-[#64748B]">{formatRelativeTime(post.created_at)}</p>
                      </div>
                    </div>
                    {post.source === "job_post" && (
                      <p className="text-[15px] font-bold text-[#0F172A] dark:text-white leading-snug mb-1.5">{post.title}</p>
                    )}
                    <p className="text-sm text-[#475569] dark:text-[#CBD5E1] leading-relaxed line-clamp-3">
                      {post.source === "feed_post"
                        ? post.content.split("\n").slice(1).join("\n").trim() || post.content
                        : post.content}
                    </p>
                  </div>

                  {post.photos.length > 0 && (
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
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
