"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FFFBEB] dark:bg-[#422006] flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={30} className="text-[#D97706]" />
        </div>

        <h1 className="text-3xl font-black text-[#0A1628] dark:text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-[#6B7280] dark:text-[#94A3B8] leading-relaxed mb-8">
          This one&apos;s on us, not you. Try again — and if it keeps happening, let us know.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => unstable_retry()}
            className="px-6 py-3 rounded-xl bg-[#1E6FFF] text-white font-semibold text-sm hover:bg-[#1a5fd9] transition-colors inline-flex items-center justify-center gap-2"
          >
            <RotateCw size={16} />
            Try again
          </button>
          <Link
            href="/feed"
            className="px-6 py-3 rounded-xl border border-[#E5E7EB] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1F3C] text-[#0D0D0D] dark:text-white font-semibold text-sm hover:border-[#1E6FFF] transition-colors"
          >
            Go to your feed
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-[11px] text-[#94A3B8] dark:text-[#4B6A8A] font-mono">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
