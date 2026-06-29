"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, User, HardHat, Eye, EyeOff, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LocationInput } from "@/components/ui/LocationInput";

type Role = "customer" | "contractor" | null;
type Step = "role" | "info";

function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialRole = (searchParams.get("role") as Role) || null;
  const [role, setRole] = useState<Role>(initialRole);
  const [step, setStep] = useState<Step>(initialRole ? "info" : "role");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    location: "",
    businessName: "",
    phone: "",
  });
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setStep("info");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName, role } },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          email: form.email,
          full_name: form.fullName,
          role,
          phone: form.phone || null,
          location: form.location || null,
          lat: locationCoords?.lat ?? null,
          lng: locationCoords?.lng ?? null,
        });
        if (profileError) throw profileError;
      }

      router.push("/feed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(form.password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"][strength];

  if (step === "role") {
    return (
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#0A1628] mb-2">Join Contrakr</h1>
          <p className="text-[#6B7280]">Who are you signing up as?</p>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => handleRoleSelect("customer")}
            className="flex items-center gap-5 bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 hover:border-[#1E6FFF] hover:shadow-md transition-all group text-left"
          >
            <div className="w-14 h-14 bg-[#EFF6FF] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#1E6FFF] transition-colors">
              <User size={28} className="text-[#1E6FFF] group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-[#0A1628]">I&apos;m a Customer</p>
              <p className="text-sm text-[#6B7280] mt-1">
                I want to find and hire contractors for my home or property.
              </p>
            </div>
            <ArrowRight size={20} className="text-[#D1D5DB] group-hover:text-[#1E6FFF] transition-colors flex-shrink-0" />
          </button>

          <button
            onClick={() => handleRoleSelect("contractor")}
            className="flex items-center gap-5 bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 hover:border-[#1E6FFF] hover:shadow-md transition-all group text-left"
          >
            <div className="w-14 h-14 bg-[#F0FDF4] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#0A1628] transition-colors">
              <HardHat size={28} className="text-[#059669] group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-black text-[#0A1628]">I&apos;m a Contractor</p>
              <p className="text-sm text-[#6B7280] mt-1">
                I offer trade services and want to find customers and grow my business.
              </p>
            </div>
            <ArrowRight size={20} className="text-[#D1D5DB] group-hover:text-[#1E6FFF] transition-colors flex-shrink-0" />
          </button>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1E6FFF] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <button
        onClick={() => setStep("role")}
        className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0D0D0D] mb-6 transition-colors"
      >
        ← Back
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            role === "customer" ? "bg-[#EFF6FF]" : "bg-[#F0FDF4]"
          )}>
            {role === "customer"
              ? <User size={20} className="text-[#1E6FFF]" />
              : <HardHat size={20} className="text-[#059669]" />
            }
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0A1628]">Create your account</h1>
            <p className="text-sm text-[#6B7280] capitalize">Signing up as a {role}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-5">
        <Input
          name="fullName"
          label="Full Name"
          placeholder="John Smith"
          value={form.fullName}
          onChange={handleChange}
          required
          autoComplete="name"
        />

        {role === "contractor" && (
          <Input
            name="businessName"
            label="Business Name"
            placeholder="Smith Landscaping LLC"
            value={form.businessName}
            onChange={handleChange}
            required
            hint="You can always update this later"
          />
        )}

        <Input
          name="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />

        <Input
          name="phone"
          label="Phone Number"
          type="tel"
          placeholder="(601) 555-0100"
          value={form.phone}
          onChange={handleChange}
          hint="Used for job notifications — never shared publicly"
        />

        <LocationInput
          label="City & State"
          placeholder="City, State"
          value={form.location}
          required
          onChange={(val, coords) => {
            setForm((p) => ({ ...p, location: val }));
            if (coords) setLocationCoords(coords);
          }}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#0D0D0D]">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm pr-10 focus:outline-none focus:border-[#1E6FFF] focus:ring-1 focus:ring-[#1E6FFF]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.password && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i <= strength ? strengthColor : "bg-[#E5E7EB]"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-[#6B7280]">{strengthLabel}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Create Account — It&apos;s Free
          <ArrowRight size={18} />
        </Button>

        <p className="text-xs text-[#9CA3AF] text-center leading-relaxed">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline">Terms of Service</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>

      <div className="flex items-center gap-3 mt-4 bg-[#F0FDF4] border border-[#D1FAE5] rounded-xl px-4 py-3">
        <CheckCircle size={18} className="text-[#059669] flex-shrink-0" />
        <p className="text-sm text-[#059669] font-semibold">100% free — no credit card required</p>
      </div>

      <p className="text-center text-sm text-[#6B7280] mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-[#1E6FFF] font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
