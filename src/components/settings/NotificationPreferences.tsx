"use client";

import { useEffect, useState } from "react";
import { Mail, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Prefs {
  email_notifications: boolean;
  job_match_alerts: boolean;
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-12 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50",
        checked ? "bg-[#1E6FFF]" : "bg-[#D1D5DB] dark:bg-[#334155]"
      )}
    >
      <span
        className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
          checked ? "translate-x-7" : "translate-x-1"
        )}
      />
    </button>
  );
}

export default function NotificationPreferences({ role }: { role: "customer" | "contractor" | null }) {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("email_notifications, job_match_alerts")
        .eq("id", user.id)
        .single();
      if (data) {
        setPrefs({
          email_notifications: data.email_notifications ?? true,
          job_match_alerts: data.job_match_alerts ?? true,
        });
      }
    };
    load();
  }, []);

  const update = async (patch: Partial<Prefs>) => {
    if (!prefs) return;
    const next = { ...prefs, ...patch };
    setPrefs(next); // optimistic — a toggle that lags feels broken
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPrefs(prefs);
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id);

    if (updateError) {
      setPrefs(prefs); // roll back
      setError("Couldn't save that. Try again in a moment.");
    }
    setSaving(false);
  };

  if (!prefs) return null;

  return (
    <div className="bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl p-6">
      <h2 className="text-[17px] font-bold text-[#0A1628] dark:text-white mb-1">
        Notification emails
      </h2>
      <p className="text-[14px] text-[#6B7280] dark:text-[#94A3B8] mb-5 leading-relaxed">
        Push notifications are managed separately, per device, below.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Mail size={18} className="text-[#1E6FFF] mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#0A1628] dark:text-white">
                Email me about activity
              </p>
              <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                Messages, bids, comments, and reviews.
              </p>
            </div>
          </div>
          <Switch
            checked={prefs.email_notifications}
            onChange={(v) => update({ email_notifications: v })}
            disabled={saving}
            label="Email me about activity"
          />
        </div>

        {role === "contractor" && (
          <div className="flex items-start justify-between gap-4 pt-4 border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
            <div className="flex items-start gap-3 min-w-0">
              <Briefcase size={18} className="text-[#059669] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#0A1628] dark:text-white">
                  New jobs near me
                </p>
                <p className="text-[13px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                  Alert me when someone posts a job matching my trades and service area.
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.job_match_alerts}
              onChange={(v) => update({ job_match_alerts: v })}
              disabled={saving}
              label="New jobs near me"
            />
          </div>
        )}
      </div>

      {error && <p className="text-[13px] text-red-600 dark:text-red-400 mt-4">{error}</p>}
    </div>
  );
}
