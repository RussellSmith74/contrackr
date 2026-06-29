"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) throw signInError;

      // Route based on role stored in profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role === "contractor") {
        router.push("/dashboard");
      } else {
        router.push("/feed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[#0A1628] mb-2">Welcome back</h1>
        <p className="text-[#6B7280]">Sign in to your Contrakr account</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-5"
      >
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

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#0D0D0D]">Password</label>
            <Link href="/forgot-password" className="text-xs text-[#1E6FFF] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
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
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Sign In <ArrowRight size={18} />
        </Button>
      </form>

      <p className="text-center text-sm text-[#6B7280] mt-5">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[#1E6FFF] font-semibold hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
