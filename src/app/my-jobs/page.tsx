"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Clock, MapPin, DollarSign, ChevronRight, Briefcase } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface JobPost {
  id: string;
  title: string;
  category: string;
  location: string;
  timeline: string | null;
  budget_range: string | null;
  status: "open" | "in_progress" | "completed" | "cancelled";
  bid_count: number;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<string, "green" | "blue" | "default" | "yellow"> = {
  open: "green",
  in_progress: "blue",
  completed: "default",
  cancelled: "default",
};

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchJobs = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("job_posts")
        .select("id, title, category, location, timeline, budget_range, status, bid_count, created_at")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      setJobs(data ?? []);
      setLoading(false);
    };

    fetchJobs();
  }, [router]);

  const getCategoryLabel = (id: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === id)?.label || id;
  const getCategoryIcon = (id: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === id)?.icon || "📋";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628] transition-colors">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#0A1628] dark:text-white">My Jobs</h1>
            <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
              {loading ? "Loading..." : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} posted`}
            </p>
          </div>
          <Link href="/post-job">
            <Button variant="primary" size="sm">
              <Plus size={16} />
              Post a Job
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-[#E5E7EB] dark:bg-[#1E3A5F] rounded w-1/2 mb-3" />
                <div className="h-3 bg-[#E5E7EB] dark:bg-[#1E3A5F] rounded w-1/3 mb-4" />
                <div className="h-3 bg-[#E5E7EB] dark:bg-[#1E3A5F] rounded w-full" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#EFF6FF] dark:bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase size={28} className="text-[#1E6FFF]" />
            </div>
            <h2 className="text-xl font-black text-[#0A1628] dark:text-white mb-2">No jobs posted yet</h2>
            <p className="text-[#6B7280] dark:text-[#94A3B8] mb-6 text-sm">
              Post your first job and start getting bids from contractors in your area.
            </p>
            <Link href="/post-job">
              <Button variant="primary" size="lg">
                <Plus size={18} />
                Post My First Job
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-5 hover:shadow-md hover:border-[#1E6FFF] transition-all cursor-pointer"
                onClick={() => router.push(`/jobs/${job.id}`)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-black text-[#0A1628] dark:text-white truncate">{job.title}</h3>
                      <Badge variant={STATUS_BADGE[job.status]} size="sm">
                        {STATUS_LABELS[job.status]}
                      </Badge>
                    </div>
                    <span className="text-xs font-semibold text-[#1E6FFF] bg-[#EFF6FF] dark:bg-[#1E3A5F] px-2 py-0.5 rounded-full">
                      {getCategoryIcon(job.category)} {getCategoryLabel(job.category)}
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-[#9CA3AF] dark:text-[#64748B] flex-shrink-0 mt-1" />
                </div>

                <div className="flex flex-wrap gap-3 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                    <MapPin size={12} />
                    {job.location}
                  </div>
                  {job.timeline && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                      <Clock size={12} />
                      {job.timeline}
                    </div>
                  )}
                  {job.budget_range && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                      <DollarSign size={12} />
                      {job.budget_range}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6] dark:border-[#1E3A5F]">
                  <span className="text-xs text-[#9CA3AF] dark:text-[#64748B]">
                    Posted {formatRelativeTime(job.created_at)}
                  </span>
                  <span className={`text-sm font-black ${job.bid_count > 0 ? "text-[#1E6FFF]" : "text-[#9CA3AF]"}`}>
                    {job.bid_count} bid{job.bid_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
