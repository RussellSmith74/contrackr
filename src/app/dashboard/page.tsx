"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  Clock,
  CheckCircle,
  MessageSquare,
  Star,
  DollarSign,
  ChevronRight,
  AlertCircle,
  MapPin,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Tab = "jobs" | "bids" | "leads" | "messages" | "revenue";

interface ContractorProfile {
  id: string;
  business_name: string;
  owner_name: string;
  avg_rating: number;
  total_reviews: number;
  profile_completeness: number;
}

interface Bid {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  job_posts: {
    id: string;
    title: string;
    location: string;
    profiles: { full_name: string } | null;
  } | null;
}

interface JobPost {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("jobs");
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [userName, setUserName] = useState("there");
  const [bids, setBids] = useState<Bid[]>([]);
  const [leads, setLeads] = useState<JobPost[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile + user name
      const [{ data: prof }, { data: userProfile }] = await Promise.all([
        supabase
          .from("contractor_profiles")
          .select("id, business_name, owner_name, avg_rating, total_reviews, profile_completeness")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single(),
      ]);

      if (userProfile?.full_name) {
        setUserName(userProfile.full_name.split(" ")[0]);
      }

      if (!prof) {
        setLoading(false);
        return;
      }

      setProfile(prof);

      // Load bids this contractor submitted
      const { data: bidsData } = await supabase
        .from("bids")
        .select(`
          id, amount, status, created_at,
          job_posts (
            id, title, location,
            profiles ( full_name )
          )
        `)
        .eq("contractor_id", prof.id)
        .order("created_at", { ascending: false });

      if (bidsData) setBids(bidsData as unknown as Bid[]);

      // Leads = open jobs matching contractor's categories (simplified: just open jobs)
      const { data: leadsData } = await supabase
        .from("job_posts")
        .select(`id, title, category, description, location, status, created_at, profiles ( full_name )`)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(10);

      if (leadsData) setLeads(leadsData as unknown as JobPost[]);

      // Active jobs = bids that were accepted
      const acceptedBidJobIds = (bidsData as unknown as Bid[] ?? [])
        .filter((b) => b.status === "accepted")
        .map((b) => b.job_posts?.id)
        .filter(Boolean) as string[];

      if (acceptedBidJobIds.length > 0) {
        const { data: jobsData } = await supabase
          .from("job_posts")
          .select(`id, title, category, description, location, status, created_at, profiles ( full_name )`)
          .in("id", acceptedBidJobIds);
        if (jobsData) setActiveJobs(jobsData as unknown as JobPost[]);
      }

      setLoading(false);
    }

