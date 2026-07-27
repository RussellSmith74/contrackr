"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    // Don't reveal whether the address has an account — that would let anyone
    // probe for registered emails. Rate limiting is the only case worth showing.
    if (resetError && resetError.message.toLowerCase().includes("rate")) {
      setError("Too many requests. Wait a few minutes and try again.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-5">
            <MailCheck size={26} className="text-[#1E6FFF]" />
          </div>
          <h1 className="text-2xl font-black text-[#0A1628] mb-2">Check your email</h1>
          <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
            If an account exists for <span className="font-semibold text-[#0D0D0D]">{email}</span>,
            we&apos;ve sent a link to reset your password. It expires in one hour.
          </p>
          <p className="text-[#9CA3AF] text-xs leading-relaxed mb-6">
            Don&apos;t see it? Check your spam folder — reset emails sometimes land there.
          </p>
          <Link href="/login">
            <Button variant="secondary" size="lg" fullWidth>
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[#0A1628] mb-2">Reset your password</h1>
        <p className="text-[#6B7280]">
          Enter your email and we&apos;ll send you a link to set a new one.
        </p>
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} disabled={!email.trim()}>
          Send reset link <ArrowRight size={18} />
        </Button>
      </form>

      <p className="text-center text-sm text-[#6B7280] mt-5">
        <Link href="/login" className="text-[#1E6FFF] font-semibold hover:underline inline-flex items-center gap-1.5">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
