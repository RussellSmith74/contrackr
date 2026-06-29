import Link from "next/link";
import { CheckCircle } from "lucide-react";

const BENEFITS = [
  "Post a job in under 2 minutes",
  "Get matched to top-rated local contractors",
  "Verified reviews from real completed jobs",
  "100% free — no credit card required",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — hidden on mobile */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[40%] flex-shrink-0 bg-[#0A1628] text-white flex-col justify-between p-12 relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        {/* Glow */}
        <div
          className="absolute top-0 right-0 w-96 h-96 opacity-[0.08] pointer-events-none"
          style={{
            background: "radial-gradient(circle at top right, #1E6FFF 0%, transparent 65%)",
          }}
        />

        <Link href="/" className="relative">
          <span className="font-black text-2xl tracking-tight">Contrakr</span>
        </Link>

        <div className="relative">
          <h2 className="text-4xl font-black leading-tight mb-4 tracking-tight">
            The trades marketplace{" "}
            <span className="text-[#1E6FFF]">built for the people who get it done.</span>
          </h2>
          <p className="text-[#94A3B8] leading-relaxed mb-10 text-lg">
            Connect with trusted local contractors, or build a profile that brings work directly to you.
          </p>
          <div className="flex flex-col gap-4">
            {BENEFITS.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-[#1E6FFF] flex-shrink-0" />
                <span className="text-[#CBD5E1] text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[#334155] text-xs">© 2026 Contrakr. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-[#F8FAFC]">
        {/* Mobile header only */}
        <header className="lg:hidden bg-white border-b border-[#E5E7EB] px-4 py-4">
          <Link href="/">
            <span className="text-[#0A1628] font-black text-xl tracking-tight">Contrakr</span>
          </Link>
        </header>
        <main className="flex-1 flex items-start justify-center py-10 px-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
