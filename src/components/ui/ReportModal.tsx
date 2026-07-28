"use client";

import { useEffect, useState } from "react";
import { X, Flag, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { REPORT_REASONS, type ReportReason, type ReportTargetType } from "@/lib/moderation";
import { cn } from "@/lib/utils";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  /** Shown in the header so the user can confirm they're reporting the right thing. */
  targetLabel?: string;
}

/**
 * Mounts the dialog only while open so a second report starts from a clean
 * slate — no reset effect needed.
 */
export function ReportModal({ open, ...props }: ReportModalProps) {
  if (!open) return null;
  return <ReportDialog {...props} />;
}

function ReportDialog({ onClose, targetType, targetId, targetLabel }: Omit<ReportModalProps, "open">) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to be signed in to report something.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    });

    if (insertError) {
      // 23505 = the unique constraint on (reporter, target). Already reported is
      // not really a failure from the user's point of view.
      if (insertError.code === "23505") {
        setDone(true);
      } else {
        setError("Couldn't send that report. Try again in a moment.");
      }
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Report content"
    >
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-[#F1F5F9] dark:border-[#1E3A5F]">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#0A1628] dark:text-white flex items-center gap-2">
              <Flag size={17} className="text-[#DC2626]" />
              {done ? "Report received" : "Report this"}
            </h2>
            {targetLabel && !done && (
              <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mt-1 truncate">{targetLabel}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 -mt-1 text-[#94A3B8] hover:text-[#0A1628] dark:hover:text-white rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B] flex items-center justify-center mx-auto mb-4">
              <Check size={22} className="text-[#059669] dark:text-[#34D399]" />
            </div>
            <p className="text-[15px] text-[#374151] dark:text-[#CBD5E1] leading-relaxed max-w-sm mx-auto">
              Thanks — this is in the moderation queue. We look at every report, and the content
              stays up until someone has reviewed it.
            </p>
            <Button variant="secondary" size="md" className="mt-6" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5">
              <p className="text-[13px] font-semibold text-[#0A1628] dark:text-white mb-3">
                What&apos;s the problem?
              </p>
              <div className="flex flex-col gap-1.5">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={cn(
                      "text-left px-4 py-3 rounded-xl border transition-all",
                      reason === r.id
                        ? "border-[#1E6FFF] bg-[#EFF6FF] dark:bg-[#12294a]"
                        : "border-[#E5E7EB] dark:border-[#1E3A5F] hover:border-[#CBD5E1] dark:hover:border-[#2A4A73]"
                    )}
                  >
                    <span className="block text-[14px] font-semibold text-[#0A1628] dark:text-white">
                      {r.label}
                    </span>
                    <span className="block text-[12.5px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                      {r.hint}
                    </span>
                  </button>
                ))}
              </div>

              <label className="block text-[13px] font-semibold text-[#0A1628] dark:text-white mt-5 mb-2">
                Anything else we should know?{" "}
                <span className="font-normal text-[#94A3B8]">
                  {reason === "other" ? "(required)" : "(optional)"}
                </span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Add any detail that would help us understand what happened."
                className="w-full text-[14px] text-[#0A1628] dark:text-white bg-[#F8FAFC] dark:bg-[#0A1628] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl px-3.5 py-3 leading-relaxed focus:outline-none focus:border-[#1E6FFF] resize-none placeholder:text-[#94A3B8] dark:placeholder:text-[#4B6A8A]"
              />

              {error && (
                <p className="text-[13px] text-red-600 dark:text-red-400 mt-3">{error}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 pb-6">
              <Button variant="ghost" size="md" onClick={onClose} className="dark:text-[#94A3B8] dark:hover:bg-[#1E3A5F]">
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                loading={submitting}
                disabled={!reason || (reason === "other" && !details.trim())}
                onClick={submit}
              >
                Submit report
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
