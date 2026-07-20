"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Clock, DollarSign, ArrowLeft, CheckCircle, Loader2, ImageIcon, MessageSquare, BadgeCheck, Award, Hourglass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Textarea } from "@/components/ui/Input";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface JobDetail {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  timeline: string | null;
  budget_range: string | null;
  status: "open" | "in_progress" | "completed" | "cancelled";
  customer_completed: boolean;
  photos: string[];
  bid_count: number;
  created_at: string;
  customer: {
    full_name: string;
    avatar_url: string | null;
    location: string | null;
  } | null;
}

interface ExistingBid {
  id: string;
  amount: number;
  message: string;
  timeline: string | null;
  status: string;
  contractor_completed: boolean;
  created_at: string;
}

interface JobBid {
  id: string;
  amount: number;
  message: string;
  timeline: string | null;
  status: string;
  contractor_completed: boolean;
  created_at: string;
  contractor: {
    id: string;
    user_id: string;
    business_name: string;
    avatar_url: string | null;
    is_licensed: boolean;
    is_verified: boolean;
  } | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"customer" | "contractor" | null>(null);
  const [contractorProfileId, setContractorProfileId] = useState<string | null>(null);
  const [existingBid, setExistingBid] = useState<ExistingBid | null>(null);
  const [jobBids, setJobBids] = useState<JobBid[]>([]);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidForm, setBidForm] = useState({ amount: "", message: "", timeline: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bidSubmitted, setBidSubmitted] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState("");

  const isOwner = !!(job && myId && job.customer_id === myId);
  const acceptedBid = jobBids.find((b) => b.status === "accepted") ?? null;

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const [{ data: jobData }, { data: { user } }] = await Promise.all([
        supabase
          .from("job_posts")
          .select("id, customer_id, title, description, category, location, timeline, budget_range, status, customer_completed, photos, bid_count, created_at, profiles:customer_id(full_name, avatar_url, location)")
          .eq("id", jobId)
          .single(),
        supabase.auth.getUser(),
      ]);

      if (!jobData) { setLoading(false); return; }

      const profilesData = jobData.profiles as unknown as { full_name: string; avatar_url: string | null; location: string | null } | null;
      setJob({ ...jobData, customer: profilesData });

      if (user) {
        setMyId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setUserRole(profile?.role ?? null);

        // Job owner: load every bid with contractor info so they can review + accept.
        if (jobData.customer_id === user.id) {
          const { data: allBids } = await supabase
            .from("bids")
            .select("id, amount, message, timeline, status, contractor_completed, created_at, contractor:contractor_profiles(id, user_id, business_name, is_licensed, is_verified, profiles(avatar_url))")
            .eq("job_id", jobId)
            .order("created_at", { ascending: true });
          setJobBids(
            (allBids ?? []).map((b) => {
              const c = b.contractor as unknown as { id: string; user_id: string; business_name: string; is_licensed: boolean; is_verified: boolean; profiles: { avatar_url: string | null } | null } | null;
              return {
                id: b.id,
                amount: b.amount,
                message: b.message,
                timeline: b.timeline,
                status: b.status,
                contractor_completed: b.contractor_completed,
                created_at: b.created_at,
                contractor: c ? { id: c.id, user_id: c.user_id, business_name: c.business_name, avatar_url: c.profiles?.avatar_url ?? null, is_licensed: c.is_licensed, is_verified: c.is_verified } : null,
              };
            })
          );
        }

        if (profile?.role === "contractor") {
          const { data: cp } = await supabase
            .from("contractor_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (cp) {
            setContractorProfileId(cp.id);
            const { data: bid } = await supabase
              .from("bids")
              .select("id, amount, message, timeline, status, contractor_completed, created_at")
              .eq("job_id", jobId)
              .eq("contractor_id", cp.id)
              .single();
            setExistingBid(bid ?? null);
          }
        }
      }

      setLoading(false);
    };

    load();
  }, [jobId]);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorProfileId) return;
    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: bidError } = await supabase.from("bids").insert({
        job_id: jobId,
        contractor_id: contractorProfileId,
        amount: parseFloat(bidForm.amount),
        message: bidForm.message,
        timeline: bidForm.timeline || null,
      });

      if (bidError) throw bidError;

      setBidSubmitted(true);
      setShowBidForm(false);
      setJob((prev) => prev ? { ...prev, bid_count: prev.bid_count + 1 } : prev);

      // Notify the customer
      if (job?.customer) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: cp } = await supabase
          .from("contractor_profiles")
          .select("business_name, profiles(id)")
          .eq("id", contractorProfileId)
          .single();
        const contractorName = (cp as unknown as { business_name: string } | null)?.business_name ?? "A contractor";
        const { data: jobCustomer } = await supabase
          .from("job_posts")
          .select("customer_id")
          .eq("id", jobId)
          .single();
        if (jobCustomer?.customer_id && user && jobCustomer.customer_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: jobCustomer.customer_id,
            type: "bid",
            title: `${contractorName} submitted a bid on your job`,
            body: `${job.title} — $${parseFloat(bidForm.amount).toLocaleString()}`,
            data: { link: `/jobs/${jobId}` },
          });
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit bid.");
    } finally {
      setSubmitting(false);
    }
  };

  const notify = async (userId: string | undefined, type: string, title: string, body: string) => {
    if (!userId || userId === myId) return;
    await createClient().from("notifications").insert({
      user_id: userId, type, title, body, data: { link: `/jobs/${jobId}` },
    });
  };

  const handleAccept = async (bid: JobBid) => {
    if (!isOwner || !job) return;
    setActionPending(true);
    const supabase = createClient();

    // Reset any previously-accepted bid, then accept this one (others stay pending/open).
    await supabase.from("bids").update({ status: "pending" }).eq("job_id", job.id).eq("status", "accepted");
    const { error, count } = await supabase.from("bids").update({ status: "accepted" }, { count: "exact" }).eq("id", bid.id);
    if (error || count === 0) {
      setActionPending(false);
      alert(error ? `Couldn't accept this bid: ${error.message}` : "Couldn't accept this bid.");
      return;
    }
    await supabase.from("job_posts").update({ status: "in_progress" }).eq("id", job.id);

    await notify(bid.contractor?.user_id, "bid", "Your bid was accepted!", `${job.title} — $${Number(bid.amount).toLocaleString()}`);

    setJobBids((prev) => prev.map((b) => ({
      ...b,
      status: b.id === bid.id ? "accepted" : b.status === "accepted" ? "pending" : b.status,
    })));
    setJob((prev) => (prev ? { ...prev, status: "in_progress" } : prev));
    setActionPending(false);
  };

  const handleMarkComplete = async () => {
    if (!job) return;
    setActionPending(true);
    const supabase = createClient();

    if (isOwner) {
      await supabase.from("job_posts").update({ customer_completed: true }).eq("id", job.id);
      setJob((prev) => (prev ? { ...prev, customer_completed: true } : prev));
      await notify(acceptedBid?.contractor?.user_id, "bid", "Customer marked the job complete", `${job.title} — confirm on your end to close it out`);
    } else if (existingBid) {
      await supabase.from("bids").update({ contractor_completed: true }).eq("id", existingBid.id);
      setExistingBid((prev) => (prev ? { ...prev, contractor_completed: true } : prev));
      await notify(job.customer_id, "bid", "Contractor marked the job complete", `${job.title} — confirm on your end to close it out`);
    }

    // The DB trigger flips status to "completed" once both sides sign off — re-read it.
    const { data: fresh } = await supabase.from("job_posts").select("status, customer_completed").eq("id", jobId).single();
    if (fresh) setJob((prev) => (prev ? { ...prev, status: fresh.status as JobDetail["status"], customer_completed: fresh.customer_completed } : prev));
    setActionPending(false);
  };

  const getCategoryLabel = (id: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === id)?.label || id;
  const getCategoryIcon = (id: string) =>
    SERVICE_CATEGORIES.find((c) => c.id === id)?.icon || "📋";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-[#1E6FFF]" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-black text-[#0A1628] mb-2">Job not found</h1>
          <p className="text-[#6B7280] mb-6">This job may have been removed or the link is incorrect.</p>
          <Link href="/feed">
            <Button variant="primary">Back to Feed</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0A1628] mb-5 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Job card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mb-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-[#1E6FFF] bg-[#EFF6FF] px-2.5 py-1 rounded-full">
                  {getCategoryIcon(job.category)} {getCategoryLabel(job.category)}
                </span>
                <Badge
                  variant={job.status === "open" ? "green" : job.status === "in_progress" ? "blue" : "default"}
                  size="sm"
                >
                  {job.status === "open" ? "Open" : job.status === "in_progress" ? "In Progress" : job.status}
                </Badge>
              </div>
              <h1 className="text-2xl font-black text-[#0A1628]">{job.title}</h1>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 mb-5 pb-5 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
              <MapPin size={14} />
              {job.location}
            </div>
            {job.timeline && (
              <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                <Clock size={14} />
                {job.timeline}
              </div>
            )}
            {job.budget_range && (
              <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
                <DollarSign size={14} />
                {job.budget_range}
              </div>
            )}
            <span className="text-sm text-[#9CA3AF] ml-auto">
              Posted {formatRelativeTime(job.created_at)}
            </span>
          </div>

          {/* Description */}
          <div className="mb-5">
            <h2 className="text-sm font-bold text-[#0A1628] mb-2">Job Description</h2>
            <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Photos */}
          {job.photos && job.photos.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold text-[#0A1628] mb-2 flex items-center gap-1.5">
                <ImageIcon size={14} />
                Photos ({job.photos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {job.photos.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-[#F3F4F6] relative">
                    <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="200px" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posted by */}
          {job.customer && (
            <div className="flex items-center gap-3 pt-4 border-t border-[#F3F4F6]">
              <Avatar src={job.customer.avatar_url} name={job.customer.full_name} size="sm" />
              <div>
                <p className="text-xs text-[#9CA3AF]">Posted by</p>
                <p className="text-sm font-semibold text-[#0A1628]">{job.customer.full_name}</p>
              </div>
              <span className="ml-auto text-sm font-black text-[#1E6FFF]">
                {job.bid_count} bid{job.bid_count !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Owner: review bids, accept, and confirm completion */}
        {isOwner && (
          <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-6 mb-5">
            <h2 className="font-bold text-[#0A1628] dark:text-white mb-4">Bids ({jobBids.length})</h2>

            {job.status === "completed" ? (
              <div className="flex items-start gap-3 bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#D1FAE5] dark:border-[#065F46] rounded-xl p-4">
                <CheckCircle size={20} className="text-[#059669] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#065F46] dark:text-[#34D399]">Job completed</p>
                  <p className="text-sm text-[#047857] dark:text-[#6EE7B7] mt-0.5">
                    You and {acceptedBid?.contractor?.business_name ?? "the contractor"} both confirmed this job is done.
                  </p>
                </div>
              </div>
            ) : acceptedBid ? (
              <div className="bg-[#EFF6FF] dark:bg-[#1E3A5F] border border-[#BFDBFE] dark:border-[#264a73] rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-[#0A1628] dark:text-white">
                  You accepted {acceptedBid.contractor?.business_name ?? "a contractor"}
                </p>
                {job.customer_completed ? (
                  <p className="flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
                    <Hourglass size={13} /> Waiting for {acceptedBid.contractor?.business_name ?? "the contractor"} to confirm completion.
                  </p>
                ) : (
                  <>
                    {acceptedBid.contractor_completed && (
                      <p className="text-sm text-[#059669] dark:text-[#34D399] mt-1">
                        {acceptedBid.contractor?.business_name ?? "The contractor"} marked this done — confirm to close it out.
                      </p>
                    )}
                    <Button variant="primary" size="sm" className="mt-3" loading={actionPending} onClick={handleMarkComplete}>
                      <CheckCircle size={15} /> Mark as completed
                    </Button>
                  </>
                )}
              </div>
            ) : null}

            {jobBids.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] dark:text-[#64748B] text-center py-6">
                No bids yet. Contractors who bid on your job will show up here.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {jobBids.map((b) => (
                  <div key={b.id} className="border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={b.contractor ? `/contractors/${b.contractor.id}` : "#"} className="flex items-center gap-3 min-w-0">
                        <Avatar src={b.contractor?.avatar_url} name={b.contractor?.business_name ?? "Contractor"} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-[#0A1628] dark:text-white truncate">{b.contractor?.business_name ?? "Contractor"}</p>
                            {b.contractor?.is_licensed && <Award size={13} className="text-[#7C3AED] flex-shrink-0" aria-label="Licensed" />}
                            {b.contractor?.is_verified && <BadgeCheck size={13} className="text-[#059669] flex-shrink-0" aria-label="Verified" />}
                          </div>
                          <p className="text-xs text-[#9CA3AF] dark:text-[#64748B]">{b.timeline ?? "No timeline given"}</p>
                        </div>
                      </Link>
                      <span className="text-base font-black text-[#0A1628] dark:text-white flex-shrink-0">${Number(b.amount).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-[#4B5563] dark:text-[#CBD5E1] mt-3 leading-relaxed">{b.message}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F3F4F6] dark:border-[#1E3A5F]">
                      {b.contractor ? (
                        <Link href={`/messages?with=${b.contractor.user_id}`}>
                          <Button variant="ghost" size="sm"><MessageSquare size={14} /> Message</Button>
                        </Link>
                      ) : <span />}
                      {b.status === "accepted" ? (
                        <Badge variant="blue" size="sm"><CheckCircle size={11} className="mr-1" /> Accepted</Badge>
                      ) : job.status !== "completed" && (
                        <Button variant="primary" size="sm" loading={actionPending} onClick={() => handleAccept(b)}>
                          {acceptedBid ? "Accept instead" : "Accept bid"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bid section — contractors only */}
        {userRole === "contractor" && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
            {bidSubmitted || existingBid ? (
              job.status === "completed" && existingBid?.status === "accepted" ? (
                <div className="flex items-start gap-3">
                  <CheckCircle size={22} className="text-[#059669] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#0A1628] dark:text-white">Job completed</p>
                    <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                      Both sides confirmed this job is done — it now counts toward your track record.
                    </p>
                  </div>
                </div>
              ) : existingBid?.status === "accepted" ? (
                <div>
                  <div className="flex items-start gap-3">
                    <CheckCircle size={22} className="text-[#059669] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[#0A1628] dark:text-white">Your bid was accepted</p>
                      <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                        ${existingBid.amount.toLocaleString()} — the customer chose you for this job.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#F3F4F6] dark:border-[#1E3A5F]">
                    {existingBid.contractor_completed ? (
                      <p className="flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                        <Hourglass size={13} /> You marked this done. Waiting for the customer to confirm.
                      </p>
                    ) : (
                      <Button variant="primary" size="sm" loading={actionPending} onClick={handleMarkComplete}>
                        <CheckCircle size={15} /> Mark as completed
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <CheckCircle size={22} className="text-[#059669] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#0A1628] dark:text-white">Bid submitted</p>
                    {existingBid && (
                      <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                        ${existingBid.amount.toLocaleString()} — {existingBid.message.slice(0, 80)}{existingBid.message.length > 80 ? "..." : ""}
                      </p>
                    )}
                    {bidSubmitted && !existingBid && (
                      <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                        ${parseFloat(bidForm.amount).toLocaleString()} — your bid has been sent to the customer.
                      </p>
                    )}
                  </div>
                </div>
              )
            ) : !contractorProfileId ? (
              <div className="text-center py-4">
                <p className="text-sm text-[#6B7280] mb-3">Complete your contractor profile to submit bids.</p>
                <Link href="/onboarding/contractor">
                  <Button variant="primary" size="sm">Complete Profile</Button>
                </Link>
              </div>
            ) : job.status !== "open" ? (
              <p className="text-sm text-[#9CA3AF] text-center py-2">This job is no longer accepting bids.</p>
            ) : showBidForm ? (
              <form onSubmit={handleSubmitBid} className="flex flex-col gap-4">
                <h2 className="font-bold text-[#0A1628]">Submit Your Bid</h2>

                <Input
                  label="Your Price"
                  type="number"
                  placeholder="1200"
                  value={bidForm.amount}
                  onChange={(e) => setBidForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                  hint="Enter your total price in dollars"
                />

                <Textarea
                  label="Cover Message"
                  placeholder="Tell the customer why you're the right person for this job. Mention your experience with similar projects, your approach, and what sets you apart..."
                  value={bidForm.message}
                  onChange={(e) => setBidForm((p) => ({ ...p, message: e.target.value }))}
                  rows={4}
                  required
                />

                <Input
                  label="Estimated Timeline (optional)"
                  placeholder="e.g. 2–3 days"
                  value={bidForm.timeline}
                  onChange={(e) => setBidForm((p) => ({ ...p, timeline: e.target.value }))}
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="ghost" size="lg" onClick={() => setShowBidForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={submitting}
                    disabled={!bidForm.amount || !bidForm.message}
                    className="flex-2"
                  >
                    Send Bid
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0A1628]">Interested in this job?</p>
                  <p className="text-sm text-[#6B7280]">{job.bid_count} contractor{job.bid_count !== 1 ? "s have" : " has"} already bid</p>
                </div>
                <Button variant="primary" onClick={() => setShowBidForm(true)}>
                  Submit Bid
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Logged-out CTA */}
        {!userRole && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 text-center">
            <p className="font-bold text-[#0A1628] mb-1">Are you a contractor?</p>
            <p className="text-sm text-[#6B7280] mb-4">Sign up free to submit a bid on this job.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/signup"><Button variant="primary">Sign Up Free</Button></Link>
              <Link href="/login"><Button variant="ghost">Log In</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
