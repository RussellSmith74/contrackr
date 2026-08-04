"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Search, PlusSquare, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/**
 * Mobile-only bottom navigation. Hidden from sm: up, where the Navbar's own
 * links take over — so this adds nothing to the desktop layout.
 */
export default function BottomTabBar() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<"customer" | "contractor" | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const loadProfile = async (id: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", id)
        .single();
      if (profile) {
        setUserId(profile.id);
        setRole(profile.role as "customer" | "contractor");
      }
    };

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserId(null);
        return;
      }
      loadProfile(user.id);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUserId(null);
        setRole(null);
        return;
      }
      // Never call supabase.auth.* synchronously inside this callback — the
      // client holds a lock while dispatching, so it deadlocks and sign-in
      // hangs forever. Use the session we were handed, and defer the profile
      // query out of the callback frame.
      const id = session.user.id;
      setTimeout(() => loadProfile(id), 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Unread message count, polled on the same cadence as the navbar badge.
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const check = async () => {
      const { data: chats } = await supabase
        .from("direct_chats")
        .select("id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      if (!chats?.length) {
        setUnread(0);
        return;
      }
      const { count } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .in("chat_id", chats.map((c) => c.id))
        .neq("sender_id", userId)
        .is("read_at", null);
      setUnread(count ?? 0);
    };

    check();
    const timer = setInterval(check, 10000);
    return () => clearInterval(timer);
  }, [userId]);

  // Signed out: the marketing pages have their own calls to action.
  if (!userId) return null;

  const composeHref = role === "contractor" ? "/compose" : "/post-job";
  const profileHref = `/profile/${userId}`;

  const tabs = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: composeHref, label: "Post", icon: PlusSquare },
    { href: "/messages", label: "Chats", icon: MessageSquare, badge: unread },
    { href: profileHref, label: "You", icon: User },
  ];

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A1628]/95 backdrop-blur border-t border-[#1a2f50] pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="flex items-stretch">
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== "/feed" && pathname.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              // min-h-[3.25rem] keeps every target comfortably over the 44px
              // minimum touch size.
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[3.25rem] py-1.5 transition-colors",
                active ? "text-white" : "text-[#64748B]"
              )}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                {!!badge && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {active && <span className="absolute top-0 inset-x-4 h-0.5 bg-[#1E6FFF] rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
