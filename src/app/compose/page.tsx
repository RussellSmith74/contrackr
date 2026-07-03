"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Send } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Input } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { createClient } from "@/lib/supabase/client";

const POST_TYPES = [
  { id: "work_showcase", label: "Work Showcase", desc: "Show off a completed job", emoji: "📸" },
  { id: "promotion",     label: "Special Offer",  desc: "Promote a deal or discount", emoji: "🏷️" },
  { id: "update",        label: "Business Update", desc: "Share news or updates", emoji: "📢" },
];

export default function ComposePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [postType, setPostType] = useState("work_showcase");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      supabase.from("profiles").select("role, location").eq("id", user.id).single().then(({ data }) => {
        setUserRole(data?.role ?? null);
        if (data?.location) setLocation(data.location);
        if (data?.role !== "contractor") router.push("/feed");
      });
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !userId) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Upload photos
      const photoUrls: string[] = [];
      for (const file of photos) {
        const ext = file.name.split(".").pop();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("job-photos").upload(path, file);
        if (!uploadErr) {
          const { data } = supabase.storage.from("job-photos").getPublicUrl(path);
          photoUrls.push(data.publicUrl);
        }
      }

      const { error: insertErr } = await supabase.from("feed_posts").insert({
        author_id: userId,
        author_role: "contractor",
        content: content.trim(),
        post_type: postType,
        category: category.trim() || null,
        location: location.trim() || null,
        photos: photoUrls,
      });

      if (insertErr) throw insertErr;
      router.push("/feed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  if (!userRole) return null;

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0D0D] dark:hover:text-white mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-2xl font-bold text-[#0A1628] dark:text-white mb-6">Create a Post</h1>

        {/* Post type selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {POST_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setPostType(t.id)}
              className={`p-4 rounded-xl border text-left transition-colors ${
                postType === t.id
                  ? "border-[#1E6FFF] bg-[#EFF6FF] dark:bg-[#1E3A5F]"
                  : "border-[#E5E7EB] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1F3C] hover:border-[#1E6FFF]/50"
              }`}
            >
              <span className="text-2xl block mb-1">{t.emoji}</span>
              <p className="text-sm font-semibold text-[#0D0D0D] dark:text-white">{t.label}</p>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-5 flex flex-col gap-4">
            <Textarea
              label="What do you want to share?"
              placeholder={
                postType === "work_showcase"
                  ? "Describe the job you completed — what you did, how it went, what materials you used..."
                  : postType === "promotion"
                  ? "Describe your offer — what's included, how long it lasts, how to claim it..."
                  : "Share a business update, tip, or announcement..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Trade / Category"
                placeholder="e.g. Roofing, Landscaping"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <Input
                label="Location"
                placeholder="City, State"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={18} className="text-[#1E6FFF]" />
              <h3 className="font-semibold text-[#0D0D0D] dark:text-white">Add Photos</h3>
              {postType === "work_showcase" && (
                <span className="text-xs text-[#1E6FFF] font-semibold bg-[#EFF6FF] dark:bg-[#1E3A5F] px-2 py-0.5 rounded-full ml-1">
                  Highly recommended
                </span>
              )}
            </div>
            <PhotoUpload
              value={photos}
              onChange={setPhotos}
              maxFiles={8}
              hint={postType === "work_showcase" ? "Before & after photos perform best" : "Add images to your post"}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!content.trim()}
          >
            <Send size={16} />
            Post to Feed
          </Button>
        </form>
      </div>
    </div>
  );
}
