"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Star, X, Camera, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LocationInput } from "@/components/ui/LocationInput";

const STEPS = [
  { id: 1, label: "Business Info" },
  { id: 2, label: "Services & Area" },
  { id: 3, label: "About You" },
  { id: 4, label: "All Set!" },
];

export default function ContractorOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

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
  });
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadExisting = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingExisting(false); return; }

      const [{ data: existing }, { data: baseProfile }] = await Promise.all([
        supabase.from("contractor_profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("profiles").select("phone, avatar_url").eq("id", user.id).single(),
      ]);

      if (existing) {
        setExistingProfileId(existing.id);
        setForm({
          businessName: existing.business_name ?? "",
          ownerName: existing.owner_name ?? "",
          phone: baseProfile?.phone ?? "",
          website: existing.website ?? "",
          licenseNumber: existing.license_number ?? "",
          isInsured: existing.is_insured ?? false,
          yearsExperience: existing.years_experience ? String(existing.years_experience) : "",
          bio: existing.bio ?? "",
          categories: existing.categories ?? [],
          serviceAreas: (existing.service_areas ?? []).join(", "),
        });
        if (existing.lat && existing.lng) setLocationCoords({ lat: existing.lat, lng: existing.lng });
        if (baseProfile?.avatar_url) setAvatarUrl(baseProfile.avatar_url);
      }
      setLoadingExisting(false);
    };
    loadExisting();
  }, []);

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
    if (form.phone) score += 15;
    if (form.bio && form.bio.length > 50) score += 20;
    if (form.categories.length > 0) score += 20;
    if (form.serviceAreas) score += 20;
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

      // Insert or update contractor profile
      const serviceAreasArray = form.serviceAreas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        business_name: form.businessName,
        owner_name: form.ownerName,
        bio: form.bio || null,
        categories: form.categories,
        service_areas: serviceAreasArray,
        years_experience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
        website: form.website || null,
        license_number: form.licenseNumber || null,
        is_insured: form.isInsured,
        lat: locationCoords?.lat ?? null,
        lng: locationCoords?.lng ?? null,
        profile_completeness: completeness(),
      };

      const { error: profileError } = existingProfileId
        ? await supabase.from("contractor_profiles").update(payload).eq("id", existingProfileId)
        : await supabase.from("contractor_profiles").insert({ user_id: user.id, ...payload });

      if (profileError) throw profileError;

      // Update base profile with phone
      await supabase
        .from("profiles")
        .update({ phone: form.phone || null })
        .eq("id", user.id);

      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingExisting) {
    return <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628]" />;
  }

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
              {/* Profile photo */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#0A1628] flex items-center justify-center overflow-hidden">
                    {avatarUrl
                      ? <Image src={avatarUrl} alt="Profile" width={80} height={80} className="object-cover w-full h-full" />
                      : <span className="text-white font-bold text-2xl">{form.ownerName?.[0]?.toUpperCase() || "?"}</span>
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
                <p className="text-xs text-[#9CA3AF]">{uploadingAvatar ? "Uploading..." : "Add a profile photo"}</p>
              </div>

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
                {["Landscaping","Roofing","Plumbing","HVAC","Electrical","Painting","Concrete & Flatwork","Carpentry & Woodwork","Pressure Washing","Gutter Cleaning","Tree Trimming","Flooring","Drywall & Plastering","Fencing","Land Clearing","Welding & Fabrication","Hauling & Junk Removal","Mobile Mechanic","Auto Detailing","Handyman Services","Insulation","Masonry & Stonework","Pool & Spa Services","Septic & Drain Field","Solar & Generators","Security Systems & Cameras","Irrigation & Sprinklers","Moving & Labor Help","Towing","Equipment Operator","Trucking & Heavy Hauling","Cleaning Services","Window & Door Install","Kitchen & Bath Remodel","Tile Work","Framing"].map((s) => (
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

              <LocationInput
                label="Primary Location"
                placeholder="Your city, State"
                value={form.serviceAreas}
                required
                onChange={(val, coords) => {
                  setForm((p) => ({ ...p, serviceAreas: val }));
                  if (coords) setLocationCoords(coords);
                }}
              />
              <p className="text-xs text-[#6B7280] -mt-3">Your main service location — used to match you with nearby jobs</p>
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
                About your business
              </h2>
              <p className="text-[#6B7280] mt-1 text-sm">
                Tell customers what makes you the right person for the job.
              </p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
              <Textarea
                name="bio"
                label="About Your Business"
                placeholder="Tell customers about your experience, what makes you different, and why they should hire you. Mention your specialty, how long you've been in business, and the area you serve..."
                value={form.bio}
                onChange={handleChange}
                rows={6}
                hint="A strong bio can be the difference between getting the job or not"
              />
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

          </div>
        )}
      </div>
    </div>
  );
}
