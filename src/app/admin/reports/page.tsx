"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Flag, Check, X, ExternalLink, Inbox, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { REPORT_REASONS, type ReportReason, type ReportTargetType } from "@/lib/moderation";

interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  details: string | null;
  status: "open" | "actioned" | "dismissed";
  created_at: string;
  reviewed_at: string | null;
  reporter: { full_name: string | null } | null;
}

type StatusFilter = "open" | "actioned" | "dismissed" | "all";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "actioned", label: "Actioned" },
  { id: "dismissed", label: "Dismissed" },
  { id: "all", label: "All" },
];

const reasonLabel = (r: ReportReason) => REPORT_REASONS.find((x) => x.id === r)?.label ?? r;

function targetHref(type: ReportTargetType, id: string): string | null {
  if (type === "feed_post") return `/post/${id}?s=feed_post`;
  if (type === "job_post") return `/post/${id}?s=job_post`;
  if (type === "profile") return `/profile/${id}`;
  return null; // comments and messages have no standalone page yet
}

const TARGET_LABEL: Record<ReportTargetType, string> = {
  feed_post: "Feed post",
  job_post: "Job post",
  profile: "Profile",
  comment: "Comment",
  message: "Message",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [resolving, setResolving] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      setAllowed(true);

      const { data } = await supabase
        .from("reports")
        .select("id, reporter_id, target_type, target_id, reason, details, status, created_at, reviewed_at, reporter:profiles!reports_reporter_id_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(200);

      setReports(
        (data ?? []).map((r) => ({
          ...r,
          reporter: Array.isArray(r.reporter) ? r.reporter[0] ?? null : r.reporter,
        })) as Report[]
      );
      setLoading(false);
    };

    load();
  }, []);

  const resolve = async (id: string, status: "actioned" | "dismissed") => {
    setResolving(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("reports")
      .update({ status, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, reviewed_at: new Date().toISOString() } : r))
      );
    }
    setResolving(null);
  };

  const visible = reports.filter((r) => filter === "all" || r.status === filter);
  const openCount = reports.filter((r) => r.status === "open").length;

  if (allowed === false) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628]">
        <Navbar />
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <Shield size={32} className="mx-auto mb-4 text-[#CBD5E1] dark:text-[#1E3A5F]" />
          <h1 className="text-xl font-bold text-[#0A1628] dark:text-white">Moderators only</h1>
          <p className="text-[15px] text-[#6B7280] dark:text-[#94A3B8] mt-2">
            This page is for Contrakr moderators.
          </p>
          <Link href="/feed" className="inline-block mt-6">
            <Button variant="primary" size="md">Back to feed</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] dark:bg-[#0A1628]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Shield size={20} className="text-[#1E6FFF]" />
          <h1 className="text-2xl font-bold text-[#0A1628] dark:text-white">Moderation</h1>
        </div>
        <p className="text-[15px] text-[#6B7280] dark:text-[#94A3B8] mb-6">
          {loading
            ? "Loading reports…"
            : openCount === 0
            ? "Nothing waiting on you."
            : `${openCount} report${openCount === 1 ? "" : "s"} waiting for review.`}
        </p>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-full text-[13px] font-semibold transition-all border",
                filter === f.id
                  ? "bg-[#1E6FFF] text-white border-[#1E6FFF] shadow-sm"
                  : "bg-transparent text-[#64748B] dark:text-[#94A3B8] border-[#CBD5E1] dark:border-[#1E3A5F] hover:border-[#1E6FFF] hover:text-[#1E6FFF] dark:hover:text-white"
              )}
            >
              {f.label}
              {f.id === "open" && openCount > 0 && (
                <span className="ml-1.5 opacity-80">{openCount}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#94A3B8]">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <Inbox size={32} className="mx-auto mb-3 text-[#CBD5E1] dark:text-[#1E3A5F]" />
            <p className="text-lg font-bold text-[#0F172A] dark:text-white">
              {filter === "open" ? "Queue is clear" : "Nothing here"}
            </p>
            <p className="text-sm mt-1 text-[#64748B] dark:text-[#4B6A8A]">
              {filter === "open" ? "No reports need your attention." : "No reports with this status."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((r) => {
              const href = targetHref(r.target_type, r.target_id);
              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/25 text-[#DC2626] dark:text-[#F87171]">
                        <Flag size={11} />
                        {reasonLabel(r.reason)}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#1E3A5F] text-[#64748B] dark:text-[#94A3B8]">
                        {TARGET_LABEL[r.target_type]}
                      </span>
                      {r.status !== "open" && (
                        <span
                          className={cn(
                            "text-[11px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md",
                            r.status === "actioned"
                              ? "bg-[#ECFDF5] dark:bg-[#064E3B] text-[#059669] dark:text-[#34D399]"
                              : "bg-[#F1F5F9] dark:bg-[#1E3A5F] text-[#64748B] dark:text-[#94A3B8]"
                          )}
                        >
                          {r.status}
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-[#94A3B8] dark:text-[#4B6A8A] flex-shrink-0">
                      {formatRelativeTime(r.created_at)}
                    </span>
                  </div>

                  {r.details && (
                    <p className="text-[14px] text-[#374151] dark:text-[#CBD5E1] leading-relaxed mb-3 whitespace-pre-wrap">
                      {r.details}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
                    <div className="flex items-center gap-3 text-[12.5px] text-[#94A3B8] dark:text-[#4B6A8A]">
                      <span>
                        Reported by{" "}
                        <Link
                          href={`/profile/${r.reporter_id}`}
                          className="text-[#1E6FFF] dark:text-[#60A5FA] font-medium hover:underline"
                        >
                          {r.reporter?.full_name ?? "Unknown"}
                        </Link>
                      </span>
                      {href ? (
                        <Link
                          href={href}
                          className="inline-flex items-center gap-1 text-[#1E6FFF] dark:text-[#60A5FA] font-medium hover:underline"
                        >
                          View content
                          <ExternalLink size={12} />
                        </Link>
                      ) : (
                        <span className="font-mono text-[11px]">{r.target_id.slice(0, 8)}</span>
                      )}
                    </div>

                    {r.status === "open" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={resolving === r.id}
                          onClick={() => resolve(r.id, "dismissed")}
                          className="dark:text-[#94A3B8] dark:hover:bg-[#1E3A5F]"
                        >
                          <X size={14} />
                          Dismiss
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={resolving === r.id}
                          onClick={() => resolve(r.id, "actioned")}
                        >
                          <Check size={14} />
                          Actioned
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
