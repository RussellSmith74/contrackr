"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Flag, Ban, Undo2 } from "lucide-react";
import { ReportModal } from "@/components/ui/ReportModal";
import { createClient } from "@/lib/supabase/client";
import { blockUser, unblockUser } from "@/lib/moderation";

interface UserActionsProps {
  targetUserId: string;
  targetName: string;
  currentUserId: string | null;
  /** Called after a successful block/unblock so the page can react. */
  onBlockChange?: (blocked: boolean) => void;
}

export function UserActions({ targetUserId, targetName, currentUserId, onBlockChange }: UserActionsProps) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [pending, setPending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelf = !currentUserId || currentUserId === targetUserId;

  useEffect(() => {
    if (isSelf) return;
    const check = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", currentUserId!)
        .eq("blocked_id", targetUserId)
        .maybeSingle();
      setBlocked(!!data);
    };
    check();
  }, [currentUserId, targetUserId, isSelf]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (isSelf) return null;

  const toggleBlock = async () => {
    setPending(true);
    const supabase = createClient();
    const { error } = blocked
      ? await unblockUser(supabase, currentUserId!, targetUserId)
      : await blockUser(supabase, currentUserId!, targetUserId);
    if (!error) {
      const next = !blocked;
      setBlocked(next);
      onBlockChange?.(next);
      setOpen(false);
    }
    setPending(false);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-[#E5E7EB] dark:border-[#1E3A5F] text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F3F4F6] dark:hover:bg-[#1E3A5F] transition-colors"
          aria-haspopup="menu"
          aria-expanded={open}
          title="More options"
        >
          <MoreHorizontal size={17} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-12 z-40 w-56 bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-xl shadow-lg overflow-hidden py-1 animate-fadeIn"
          >
            <button
              role="menuitem"
              onClick={() => { setOpen(false); setReporting(true); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-medium text-[#374151] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#12294a] transition-colors"
            >
              <Flag size={15} className="text-[#DC2626] flex-shrink-0" />
              Report {targetName.split(" ")[0]}
            </button>
            <button
              role="menuitem"
              onClick={toggleBlock}
              disabled={pending}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-medium text-[#374151] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#12294a] transition-colors disabled:opacity-50"
            >
              {blocked ? (
                <>
                  <Undo2 size={15} className="text-[#059669] flex-shrink-0" />
                  Unblock
                </>
              ) : (
                <>
                  <Ban size={15} className="text-[#DC2626] flex-shrink-0" />
                  Block {targetName.split(" ")[0]}
                </>
              )}
            </button>
            {!blocked && (
              <p className="px-4 pt-1.5 pb-2 text-[11.5px] leading-snug text-[#94A3B8] dark:text-[#4B6A8A]">
                Blocking hides their posts and messages from you. They aren&apos;t told.
              </p>
            )}
          </div>
        )}
      </div>

      <ReportModal
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="profile"
        targetId={targetUserId}
        targetLabel={targetName}
      />
    </>
  );
}
