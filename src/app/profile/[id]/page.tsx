"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Calendar, ChevronLeft, MessageSquare, Briefcase } from "lucide-react";
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
  created_at: string;
}

interface ActivityPost {
  id: string;
  source: "feed_post" | "job_post";
  title: string;
  content: string;
  created_at: string;
}

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

  const startConversation = useCallback(async () => {
    if (!profile) return;
    setMessaging(true);
    router.push(`/messages?with=${profile.id}`);
  }, [profile, router]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location, role, created_at")
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
          .select("id, content, created_at")
          .eq("author_id", p.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("job_posts")
          .select("id, title, description, created_at")
          .eq("customer_id", p.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const activity: ActivityPost[] = [
        ...(feedPosts ?? []).map((fp) => ({
          id: fp.id,
          source: "feed_post" as const,
          title: fp.content.split("\n")[0].slice(0, 80),
          content: fp.content,
          created_at: fp.created_at,
        })),
        ...(jobPosts ?? []).map((jp) => ({
          id: jp.id,
          source: "job_post" as const,
          title: jp.title,
          content: jp.description,
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
          <div className="h-24 bg-gradient-to-r from-[#0A1628] to-[#1E3A5F]" />

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name}
                size="xl"
                className="border-4 border-white dark:border-[#0D1F3C]"
              />
              {!isSelf && (
                <div className="mt-10">
                  <Button variant="outline" size="md" onClick={startConversation} loading={messaging}>
                    <MessageSquare size={16} />
                    Message
                  </Button>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-[#0A1628] dark:text-white">{profile.full_name}</h1>
            <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mt-0.5 capitalize">{profile.role}</p>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-[#6B7280] dark:text-[#94A3B8]">
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {profile.location}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                Member since {formatDate(profile.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Activity */}
        <h2 className="text-sm font-bold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wide mb-3">Activity</h2>
        <div className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-8 text-center">
              <Briefcase size={32} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
              <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">No activity yet.</p>
            </div>
          ) : (
            posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}?s=${post.source}`}>
                <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-5 hover:border-[#1E6FFF]/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-[#0D0D0D] dark:text-white">{post.title}</p>
                    <p className="text-xs text-[#9CA3AF] dark:text-[#64748B] flex-shrink-0 ml-3">{formatRelativeTime(post.created_at)}</p>
                  </div>
                  <p className="text-sm text-[#374151] dark:text-[#CBD5E1] leading-relaxed line-clamp-2">{post.content}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
