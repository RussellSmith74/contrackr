"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ShieldAlert, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type LinkState = "checking" | "valid" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // The recovery link lands here carrying a code. Trade it for a temporary
  // session, which is what lets updateUser() change the password.
  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setLinkState("valid");
    });

    const verify = async () => {
      const url = new URL(window.location.href);

      // Supabase reports expired or already-used links back on the URL.
      const urlError =
        url.searchParams.get("error_description") ??
        new URLSearchParams(url.hash.replace(/^#/, "")).get("error_description");
      if (urlError) {
        setLinkState("invalid");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setLinkState("valid");
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        setLinkState(exchangeError ? "invalid" : "valid");
        return;
      }

      setLinkState("invalid");
    };

    verify();
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => router.push("/feed"), 2200);
  };

  if (linkState === "checking") {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center">
          <p className="text-[#6B7280] text-sm">Verifying your link…</p>
        </div>
      </div>
    );
  }

  if (linkState === "invalid") {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={26} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-[#0A1628] mb-2">This link has expired</h1>
          <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
            Password reset links are good for one hour and can only be used once.
            Request a fresh one and you&apos;ll be back in shortly.
          </p>
          <Link href="/forgot-password">
            <Button variant="primary" size="lg" fullWidth>
              Request a new link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={26} className="text-[#059669]" />
          </div>
          <h1 className="text-2xl font-black text-[#0A1628] mb-2">Password updated</h1>
          <p className="text-[#6B7280] text-sm">You&apos;re signed in. Taking you to your feed…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[#0A1628] mb-2">Set a new password</h1>
        <p className="text-[#6B7280]">Pick something you haven&apos;t used before.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#0D0D0D]">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#0D0D0D]">Confirm Password</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Type it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#1E6FFF] focus:ring-1 focus:ring-[#1E6FFF]"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!password || !confirm}
        >
          Update password <ArrowRight size={18} />
        </Button>
      </form>
    </div>
  );
}
