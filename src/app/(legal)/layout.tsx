import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628]">
      <header className="bg-[#0A1628] border-b border-[#1a2f50]">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="text-white font-black text-2xl tracking-tight">Contrakr</span>
          </Link>
          <Link
            href="/"
            className="text-[#94A3B8] hover:text-white text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <article
          className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl px-6 sm:px-10 py-10
            [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-[#0A1628] dark:[&_h1]:text-white [&_h1]:mb-2
            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#0A1628] dark:[&_h2]:text-white [&_h2]:mt-9 [&_h2]:mb-3
            [&_p]:text-[15px] [&_p]:text-[#374151] dark:[&_p]:text-[#CBD5E1] [&_p]:leading-[1.75] [&_p]:mb-4
            [&_li]:text-[15px] [&_li]:text-[#374151] dark:[&_li]:text-[#CBD5E1] [&_li]:leading-[1.75] [&_li]:mb-2
            [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc
            [&_a]:text-[#1E6FFF] [&_a]:font-medium hover:[&_a]:underline
            [&_strong]:font-semibold [&_strong]:text-[#0D0D0D] dark:[&_strong]:text-white"
        >
          {children}
        </article>

        <p className="text-center text-xs text-[#94A3B8] dark:text-[#4B6A8A] mt-8">
          Questions? Email{" "}
          <a href="mailto:devcontrakr@gmail.com" className="text-[#1E6FFF] hover:underline">
            devcontrakr@gmail.com
          </a>
        </p>
      </main>
    </div>
  );
}
