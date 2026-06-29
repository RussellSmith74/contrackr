"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle, Loader2, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { useDarkMode } from "@/lib/useDarkMode";
import { LocationInput } from "@/components/ui/LocationInput";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  role: "customer" | "contractor";
  bio: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dark, toggle: toggleDark } = useDarkMode();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    location: "",
    bio: "",
    search_radius: 50,
  });
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, location, avatar_url, role, bio, search_radius")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
        setForm({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          location: data.location ?? "",
          bio: data.bio ?? "",
          search_radius: (data as { search_radius?: number }).search_radius ?? 50,
        });
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingAvatar(true);
    setError("");

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", profile.id);
      if (updateError) throw updateError;

      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone || null,
          location: form.location || null,
          lat: locationCoords?.lat ?? null,
          lng: locationCoords?.lng ?? null,
          bio: form.bio || null,
          search_radius: form.search_radius,
        })
        .eq("id", profile.id);
      if (updateError) throw updateError;

      setProfile((prev) => prev ? { ...prev, ...form } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-[#1E6FFF]" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#0A1628]">Account Settings</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage your profile and account info</p>
        </div>

        {/* Avatar section */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mb-5">
          <h2 className="font-bold text-[#0A1628] mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[#0A1628] flex items-center justify-center flex-shrink-0">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {getInitials(profile.full_name)}
                  </span>
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#1E6FFF] rounded-full flex items-center justify-center shadow-md hover:bg-[#1a5fe0] transition-colors disabled:opacity-60"
              >
                {uploadingAvatar
                  ? <Loader2 size={13} className="text-white animate-spin" />
                  : <Camera size={13} className="text-white" />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0D0D0D]">{profile.full_name}</p>
              <p className="text-xs text-[#6B7280] capitalize mb-2">{profile.role}</p>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="text-xs text-[#1E6FFF] font-semibold hover:underline disabled:opacity-50"
              >
                {uploadingAvatar ? "Uploading..." : profile.avatar_url ? "Change photo" : "Upload photo"}
              </button>
              <p className="text-xs text-[#9CA3AF] mt-0.5">JPG, PNG or WebP — max 5MB</p>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <form onSubmit={handleSave}>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-5 mb-5">
            <h2 className="font-bold text-[#0A1628]">Personal Info</h2>

            <Input
              label="Full Name"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#0D0D0D]">Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#9CA3AF] cursor-not-allowed"
              />
              <p className="text-xs text-[#9CA3AF]">Email cannot be changed here</p>
            </div>

            <Input
              label="Phone Number"
              type="tel"
              placeholder="(555) 000-0000"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              hint="Used for job notifications — never shown publicly"
            />

            <LocationInput
              label="City & State"
              placeholder="Austin, TX"
              value={form.location}
              onChange={(val, coords) => {
                setForm((p) => ({ ...p, location: val }));
                if (coords) setLocationCoords(coords);
              }}
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#0D0D0D] dark:text-white">
                Search Radius — <span className="text-[#1E6FFF]">{form.search_radius} miles</span>
              </label>
              <input
                type="range"
                min={25}
                max={200}
                step={25}
                value={form.search_radius}
                onChange={(e) => setForm((p) => ({ ...p, search_radius: Number(e.target.value) }))}
                className="w-full accent-[#1E6FFF]"
              />
              <div className="flex justify-between text-xs text-[#9CA3AF]">
                <span>25 mi</span><span>50 mi</span><span>100 mi</span><span>150 mi</span><span>200 mi</span>
              </div>
              <p className="text-xs text-[#9CA3AF]">Only see jobs and contractors within this distance of your location</p>
            </div>

            <Textarea
              label="Bio"
              placeholder={
                profile.role === "contractor"
                  ? "Tell customers about your experience, what makes you different, and why they should hire you..."
                  : "Tell contractors a bit about yourself and the types of projects you typically need help with..."
              }
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              rows={4}
              hint={profile.role === "contractor" ? "A strong bio helps you stand out and win more jobs" : "Optional — helps contractors understand your needs"}
            />
          </div>

          {/* Appearance */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {dark ? <Moon size={20} className="text-[#1E6FFF]" /> : <Sun size={20} className="text-[#F59E0B]" />}
              <div>
                <p className="text-sm font-bold text-[#0D0D0D]">Dark Mode</p>
                <p className="text-xs text-[#6B7280]">{dark ? "On — looking sharp" : "Off — switch for a darker look"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleDark(!dark)}
              className={`relative w-12 h-6 rounded-full transition-colors ${dark ? "bg-[#1E6FFF]" : "bg-[#D1D5DB]"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 bg-[#ECFDF5] border border-[#D1FAE5] rounded-xl px-4 py-3 text-sm text-[#059669] font-semibold mb-4">
              <CheckCircle size={16} />
              Changes saved successfully
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={saving}>
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
