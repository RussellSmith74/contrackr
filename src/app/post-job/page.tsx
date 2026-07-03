"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Camera } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { CategoryCombobox } from "@/components/ui/CategoryCombobox";
import { SERVICE_CATEGORIES, TIMELINE_OPTIONS, BUDGET_RANGES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { LocationInput } from "@/components/ui/LocationInput";


export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    timeline: "",
    budget: "",
    photos: [] as File[],
  });
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to post a job.");

      // Upload photos to Storage
      const photoUrls: string[] = [];
      for (const file of form.photos) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("job-photos")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("job-photos").getPublicUrl(path);
        photoUrls.push(urlData.publicUrl);
      }

      const { error: insertError } = await supabase.from("job_posts").insert({
        customer_id: user.id,
        title: form.title,
        category: form.category,
        description: form.description,
        location: form.location,
        lat: locationCoords?.lat ?? null,
        lng: locationCoords?.lng ?? null,
        timeline: form.timeline || null,
        budget_range: form.budget || null,
        photos: photoUrls,
      });

      if (insertError) throw insertError;

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-[#ECFDF5] dark:bg-[#064E3B] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#059669] dark:text-[#34D399]" />
          </div>
          <h1 className="text-3xl font-bold text-[#0A1628] dark:text-white mb-3">
            Your job is posted!
          </h1>
          <p className="text-[#6B7280] dark:text-[#94A3B8] mb-8 leading-relaxed">
            We&apos;ve matched you with the top-rated <strong>{form.category}</strong> contractors in your area. Expect to hear from them soon.
          </p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" fullWidth onClick={() => router.push("/my-jobs")}>
              View My Job Post <ArrowRight size={18} />
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={() => router.push("/feed")}>
              Back to Feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0A1628] dark:text-white">Post a Job</h1>
          <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mt-1">
            Describe your project and contractors will start responding fast.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-5 flex flex-col gap-5">
            <Input
              name="title"
              label="Job Title"
              placeholder="e.g. Backyard fence installation"
              value={form.title}
              onChange={handleChange}
              required
              hint="Keep it short and specific"
            />

            <CategoryCombobox
              label="Service Category"
              value={form.category}
              onChange={(val) => setForm((p) => ({ ...p, category: val }))}
              required
              placeholder="Search or type a category..."
            />

            <Textarea
              name="description"
              label="Job Description"
              placeholder="Describe what needs to be done. Include current condition, desired outcome, size of the area, any specific requirements or materials, access details..."
              value={form.description}
              onChange={handleChange}
              required
              rows={6}
              hint="More detail = more accurate bids"
            />

            <LocationInput
              label="Location"
              placeholder="City, State"
              value={form.location}
              required
              onChange={(val, coords) => {
                setForm((p) => ({ ...p, location: val }));
                if (coords) setLocationCoords(coords);
              }}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                name="timeline"
                label="Timeline"
                value={form.timeline}
                onChange={handleChange}
                placeholder="When do you need it done?"
                options={TIMELINE_OPTIONS.map((t) => ({ value: t, label: t }))}
              />
              <Select
                name="budget"
                label="Budget Range"
                value={form.budget}
                onChange={handleChange}
                placeholder="What&apos;s your budget?"
                options={BUDGET_RANGES.map((b) => ({ value: b, label: b }))}
              />
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Camera size={18} className="text-[#1E6FFF]" />
              <h3 className="font-semibold text-[#0D0D0D] dark:text-white">Add Photos</h3>
              <span className="text-xs text-white font-semibold bg-[#1E6FFF] px-2 py-0.5 rounded-full ml-1">
                Recommended
              </span>
            </div>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mb-4">
              Photos help contractors understand exactly what&apos;s needed. Posts with photos receive 2× more bids.
            </p>
            <PhotoUpload
              value={form.photos}
              onChange={(files) => setForm((prev) => ({ ...prev, photos: files }))}
              maxFiles={10}
              hint="Photograph the area from multiple angles"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!form.title || !form.category || !form.description || !form.location}
          >
            Post Job — Get Free Bids <ArrowRight size={18} />
          </Button>

          <p className="text-xs text-[#9CA3AF] dark:text-[#64748B] text-center">
            Your post will be visible to all contractors in your area. 100% free — no fees.
          </p>
        </form>
      </div>
    </div>
  );
}
