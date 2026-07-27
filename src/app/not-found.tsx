import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] dark:bg-[#1E3A5F] flex items-center justify-center mx-auto mb-6">
          <Compass size={30} className="text-[#1E6FFF]" />
        </div>

        <p className="text-[13px] font-black tracking-widest text-[#94A3B8] dark:text-[#4B6A8A] mb-2">
          404
        </p>
        <h1 className="text-3xl font-black text-[#0A1628] dark:text-white mb-3">
          We couldn&apos;t find that page
        </h1>
        <p className="text-[#6B7280] dark:text-[#94A3B8] leading-relaxed mb-8">
          The link may be broken, or the post or profile might have been removed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/feed"
            className="px-6 py-3 rounded-xl bg-[#1E6FFF] text-white font-semibold text-sm hover:bg-[#1a5fd9] transition-colors"
          >
            Go to your feed
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-[#E5E7EB] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1F3C] text-[#0D0D0D] dark:text-white font-semibold text-sm hover:border-[#1E6FFF] transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
