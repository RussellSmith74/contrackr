import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, Star, Shield, CheckCircle, MapPin, Clock, ChevronRight, Zap, Users, Briefcase } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Navbar from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

const MOCK_FEED = [
  {
    id: "1",
    type: "job_request",
    author: "Marcus T.",
    location: "Jackson, MS",
    category: "Landscaping",
    content: "Need my backyard completely transformed — overgrown grass, dead shrubs, and want a clean landscape plan for the whole back lot. About half an acre.",
    time: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    bids: 3,
    rating: null,
  },
  {
    id: "2",
    type: "work_showcase",
    author: "Ridgeline Roofing Co.",
    location: "Brandon, MS",
    category: "Roofing",
    content: "Just wrapped up a full GAF Timberline roof replacement on this 2,400 sq ft home in Brandon. 30-year warranty, done in two days. Call us for a free estimate.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    rating: 4.9,
    bids: null,
  },
  {
    id: "3",
    type: "job_request",
    author: "Denise W.",
    location: "Ridgeland, MS",
    category: "Plumbing",
    content: "Kitchen faucet is leaking under the sink and I also need a water heater inspection. Single story home, fairly easy access.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    bids: 5,
    rating: null,
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/feed");
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section
        className="relative bg-[#0A1628] text-white overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        {/* Soft glow top-right */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.07] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top right, #1E6FFF 0%, transparent 65%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/[0.07] border border-white/10 text-[#93C5FD] text-sm font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              Free for contractors and homeowners
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
              Find a contractor{" "}
              <span className="text-[#1E6FFF]">you can trust.</span>
              <br />
              Or find the work{" "}
              <span className="text-[#1E6FFF]">you've been looking for.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-[#94A3B8] max-w-2xl mb-4 leading-relaxed">
              Contrakr is the free marketplace connecting homeowners with skilled local contractors. Post a job in minutes. Build a profile that brings work to you.
            </p>
            <p className="text-base text-[#60A5FA] font-semibold mb-10">
              No middlemen. No fees. Built for the trades.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup?role=customer">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1E6FFF] hover:bg-[#1558CC] text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#1E6FFF]/30 hover:shadow-[#1E6FFF]/50 hover:-translate-y-0.5">
                  I need to hire someone
                  <ArrowRight size={20} />
                </button>
              </Link>
              <Link href="/signup?role=contractor">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/30 hover:border-white/60 hover:bg-white/5 text-white font-bold text-base px-8 py-4 rounded-xl transition-all">
                  I&apos;m a contractor
                  <ArrowRight size={20} />
                </button>
              </Link>
            </div>

            {/* Value props — NO fake stats */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-10 pt-10 border-t border-white/10">
              {[
                { icon: CheckCircle, text: "Free to post jobs and bids" },
                { icon: Shield, text: "Verified reviews from real jobs" },
                { icon: Zap, text: "Get matched to work near you" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon size={16} className="text-[#1E6FFF]" />
                  <span className="text-[#CBD5E1] text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-20 sm:py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[#1E6FFF] text-sm font-bold uppercase tracking-widest mb-2">
                Every trade
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0A1628] leading-tight">
                One platform.
              </h2>
              <p className="text-[#6B7280] mt-2 text-base">
                From solo landscapers to full construction crews.
              </p>
            </div>
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-1 text-[#1E6FFF] font-semibold text-sm hover:underline"
            >
              Browse all <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {SERVICE_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.id}`}
                className="group flex flex-col items-center gap-3 bg-white border border-[#E5E7EB] rounded-2xl p-5 hover:border-[#1E6FFF] hover:shadow-lg hover:-translate-y-0.5 transition-all text-center"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-bold text-[#0D0D0D] group-hover:text-[#1E6FFF] transition-colors leading-tight">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#1E6FFF] text-sm font-bold uppercase tracking-widest mb-2">
              Simple by design
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0A1628]">
              How Contrakr works
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            {/* For Customers */}
            <div className="bg-[#F8FAFC] rounded-3xl p-8 lg:p-10 border border-[#E5E7EB]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-[#1E6FFF]" />
                </div>
                <h3 className="text-xl font-black text-[#0A1628]">For Homeowners</h3>
              </div>
              <div className="flex flex-col gap-7">
                {[
                  { step: "1", title: "Post your job", desc: "Describe what you need, add photos, set your location and timeline. Takes 2 minutes." },
                  { step: "2", title: "Get matched instantly", desc: "We surface the top-rated contractors in your area. Compare bids and read verified reviews." },
                  { step: "3", title: "Hire with confidence", desc: "Message contractors directly, pick the best fit, and leave a verified review when the job is done." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 bg-[#1E6FFF] rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-sm shadow-md shadow-[#1E6FFF]/30">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-bold text-[#0D0D0D]">{item.title}</p>
                      <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/signup?role=customer" className="mt-8 inline-block">
                <button className="inline-flex items-center gap-2 bg-[#1E6FFF] hover:bg-[#1558CC] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all">
                  Post a Job — It&apos;s Free <ArrowRight size={16} />
                </button>
              </Link>
            </div>

            {/* For Contractors */}
            <div className="bg-[#0A1628] rounded-3xl p-8 lg:p-10 border border-[#1E2D45]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Briefcase size={20} className="text-white" />
                </div>
                <h3 className="text-xl font-black text-white">For Contractors</h3>
              </div>
              <div className="flex flex-col gap-7">
                {[
                  { step: "1", title: "Build your profile", desc: "Your Contrakr profile is your professional presence online. Add photos, your bio, and your service area." },
                  { step: "2", title: "Get matched to jobs", desc: "We notify you when relevant jobs are posted nearby. Browse the feed or jump on any job you want." },
                  { step: "3", title: "Grow your business", desc: "Collect verified reviews, track your jobs in your CRM, and build a reputation that brings in work on its own." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-sm">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="text-sm text-[#94A3B8] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/signup?role=contractor" className="mt-8 inline-block">
                <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all">
                  Create Your Profile — Free <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Feed Preview ── */}
      <section className="py-20 sm:py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Live</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0A1628]">
                What&apos;s happening right now
              </h2>
              <p className="text-[#6B7280] mt-2">Real jobs and contractor posts, updated in real time.</p>
            </div>
            <Link
              href="/feed"
              className="hidden sm:flex items-center gap-1 text-[#1E6FFF] font-semibold text-sm hover:underline"
            >
              See all <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_FEED.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 hover:shadow-lg hover:border-[#1E6FFF]/30 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0A1628] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{post.author[0]}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#0D0D0D]">{post.author}</p>
                      <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                        <MapPin size={10} />
                        {post.location}
                      </div>
                    </div>
                  </div>
                  <Badge variant={post.type === "job_request" ? "blue" : "green"} size="sm">
                    {post.type === "job_request" ? "Job" : "Post"}
                  </Badge>
                </div>

                <div className="mb-3">
                  <span className="text-xs font-bold text-[#1E6FFF] bg-[#EFF6FF] px-2.5 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>

                <p className="text-sm text-[#374151] leading-relaxed line-clamp-3 mb-4">
                  {post.content}
                </p>

                <div className="flex items-center justify-between text-xs text-[#9CA3AF] pt-3 border-t border-[#F3F4F6]">
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatRelativeTime(post.time)}
                  </div>
                  {post.bids !== null && (
                    <span className="font-bold text-[#1E6FFF]">
                      {post.bids} bid{post.bids !== 1 ? "s" : ""}
                    </span>
                  )}
                  {post.rating && (
                    <div className="flex items-center gap-1">
                      <Star size={11} className="fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="font-bold text-[#0D0D0D]">{post.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 bg-[#1E6FFF] hover:bg-[#1558CC] text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#1E6FFF]/30">
                Join to See the Full Feed <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#1E6FFF] text-sm font-bold uppercase tracking-widest mb-2">
              Why Contrakr
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0A1628]">
              Built on trust. Built for results.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: Shield,
                title: "Verified Reviews Only",
                desc: "Every review comes from a customer who completed a real job on Contrakr. No fake ratings. No anonymous complaints.",
              },
              {
                icon: Zap,
                title: "No Fees. Ever.",
                desc: "Creating a profile or posting a job is completely free. Contrakr earns when both sides win — not before.",
              },
              {
                icon: CheckCircle,
                title: "Real Track Record",
                desc: "Every job a contractor completes through Contrakr builds their verified history — a professional resume that grows automatically.",
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-5">
                <div className="w-16 h-16 bg-[#EFF6FF] rounded-2xl flex items-center justify-center shadow-sm">
                  <item.icon size={28} className="text-[#1E6FFF]" />
                </div>
                <h3 className="text-lg font-black text-[#0A1628]">{item.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        className="relative bg-[#0A1628] py-20 sm:py-28 overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.08] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center bottom, #1E6FFF 0%, transparent 65%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Ready to get started?
          </h2>
          <p className="text-[#94A3B8] text-lg mb-12 max-w-xl mx-auto">
            Join contractors and homeowners across the country. Free — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?role=customer">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1E6FFF] hover:bg-[#1558CC] text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#1E6FFF]/30">
                Hire a Contractor <ArrowRight size={20} />
              </button>
            </Link>
            <Link href="/signup?role=contractor">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F3F4F6] text-[#0A1628] font-bold text-base px-8 py-4 rounded-xl transition-all">
                Find Work Near You <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#060E1A] text-[#64748B] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center">
              <span className="text-white font-black text-lg tracking-tight">Contrakr</span>
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-xs">© 2026 Contrakr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
