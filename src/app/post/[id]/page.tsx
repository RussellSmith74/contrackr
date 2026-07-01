"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ThumbsUp, Send, MapPin, Clock, DollarSign, Briefcase, MessageSquare, Trash2, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SERVICE_CATEGORIES } from "@/lib/constants";

interface Post {
  id: string;
  source: "feed_post" | "job_post";
  type: "job_request" | "work_showcase" | "promotion" | "update";
  author_id: string;
  author: { name: string; avatar: string | null; role: string; is_admin: boolean };
  location: string;
  category: string;
  title: string;
  content: string;
  photos: string[];
  timeline: string | null;
  budget: string | null;
  time: string;
  bids: number | null;
  likes_count: number;
  status: "open" | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

export default function PostPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const source = searchParams.get("s") ?? "feed_post";

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likePending, setLikePending] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMyId(user.id);
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
        setIsAdmin((profile as { is_admin?: boolean })?.is_admin ?? false);

        // Check liked
        supabase.from("likes").select("id").eq("post_id", id).eq("user_id", user.id).single()
          .then(({ data }) => { if (data) setLiked(true); });
      }

      // Fetch post
      if (source === "job_post") {
        const { data } = await supabase
          .from("job_posts")
          .select("id, title, description, category, location, timeline, budget_range, photos, bid_count, created_at, status, profiles(id, full_name, avatar_url, is_admin)")
          .eq("id", id)
          .single();
        if (data) {
          const profile = data.profiles as unknown as { id: string; full_name: string; avatar_url: string | null; is_admin?: boolean } | null;
          setPost({
            id: data.id,
            source: "job_post",
            type: "job_request",
            author_id: profile?.id ?? "",
            author: { name: profile?.full_name ?? "Customer", avatar: profile?.avatar_url ?? null, role: "customer", is_admin: profile?.is_admin ?? false },
            location: data.location,
            category: data.category,
            title: data.title,
            content: data.description,
            photos: data.photos ?? [],
            timeline: data.timeline,
            budget: data.budget_range,
            time: data.created_at,
            bids: data.bid_count ?? 0,
            likes_count: 0,
            status: data.status as "open" | null,
          });
          setEditTitle(data.title);
          setEditContent(data.description);
        }
      } else {
        const { data } = await supabase
          .from("feed_posts")
          .select("id, content, post_type, category, location, photos, likes_count, created_at, profiles(id, full_name, avatar_url, is_admin)")
          .eq("id", id)
          .single();
        if (data) {
          const profile = data.profiles as unknown as { id: string; full_name: string; avatar_url: string | null; is_admin?: boolean } | null;
          const postType = data.post_type as "work_showcase" | "promotion" | "update";
          setPost({
            id: data.id,
            source: "feed_post",
            type: postType,
            author_id: profile?.id ?? "",
            author: { name: profile?.full_name ?? "Contractor", avatar: profile?.avatar_url ?? null, role: "contractor", is_admin: profile?.is_admin ?? false },
            location: data.location ?? "",
            category: data.category ?? "",
            title: data.content.split("\n")[0].slice(0, 80),
            content: data.content,
            photos: data.photos ?? [],
            timeline: null,
            budget: null,
            time: data.created_at,
            bids: null,
            likes_count: data.likes_count ?? 0,
            status: null,
          });
          setLikeCount(data.likes_count ?? 0);
          setEditContent(data.content);
        }
      }

      // Fetch comments
      const { data: commentData } = await supabase
        .from("comments")
        .select("id, content, created_at, profiles(full_name, avatar_url)")
        .eq("post_id", id)
        .order("created_at", { ascending: true });
      if (commentData) setComments(commentData as unknown as Comment[]);

      setLoading(false);
    };
    load();
  }, [id, source]);

  const handleLike = async () => {
    if (!myId || likePending) return;
    setLikePending(true);
    const supabase = createClient();
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", id).eq("user_id", myId);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      if (post?.source === "feed_post") await supabase.from("feed_posts").update({ likes_count: likeCount - 1 }).eq("id", id);
    } else {
      await supabase.from("likes").insert({ post_id: id, user_id: myId });
      setLiked(true);
      setLikeCount((c) => c + 1);
      if (post?.source === "feed_post") await supabase.from("feed_posts").update({ likes_count: likeCount + 1 }).eq("id", id);
    }
    setLikePending(false);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !myId) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: id, author_id: myId, content: commentText.trim() })
      .select("id, content, created_at, profiles(full_name, avatar_url)")
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, data as unknown as Comment]);
      setCommentText("");
      if (post?.source === "feed_post") {
        await supabase.from("feed_posts").update({ comments_count: comments.length + 1 }).eq("id", id);
      }
    }
    setSubmitting(false);
  };

  const handleSaveEdit = async () => {
    if (!post) return;
    setSaving(true);
    const supabase = createClient();
    if (post.source === "feed_post") {
      await supabase.from("feed_posts").update({ content: editContent }).eq("id", id);
      setPost((p) => p ? { ...p, content: editContent, title: editContent.split("\n")[0].slice(0, 80) } : p);
    } else {
      await supabase.from("job_posts").update({ title: editTitle, description: editContent }).eq("id", id);
      setPost((p) => p ? { ...p, title: editTitle, content: editContent } : p);
    }
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!post || !confirm("Delete this post?")) return;
    setDeleting(true);
    const supabase = createClient();
    if (post.source === "feed_post") {
      await supabase.from("feed_posts").delete().eq("id", id);
    } else {
      await supabase.from("job_posts").delete().eq("id", id);
    }
    router.push("/feed");
  };

  const getCategoryLabel = (catId: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === catId)?.label ?? catId;
  const getCategoryIcon = (catId: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === catId)?.icon ?? "📋";

  const typeConfig = {
    job_request:   { label: "Looking for help", cls: "text-[#1E6FFF] bg-[#EFF6FF]" },
    work_showcase: { label: "Work showcase",    cls: "text-[#059669] bg-[#ECFDF5]" },
    promotion:     { label: "Special offer",    cls: "text-[#D97706] bg-[#FFFBEB]" },
    update:        { label: "Update",           cls: "text-[#7C3AED] bg-[#F5F3FF]" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
          <div className="bg-white dark:bg-[#0D1F3C] rounded-2xl p-6">
            <div className="flex gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-[#E2E8F0] dark:bg-[#1E3A5F]" />
              <div className="flex-1">
                <div className="h-4 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded w-32 mb-2" />
                <div className="h-3 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded w-24" />
              </div>
            </div>
            <div className="h-6 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded w-3/4 mb-3" />
            <div className="h-4 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded w-full mb-2" />
            <div className="h-4 bg-[#E2E8F0] dark:bg-[#1E3A5F] rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-lg font-bold text-[#0F172A] dark:text-white">Post not found</p>
          <Link href="/feed" className="text-[#1E6FFF] text-sm mt-2 inline-block hover:underline">Back to feed</Link>
        </div>
      </div>
    );
  }

  const canEdit = myId === post.author_id || isAdmin;
  const type = typeConfig[post.type] ?? typeConfig.update;

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8] mb-4 hover:text-[#0F172A] dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Post card */}
        <div className="bg-white dark:bg-[#0D1F3C] rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] shadow-sm overflow-hidden mb-4">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start gap-3.5 mb-4">
              <Avatar src={post.author.avatar} name={post.author.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#0F172A] dark:text-white text-[15px]">{post.author.name}</p>
                      {post.author.is_admin && (
                        <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#0A1628] text-[#1E6FFF] border border-[#1E6FFF]/40">
                          Founder
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[13px] text-[#64748B] dark:text-[#94A3B8] capitalize">{post.author.role}</span>
                      {post.location && (
                        <>
                          <span className="text-[#CBD5E1]">·</span>
                          <span className="flex items-center gap-1 text-[13px] text-[#94A3B8]">
                            <MapPin size={11} />{post.location}
                          </span>
                        </>
                      )}
                      <span className="text-[#CBD5E1]">·</span>
                      <span className="text-[13px] text-[#94A3B8]">{formatRelativeTime(post.time)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("text-[11px] font-bold px-3 py-1.5 rounded-full tracking-wide uppercase", type.cls)}>
                      {type.label}
                    </span>
                    {canEdit && !editing && (
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(true)} className="p-1.5 text-[#CBD5E1] hover:text-[#1E6FFF] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A5F] rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={handleDelete} disabled={deleting} className="p-1.5 text-[#CBD5E1] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category */}
            {post.category && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1E6FFF] bg-[#EFF6FF] dark:text-[#60A5FA] dark:bg-[#1E3A5F] px-3 py-1.5 rounded-full">
                  {post.source === "job_post" && <span>{getCategoryIcon(post.category)}</span>}
                  {getCategoryLabel(post.category)}
                </span>
              </div>
            )}

            {/* Title */}
            {editing && post.source === "job_post" ? (
              <input
                className="w-full text-[20px] font-black text-[#0F172A] dark:text-white bg-[#F8FAFC] dark:bg-[#0A1628] border border-[#1E6FFF] rounded-lg px-3 py-2 mb-3 focus:outline-none"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            ) : (
              <h1 className="text-[20px] font-black text-[#0F172A] dark:text-white leading-snug mb-3">{post.title}</h1>
            )}

            {/* Content */}
            {editing ? (
              <textarea
                className="w-full text-[15px] text-[#475569] dark:text-[#E5E7EB] bg-[#F8FAFC] dark:bg-[#0A1628] border border-[#1E6FFF] rounded-lg px-3 py-2 leading-relaxed focus:outline-none resize-none mb-3"
                rows={6}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            ) : (
              <p className="text-[15px] text-[#475569] dark:text-[#E5E7EB] leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>
            )}

            {editing && (
              <div className="flex gap-2 mb-4">
                <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-[#1E6FFF] text-white text-sm font-semibold rounded-lg hover:bg-[#1558CC] transition-colors disabled:opacity-50">
                  <Check size={14} />{saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-4 py-2 bg-[#F1F5F9] dark:bg-[#1E3A5F] text-[#475569] dark:text-[#94A3B8] text-sm font-semibold rounded-lg">
                  <X size={14} />Cancel
                </button>
              </div>
            )}

            {/* Meta chips */}
            {(post.timeline || post.budget || (post.bids !== null && post.bids > 0)) && (
              <div className="flex flex-wrap gap-2 mb-4">
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
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1E6FFF] bg-[#EFF6FF] px-3 py-1.5 rounded-full">
                    {post.bids} bid{post.bids !== 1 ? "s" : ""} so far
                  </span>
                )}
              </div>
            )}

            {/* Photos */}
            {post.photos.length > 0 && (
              <div className={cn("grid gap-1.5 rounded-xl overflow-hidden", post.photos.length === 1 ? "grid-cols-1" : "grid-cols-2")}>
                {post.photos.map((url, i) => (
                  <div key={i} className={cn("relative bg-[#F1F5F9] dark:bg-[#1E3A5F]", post.photos.length === 1 ? "aspect-[16/9]" : "aspect-square")}>
                    <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="600px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Like count */}
          {likeCount > 0 && (
            <div className="px-6 py-2 flex items-center gap-1.5 text-[12px] text-[#94A3B8] border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
              <span className="w-[18px] h-[18px] bg-[#1E6FFF] rounded-full flex items-center justify-center">
                <ThumbsUp size={10} className="text-white" />
              </span>
              {likeCount} like{likeCount !== 1 ? "s" : ""}
            </div>
          )}

          {/* Action bar */}
          <div className="border-t border-[#F1F5F9] dark:border-[#1E3A5F] px-3 py-1.5 flex items-center gap-1">
            <button
              onClick={handleLike}
              disabled={likePending || !myId}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all",
                liked
                  ? "text-[#1E6FFF] bg-[#EFF6FF] dark:text-[#60A5FA] dark:bg-[#1E3A5F]"
                  : "text-[#64748B] dark:text-[#4B6A8A] hover:bg-[#F1F5F9] dark:hover:bg-[#1E3A5F] hover:text-[#1E6FFF] disabled:opacity-50"
              )}
            >
              <ThumbsUp size={15} className={cn(liked && "fill-current")} />
              {liked ? "Liked" : "Like"}
            </button>

            <button
              onClick={() => inputRef.current?.focus()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-[#64748B] dark:text-[#4B6A8A] hover:bg-[#F1F5F9] dark:hover:bg-[#1E3A5F] hover:text-[#1E6FFF] dark:hover:text-white transition-all"
            >
              <MessageSquare size={15} />
              Comment
            </button>

            {post.type === "job_request" && (
              <Link href={myId ? `/jobs/${post.id}` : "/signup"} className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-[#1E6FFF] hover:bg-[#EFF6FF] dark:hover:bg-[#1E3A5F] transition-all">
                  <Briefcase size={15} />
                  Bid Now
                </button>
              </Link>
            )}

            {myId !== post.author_id && (
              <Link href={myId ? `/messages?with=${post.author_id}` : "/signup"} className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-[#64748B] dark:text-[#4B6A8A] hover:bg-[#F1F5F9] dark:hover:bg-[#1E3A5F] hover:text-[#1E6FFF] dark:hover:text-white transition-all">
                  <MessageSquare size={15} />
                  Message
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white dark:bg-[#0D1F3C] rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] shadow-sm p-6">
          <h2 className="font-black text-[#0F172A] dark:text-white text-[16px] mb-5">
            Comments {comments.length > 0 && <span className="text-[#94A3B8] font-normal text-[14px]">({comments.length})</span>}
          </h2>

          {/* Comment input */}
          {myId ? (
            <form onSubmit={handleComment} className="flex items-center gap-3 mb-6">
              <input
                ref={inputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 text-[14px] px-4 py-3 rounded-2xl border border-[#E2E8F0] dark:border-[#1E3A5F] bg-[#F8FAFC] dark:bg-[#0A1628] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E6FFF] focus:ring-2 focus:ring-[#1E6FFF]/20 transition-all"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="p-3 bg-[#1E6FFF] text-white rounded-2xl disabled:opacity-40 hover:bg-[#1558CC] transition-colors flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          ) : (
            <Link href="/login" className="block text-center text-[13px] text-[#1E6FFF] font-semibold hover:underline mb-6">
              Sign in to comment
            </Link>
          )}

          {/* All comments */}
          {comments.length === 0 ? (
            <p className="text-center text-[14px] text-[#94A3B8] dark:text-[#4B6A8A] py-6">No comments yet — be the first!</p>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <Avatar name={c.profiles?.full_name ?? "?"} src={c.profiles?.avatar_url ?? undefined} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-[#F8FAFC] dark:bg-[#0A1628] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl px-4 py-3">
                      <p className="text-[13px] font-bold text-[#0F172A] dark:text-white mb-1">{c.profiles?.full_name ?? "Anonymous"}</p>
                      <p className="text-[14px] text-[#475569] dark:text-[#E5E7EB] leading-relaxed">{c.content}</p>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] mt-1 ml-3">{formatRelativeTime(c.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
