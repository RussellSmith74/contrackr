"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, MessageSquare, DollarSign, Star, ThumbsUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string>;
  read_at: string | null;
  created_at: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  message:  MessageSquare,
  bid:      DollarSign,
  comment:  MessageSquare,
  like:     ThumbsUp,
  review:   Star,
};

const TYPE_COLOR: Record<string, string> = {
  message: "bg-[#1E6FFF] text-white",
  bid:     "bg-[#059669] text-white",
  comment: "bg-[#7C3AED] text-white",
  like:    "bg-[#F59E0B] text-white",
  review:  "bg-[#EC4899] text-white",
};

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("notifications")
      .select("id, type, title, body, data, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data as Notification[]);
      setUnread(data.filter((n: Notification) => !n.read_at).length);
    }
  }, [userId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen((prev) => !prev);
    if (!open && unread > 0) {
      // Mark all as read
      await createClient()
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null);
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    }
  };

  const handleClick = async (n: Notification) => {
    setOpen(false);
    if (!n.read_at) {
      await createClient()
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
      setUnread((prev) => Math.max(0, prev - 1));
    }
    const link = n.data?.link;
    if (link) router.push(link);
  };

  const clearAll = async () => {
    await createClient()
      .from("notifications")
      .delete()
      .eq("user_id", userId);
    setNotifications([]);
    setUnread(0);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2.5 text-[#94A3B8] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] dark:border-[#1E3A5F]">
            <h3 className="font-bold text-[#0D0D0D] dark:text-white text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <X size={12} />
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                const color = TYPE_COLOR[n.type] ?? "bg-[#6B7280] text-white";
                const isUnread = !n.read_at;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3.5 hover:bg-[#F8FAFC] dark:hover:bg-[#1E3A5F] transition-colors text-left border-b border-[#F3F4F6] dark:border-[#1E3A5F] last:border-0",
                      isUnread && "bg-[#EFF6FF] dark:bg-[#0A1628]/60"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", color)}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[13px] leading-snug", isUnread ? "font-bold text-[#0D0D0D] dark:text-white" : "font-semibold text-[#374151] dark:text-[#CBD5E1]")}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[12px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[11px] text-[#9CA3AF] dark:text-[#64748B] mt-1">{formatRelativeTime(n.created_at)}</p>
                    </div>
                    {isUnread && (
                      <div className="w-2 h-2 bg-[#1E6FFF] rounded-full flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
