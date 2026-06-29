"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Star, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { id: 1, label: "Business Info" },
  { id: 2, label: "Services & Area" },
  { id: 3, label: "Photos & Bio" },
  { id: 4, label: "All Set!" },
];

export default function ContractorOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    website: "",
    licenseNumber: "",
    isInsured: false,
    yearsExperience: "",
    bio: "",
    categories: [] as string[],
    serviceAreas: "",
    photos: [] as File[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [target.name]:
        target.type === "checkbox" ? target.checked : target.value,
    }));
  };

  const addCategory = (value: string) => {
    const trimmed = value.trim().replace(/,+$/, "");
    if (!trimmed || form.categories.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, categories: [...prev.categories, trimmed] }));
    setCategoryInput("");
  };

  const removeCategory = (cat: string) => {
    setForm((prev) => ({ ...prev, categories: prev.categories.filter((c) => c !== cat) }));
  };

  const handleCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCategory(categoryInput);
    } else if (e.key === "Backspace" && !categoryInput && form.categories.length > 0) {
      removeCategory(form.categories[form.categories.length - 1]);
    }
  };

  const completeness = () => {
    let score = 0;
    if (form.businessName) score += 15;
    if (form.ownerName) score += 10;
    if (form.phone) score += 10;
    if (form.bio && form.bio.length > 50) score += 20;
    if (form.categories.length > 0) score += 15;
    if (form.serviceAreas) score += 10;
    if (form.photos.length > 0) score += 20;
    return Math.min(score, 100);
  };

  const [error, setError] = useState("");

  const handleFinish = async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Insert contractor profile
      const serviceAreasArray = form.serviceAreas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { data: contractorProfile, error: profileError } = await supabase
        .from("contractor_profiles")
        .insert({
          user_id: user.id,
          business_name: form.businessName,
          owner_name: form.ownerName,
          bio: form.bio || null,
          categories: form.categories,
          service_areas: serviceAreasArray,
          years_experience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
          website: form.website || null,
          license_number: form.licenseNumber || null,
          is_insured: form.isInsured,
        })
        .select("id")
        .single();

      if (profileError) throw profileError;

      // Update base profile with phone
      await supabase
        .from("profiles")
        .update({ phone: form.phone || null })
        .eq("id", user.id);

      // Upload photos
      if (form.photos.length > 0 && contractorProfile) {
        for (const file of form.photos) {
          const ext = file.name.split(".").pop();
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("contractor-photos")
            .upload(path, file);

          if (uploadError) continue;

          const { data: urlData } = supabase.storage
            .from("contractor-photos")
            .getPublicUrl(path);

          await supabase.from("contractor_photos").insert({
            contractor_id: contractorProfile.id,
            url: urlData.publicUrl,
          });
        }
      }

      setStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#059669]" />
          </div>
          <h1 className="text-3xl font-black text-[#0A1628] mb-3">
            Your profile is live!
          </h1>
          <p className="text-[#6B7280] mb-2">
            Customers in your area can now find and contact you on Contrakr.
          </p>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-[#0D0D0D]">
                Profile Completeness
              </span>
              <span className="text-sm font-black text-[#1E6FFF]">
                {completeness()}%
              </span>
            </div>
            <div className="w-full bg-[#E5E7EB] rounded-full h-2.5 mb-3">
              <div
                className="bg-[#1E6FFF] h-2.5 rounded-full transition-all"
                style={{ width: `${completeness()}%` }}
              />
            </div>
            <p className="text-xs text-[#6B7280]">
              A complete profile with photos gets 3× more responses. You can
              finish it anytime from your dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => router.push("/dashboard")}
            >
              Go to My Dashboard <ArrowRight size={18} />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => router.push("/feed")}
            >
              Browse the Job Feed
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1E6FFF] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">C</span>
            </div>
            <span className="font-black text-[#0A1628] text-lg">Contrakr</span>
          </div>
          <span className="text-sm text-[#6B7280]">
            Step {step} of {STEPS.length - 1}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-[#E5E7EB] px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {STEPS.slice(0, -1).map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    step > s.id
                      ? "bg-[#059669] text-white"
                      : step === s.id
                      ? "bg-[#1E6FFF] text-white"
                      : "bg-[#E5E7EB] text-[#9CA3AF]"
                  )}
                >
                  {step > s.id ? <CheckCircle size={14} /> : s.id}
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold hidden sm:block",
                    step >= s.id ? "text-[#0D0D0D]" : "text-[#9CA3AF]"
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 2 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      step > s.id ? "bg-[#059669]" : "bg-[#E5E7EB]"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-black text-[#0A1628]">
                Tell us about your business
              </h2>
              <p className="text-[#6B7280] mt-1 text-sm">
                This is how customers will find and contact you.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-5">
              <Input
                name="businessName"
                label="Business Name"
                placeholder="Smith Landscaping LLC"
                value={form.businessName}
                onChange={handleChange}
                required
              />
              <Input
                name="ownerName"
                label="Your Name"
                placeholder="John Smith"
                value={form.ownerName}
                onChange={handleChange}
                required
              />
              <Input
                name="phone"
                label="Business Phone"
                type="tel"
                placeholder="(601) 555-0100"
                value={form.phone}
                onChange={handleChange}
                required
              />
              <Input
                name="yearsExperience"
                label="Years in Business"
                type="number"
                placeholder="5"
                value={form.yearsExperience}
                onChange={handleChange}
              />
              <Input
                name="website"
                label="Website (optional)"
                placeholder="https://smithlandscaping.com"
                value={form.website}
                onChange={handleChange}
              />
              <Input
                name="licenseNumber"
                label="License Number (optional)"
                placeholder="MS-123456"
                value={form.licenseNumber}
                onChange={handleChange}
              />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isInsured"
                  checked={form.isInsured}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-[#D1D5DB] text-[#1E6FFF] focus:ring-[#1E6FFF]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#0D0D0D]">
                    I am insured
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Insured contractors get a badge on their profile — customers
                    look for this
                  </p>
                </div>
              </label>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setStep(2)}
              disabled={!form.businessName || !form.ownerName || !form.phone}
            >
              Continue <ArrowRight size={18} />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-black text-[#0A1628]">
                What do you do?
              </h2>
              <p className="text-[#6B7280] mt-1 text-sm">
                Type your trades or services and press Enter after each one. Add as many as you want.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-5">
              <div>
                <label className="text-sm font-semibold text-[#0D0D0D] block mb-2">
                  Your Services & Trades
                </label>
                <div
                  className="min-h-[80px] w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 flex flex-wrap gap-2 cursor-text focus-within:border-[#1E6FFF] focus-within:ring-1 focus-within:ring-[#1E6FFF] transition-all"
                  onClick={() => categoryInputRef.current?.focus()}
                >
                  {form.categories.map((cat) => (
                    <span
                      key={cat}
                      className="flex items-center gap-1.5 text-sm font-semibold bg-[#EFF6FF] text-[#1E6FFF] px-3 py-1 rounded-full"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeCategory(cat); }}
                        className="text-[#93C5FD] hover:text-[#1E6FFF]"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={categoryInputRef}
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyDown={handleCategoryKeyDown}
                    onBlur={() => { if (categoryInput.trim()) addCategory(categoryInput); }}
                    placeholder={form.categories.length === 0 ? "e.g. Landscaping, Gutter Cleaning, Tree Trimming..." : "Add another..."}
                    className="flex-1 min-w-[160px] text-sm outline-none bg-transparent placeholder:text-[#9CA3AF]"
                  />
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1.5">Press Enter or comma after each service</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <p className="text-xs text-[#6B7280] w-full mb-1 font-semibold">Common trades — click to add:</p>
                {["Landscaping","Roofing","Plumbing","HVAC","Electrical","Painting","Concrete","Carpentry","Pressure Washing","Window Cleaning","Gutter Cleaning","Tree Trimming","Flooring","Drywall","Fencing"].map((s) => (
                  !form.categories.includes(s) && (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addCategory(s)}
                      className="text-xs px-3 py-1 rounded-full border border-[#E5E7EB] text-[#6B7280] hover:border-[#1E6FFF] hover:text-[#1E6FFF] hover:bg-[#EFF6FF] transition-all"
                    >
                      + {s}
                    </button>
                  )
                ))}
              </div>

              <Input
                name="serviceAreas"
                label="Service Area"
                placeholder="e.g. Jackson, Brandon, Ridgeland, MS"
                value={form.serviceAreas}
                onChange={handleChange}
                required
                hint="List the cities or counties you serve, separated by commas"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(3)}
                disabled={form.categories.length === 0 || !form.serviceAreas}
                className="flex-2"
              >
                Continue <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-black text-[#0A1628]">
                Show your work
              </h2>
              <p className="text-[#6B7280] mt-1 text-sm">
                Contractors with photos get <strong>3× more leads</strong>.
                Upload your best before/after shots, team photos, or equipment.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-6">
              <PhotoUpload
                value={form.photos}
                onChange={(files) => setForm((prev) => ({ ...prev, photos: files }))}
                maxFiles={12}
                label="Work Photos"
                hint="Before & after shots, completed projects, your team, your equipment — all of it helps"
              />

              <Textarea
                name="bio"
                label="About Your Business"
                placeholder="Tell customers about your experience, what makes you different, and why they should hire you. Mention your specialty, how long you've been in business, and the area you serve..."
                value={form.bio}
                onChange={handleChange}
                rows={5}
                hint="A strong bio can be the difference between getting the job or not"
              />
            </div>

            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3 flex items-start gap-3">
              <Star size={18} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#92400E]">
                <strong>Pro tip:</strong> Contractors who add at least 3 photos in their first session are 4× more likely to get their first inquiry within 48 hours.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleFinish}
                loading={loading}
                className="flex-2"
              >
                Finish Setup <ArrowRight size={18} />
              </Button>
            </div>

            <button
              onClick={handleFinish}
              className="text-sm text-[#9CA3AF] text-center hover:text-[#6B7280] transition-colors"
            >
              Skip for now — I&apos;ll add photos later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
