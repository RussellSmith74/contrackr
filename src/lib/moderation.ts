import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportTargetType = "feed_post" | "job_post" | "profile" | "comment" | "message";

export type ReportReason =
  | "spam"
  | "harassment"
  | "fake"
  | "scam"
  | "inappropriate"
  | "other";

export const REPORT_REASONS: { id: ReportReason; label: string; hint: string }[] = [
  { id: "spam",          label: "Spam or repetitive posting", hint: "Unsolicited advertising, the same post over and over" },
  { id: "scam",          label: "Scam or fraud",              hint: "Trying to take money or move people off-platform to defraud them" },
  { id: "fake",          label: "Fake or misleading",         hint: "Stolen work photos, made-up credentials, fake reviews" },
  { id: "harassment",    label: "Harassment or threats",      hint: "Targeting, threatening, or discriminating against someone" },
  { id: "inappropriate", label: "Inappropriate content",      hint: "Not suitable for the platform" },
  { id: "other",         label: "Something else",             hint: "Tell us what's wrong below" },
];

/**
 * IDs the current user has blocked. Blocking is one-directional and view-only:
 * it hides them from you, it does not hide you from them.
 */
export async function fetchBlockedIds(
  supabase: SupabaseClient,
  userId: string | null
): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", userId);
  return new Set((data ?? []).map((b: { blocked_id: string }) => b.blocked_id));
}

export async function blockUser(supabase: SupabaseClient, blockerId: string, blockedId: string) {
  return supabase.from("blocks").insert({ blocker_id: blockerId, blocked_id: blockedId });
}

export async function unblockUser(supabase: SupabaseClient, blockerId: string, blockedId: string) {
  return supabase.from("blocks").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
}
