"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { SERVICE_CATEGORIES, TIMELINE_OPTIONS, BUDGET_RANGES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { LocationInput } from "@/components/ui/LocationInput";

export default function CustomerOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<"welcome" | "post-job" | "done">("welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [job, setJob] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    timeline: "",
    budget: "",
    photos: [] as File[],
  });
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setJob((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Upload photos
      const photoUrls: string[] = [];
      for (const file of job.photos) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("job-photos")
          .upload(path, file);
        if (!uploadErr) {
          const { data } = supabase.storage.from("job-photos").getPublicUrl(path);
          photoUrls.push(data.publicUrl);
        }
      }

      // Insert job post
      const { error: insertErr } = await supabase.from("job_posts").insert({
        customer_id: user.id,
        title: job.title,
        category: job.category,
        description: job.description,
        location: job.location,
        lat: locationCoords?.lat ?? null,
        lng: locationCoords?.lng ?? null,
        timeline: job.timeline || null,
        budget_range: job.budget || null,
        photos: photoUrls,
        status: "open",
      });

      if (insertErr) throw insertErr;

      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "welcome") {
    return (
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <div className="w-20 h-20 rounded-full bg-[#0A1628] flex items-center justify-center overflow-hidden">
              {avatarUrl
                ? <Image src={avatarUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
                : <span className="text-4xl">🏠</span>
              }
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#1E6FFF] rounded-full flex items-center justify-center shadow-md hover:bg-[#1558CC] transition-colors disabled:opacity-60"
            >
              {uploadingAvatar ? <Loader2 size={13} className="text-white animate-spin" /> : <Camera size={13} className="text-white" />}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="text-xs text-[#9CA3AF] mb-3">{uploadingAvatar ? "Uploading..." : "Tap to add a profile photo"}</p>
          <h1 className="text-3xl font-black text-[#0A1628] mb-3">
            Welcome to Contrakr!
          </h1>
          <p className="text-[#6B7280] leading-relaxed">
            The fastest way to find trusted contractors in your area. Post your job and start getting bids in minutes — completely free.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {[
            { icon: "📸", text: "Add photos so contractors can see exactly what needs to be done" },
            { icon: "⚡", text: "Get matched to top-rated contractors in your area automatically" },
            { icon: "💬", text: "Message contractors directly and compare bids side by side" },
            { icon: "⭐", text: "Leave verified reviews after every completed job" },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-3 bg-white border border-[#E5E7EB] rounded-xl p-4">
              <span className="text-xl">{item.icon}</span>
              <p className="text-sm text-[#374151] font-medium leading-snug">{item.text}</p>
            </div>
          ))}
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={() => setStep("post-job")}>
          Post My First Job <ArrowRight size={18} />
        </Button>
        <button
          onClick={() => router.push("/feed")}
          className="w-full text-sm text-[#9CA3AF] text-center mt-3 hover:text-[#6B7280]"
        >
          Browse the feed first
        </button>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="w-full max-w-lg text-center">
        <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-[#059669]" />
        </div>
        <h1 className="text-3xl font-black text-[#0A1628] mb-3">
          Your job is posted!
        </h1>
        <p className="text-[#6B7280] mb-2 leading-relaxed">
          Contractors in your area are being notified right now. You&apos;ll start receiving bids and messages shortly.
        </p>
        <p className="text-sm text-[#9CA3AF] mb-8">
          We matched you with the top contractors in <strong>{job.category}</strong> near {job.location}.
        </p>

        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" fullWidth onClick={() => router.push("/my-jobs")}>
            View My Job Post <ArrowRight size={18} />
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => router.push("/feed")}>
            Explore the Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => setStep("welcome")}
          className="text-sm text-[#6B7280] hover:text-[#0D0D0D] mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-black text-[#0A1628]">Post your job</h2>
        <p className="text-[#6B7280] text-sm mt-1">
          The more detail you give, the better your bids will be.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-5">
          <Input
            name="title"
            label="Job Title"
            placeholder="Backyard landscaping overhaul"
            value={job.title}
            onChange={handleChange}
            required
            hint="A clear title gets more views from the right contractors"
          />

          <Select
            name="category"
            label="Service Type"
            value={job.category}
            onChange={handleChange}
            required
            placeholder="Select a category"
            options={SERVICE_CATEGORIES.map((c) => ({ value: c.id, label: `${c.icon} ${c.label}` }))}
          />

          <Textarea
            name="description"
            label="Job Description"
            placeholder="Describe exactly what you need done. Include the size of the area, current condition, what you want the end result to look like, any specific materials or brands you prefer..."
            value={job.description}
            onChange={handleChange}
            required
            rows={5}
            hint="The more detail you include, the more accurate your bids will be"
          />

          <LocationInput
            label="Location"
            placeholder="City, State"
            value={job.location}
            required
            onChange={(val, coords) => {
              setJob((p) => ({ ...p, location: val }));
              if (coords) setLocationCoords(coords);
            }}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Select
              name="timeline"
              label="When do you need this done?"
              value={job.timeline}
              onChange={handleChange}
              placeholder="Select timeline"
              options={TIMELINE_OPTIONS.map((t) => ({ value: t, label: t }))}
            />
            <Select
              name="budget"
              label="Budget Range"
              value={job.budget}
              onChange={handleChange}
              placeholder="Select budget"
              options={BUDGET_RANGES.map((b) => ({ value: b, label: b }))}
            />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Camera size={18} className="text-[#1E6FFF]" />
            <h3 className="font-bold text-[#0D0D0D]">Add Photos</h3>
            <span className="text-xs text-[#1E6FFF] font-semibold bg-[#EFF6FF] px-2 py-0.5 rounded-full ml-1">
              Highly recommended
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mb-4">
            Photos help contractors understand the scope of the job before they bid. Job posts with photos get 2× more responses.
          </p>
          <PhotoUpload
            value={job.photos}
            onChange={(files) => setJob((prev) => ({ ...prev, photos: files }))}
            maxFiles={8}
            hint="Photograph the area that needs work from multiple angles"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!job.title || !job.category || !job.description || !job.location}
        >
          Post Job — Get Free Bids <ArrowRight size={18} />
        </Button>
      </form>
    </div>
  );
}
