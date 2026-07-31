import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Offline — Contrakr",
  description: "You're not connected to the internet.",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] flex items-center justify-center mx-auto mb-5">
          <WifiOff size={24} className="text-[#94A3B8] dark:text-[#4B6A8A]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0A1628] dark:text-white">You&apos;re offline</h1>
        <p className="text-[15px] text-[#6B7280] dark:text-[#94A3B8] mt-2 leading-relaxed">
          Contrakr needs a connection to load jobs, messages, and profiles. This page will work
          again as soon as you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