    load();
  }, []);

  const pendingBids = bids.filter((b) => b.status === "pending");

  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "jobs", label: "Current Jobs", icon: Briefcase, count: activeJobs.length },
    { id: "bids", label: "Pending Bids", icon: Clock, count: pendingBids.length },
    { id: "leads", label: "Leads", icon: TrendingUp, count: leads.length },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "revenue", label: "Revenue", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#0A1628] dark:text-white mb-1">
            Good morning, {userName} 👋
          </h1>
          <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">
            Here&apos;s what&apos;s going on with your business today.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Active Jobs" value={loading ? "—" : activeJobs.length} icon={Briefcase} color="blue" />
          <StatCard label="Pending Bids" value={loading ? "—" : pendingBids.length} icon={Clock} color="yellow" />
          <StatCard
            label="Avg Rating"
            value={profile ? `${profile.avg_rating}★` : "—"}
            sub={profile ? `${profile.total_reviews} reviews` : undefined}
            icon={Star}
            color="green"
          />
          <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8]">Profile</span>
              <span className="text-sm font-black text-[#1E6FFF]">
                {profile ? `${profile.profile_completeness}%` : "—"}
              </span>
            </div>
            <div className="w-full bg-[#E5E7EB] dark:bg-[#1E3A5F] rounded-full h-2 mb-2">
              <div
                className="bg-[#1E6FFF] h-2 rounded-full transition-all"
                style={{ width: `${profile?.profile_completeness ?? 0}%` }}
              />
            </div>
            <Link
              href="/onboarding/contractor"
              className="text-xs text-[#1E6FFF] font-semibold hover:underline"
            >
              Complete profile →
            </Link>
          </div>
        </div>

        {/* Profile completeness alert */}
        {profile && profile.profile_completeness < 80 && (
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3 flex items-start gap-3 mb-6">
            <AlertCircle size={18} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#92400E]">Your profile is {profile.profile_completeness}% complete</p>
              <p className="text-xs text-[#B45309] mt-0.5">
                Add your bio and more work photos to rank higher in search results and get matched to more jobs.
              </p>
            </div>
            <Link href="/onboarding/contractor">
              <button className="text-xs text-[#D97706] font-bold hover:underline flex-shrink-0">
                Fix it →
              </button>
            </Link>
          </div>
        )}

        {/* No contractor profile yet */}
        {!loading && !profile && (
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3 flex items-start gap-3 mb-6">
            <AlertCircle size={18} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#92400E]">Complete your contractor profile</p>
              <p className="text-xs text-[#B45309] mt-0.5">
                You need a contractor profile to bid on jobs and appear in search results.
              </p>
            </div>
            <Link href="/onboarding/contractor">
              <button className="text-xs text-[#D97706] font-bold hover:underline flex-shrink-0">
                Set up →
              </button>
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-1 mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0",
                activeTab === tab.id
                  ? "bg-[#0A1628] dark:bg-[#1E6FFF] text-white"
                  : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0D0D0D] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#1E3A5F]"
              )}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-black",
                    activeTab === tab.id
                      ? "bg-white text-[#0A1628]"
                      : "bg-[#E5E7EB] dark:bg-[#1E3A5F] text-[#6B7280] dark:text-[#94A3B8]"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "jobs" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-[#0D0D0D] dark:text-white">Current Jobs</h2>
            </div>
            {loading ? (
              <div className="text-sm text-[#6B7280] dark:text-[#94A3B8] py-8 text-center">Loading…</div>
            ) : activeJobs.length === 0 ? (
              <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-8 text-center">
                <Briefcase size={32} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#374151] dark:text-[#CBD5E1]">No active jobs yet</p>
                <p className="text-xs text-[#9CA3AF] dark:text-[#64748B] mt-1">Jobs will appear here once a customer accepts your bid.</p>
                <Link href="/feed" className="mt-4 inline-block text-sm text-[#1E6FFF] font-semibold hover:underline">
                  Browse open jobs →
                </Link>
              </div>
            ) : (
              activeJobs.map((job) => (
                <Card key={job.id} hover>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[#0D0D0D] dark:text-white text-sm">
                          {job.profiles?.full_name ?? "Customer"}
                        </span>
                        <Badge variant="blue" size="sm">In Progress</Badge>
                      </div>
                      <p className="text-xs text-[#1E6FFF] font-semibold mb-1">{job.category}</p>
                      <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] leading-snug line-clamp-2">{job.title}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                          <MapPin size={10} />
                          {job.location}
                        </div>
                      </div>
                    </div>
                    <Link href={`/jobs/${job.id}`}>
                      <ChevronRight size={16} className="text-[#9CA3AF] flex-shrink-0 mt-1" />
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "bids" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-[#0D0D0D] dark:text-white">Pending Bids</h2>
              <span className="text-sm text-[#6B7280] dark:text-[#94A3B8]">{pendingBids.length} open</span>
            </div>
            {loading ? (
              <div className="text-sm text-[#6B7280] dark:text-[#94A3B8] py-8 text-center">Loading…</div>
            ) : pendingBids.length === 0 ? (
              <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-8 text-center">
                <Clock size={32} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#374151] dark:text-[#CBD5E1]">No pending bids</p>
                <p className="text-xs text-[#9CA3AF] dark:text-[#64748B] mt-1">Find open jobs and submit your first bid.</p>
                <Link href="/feed" className="mt-4 inline-block text-sm text-[#1E6FFF] font-semibold hover:underline">
                  Browse jobs →
                </Link>
              </div>
            ) : (
              pendingBids.map((bid) => (
                <Card key={bid.id} hover>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0D0D0D] dark:text-white text-sm mb-0.5">
                        {bid.job_posts?.title ?? "Job"}
                      </p>
                      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mb-2">
                        {bid.job_posts?.profiles?.full_name ?? "Customer"} · {bid.job_posts?.location ?? ""}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-[#0A1628] dark:text-white">
                          ${Number(bid.amount).toLocaleString()}
                        </span>
                        <Badge variant="yellow" size="sm">Awaiting Response</Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-[#9CA3AF]">
                        {formatRelativeTime(bid.created_at)}
                      </p>
                      {bid.job_posts?.id && (
                        <Link
                          href={`/jobs/${bid.job_posts.id}`}
                          className="text-xs text-[#1E6FFF] font-semibold hover:underline mt-1 block"
                        >
                          View job →
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "leads" && (
          <div className="flex flex-col gap-3">
            <div className="mb-1">
              <h2 className="font-bold text-[#0D0D0D] dark:text-white">Matched Leads</h2>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                Open jobs in the area — don&apos;t let them slip away
              </p>
            </div>
            {loading ? (
              <div className="text-sm text-[#6B7280] dark:text-[#94A3B8] py-8 text-center">Loading…</div>
            ) : leads.length === 0 ? (
              <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-8 text-center">
                <TrendingUp size={32} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#374151] dark:text-[#CBD5E1]">No open jobs right now</p>
                <p className="text-xs text-[#9CA3AF] dark:text-[#64748B] mt-1">Check back soon — new jobs are posted daily.</p>
              </div>
            ) : (
              leads.map((lead) => (
                <Card key={lead.id} hover>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0D0D0D] dark:text-white text-sm mb-1">{lead.title}</p>
                      <div className="flex items-center gap-3 text-xs text-[#6B7280] dark:text-[#94A3B8] mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin size={10} />
                          {lead.location}
                        </div>
                        <span className="text-[#1E6FFF] font-semibold">{lead.category}</span>
                      </div>
                      <span className="text-xs text-[#9CA3AF]">
                        {formatRelativeTime(lead.created_at)}
                      </span>
                    </div>
                    <Link href={`/jobs/${lead.id}`}>
                      <button className="text-xs bg-[#1E6FFF] text-white font-bold px-3 py-1.5 rounded-lg hover:bg-[#1558CC] flex-shrink-0">
                        Bid Now
                      </button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-8 text-center">
            <MessageSquare size={32} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#374151] dark:text-[#CBD5E1]">Messages</p>
            <p className="text-xs text-[#9CA3AF] dark:text-[#64748B] mt-1 mb-4">
              View and manage all your conversations in the full messages view.
            </p>
            <Link href="/messages">
              <button className="text-sm bg-[#1E6FFF] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#1558CC]">
                Open Messages
              </button>
            </Link>
          </div>
        )}

        {activeTab === "revenue" && (
          <div className="max-w-lg mx-auto py-12 text-center">
            <div className="w-16 h-16 bg-[#0A1628] dark:bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <DollarSign size={28} className="text-[#1E6FFF]" />
            </div>
            <h3 className="font-black text-[#0A1628] dark:text-white text-xl mb-3">
              Revenue Tracker — Coming Soon
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] leading-relaxed mb-8">
              Once payments are live, this section will show your total earnings by month and by job — giving you a full financial picture of your business in one place.
            </p>
            <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-6 text-left">
              <p className="text-xs text-[#9CA3AF] font-bold uppercase tracking-widest mb-4">Preview</p>
              {[
                { label: "This Month", value: "$—,———" },
                { label: "Total Earned", value: "$——,———" },
                { label: "Jobs Paid", value: "——" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] dark:border-[#1E3A5F] last:border-0">
                  <span className="text-sm text-[#6B7280] dark:text-[#94A3B8]">{row.label}</span>
                  <span className="font-black text-[#D1D5DB] text-sm">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: "blue" | "yellow" | "green";
}) {
  const colors = {
    blue: "bg-[#EFF6FF] text-[#1E6FFF]",
    yellow: "bg-[#FFFBEB] text-[#D97706]",
    green: "bg-[#ECFDF5] text-[#059669]",
  };

  return (
    <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-4">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", colors[color])}>
        <Icon size={16} />
      </div>
      <p className="text-2xl font-black text-[#0A1628] dark:text-white">{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF] mt-0.5">{sub}</p>}
      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-1">{label}</p>
    </div>
  );
}
