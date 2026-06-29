"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, MessageSquare, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/layout/NotificationBell";

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: "customer" | "contractor";
}

export default function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [contractorProfileId, setContractorProfileId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setUser(null); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .eq("id", authUser.id)
        .single();

      if (!profile) return;
      setUser(profile as UserProfile);

      if (profile.role === "contractor") {
        const { data: cp } = await supabase
          .from("contractor_profiles")
          .select("id")
          .eq("user_id", authUser.id)
          .single();
        if (cp) setContractorProfileId(cp.id);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUser(null); setContractorProfileId(null); return; }
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Poll for unread messages every 10 seconds
  useEffect(() => {
    if (!user) return;

    const checkUnread = async () => {
      const supabase = createClient();

      // Get conversations where user is a participant
      let contractorId: string | null = null;
      if (user.role === "contractor") {
        const { data: cp } = await supabase
          .from("contractor_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        contractorId = cp?.id ?? null;
      }

      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(
          contractorId
            ? `customer_id.eq.${user.id},contractor_id.eq.${contractorId}`
            : `customer_id.eq.${user.id}`
        );

      if (!convs || convs.length === 0) { setUnreadMessages(0); return; }

      const convIds = convs.map((c: { id: string }) => c.id);

      // Count messages sent by others that are unread (no read_at)
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .neq("sender_id", user.id)
        .is("read_at", null);

      setUnreadMessages(count ?? 0);
    };

    checkUnread();
    pollRef.current = setInterval(checkUnread, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setContractorProfileId(null);
    setProfileOpen(false);
    router.push("/");
  };

  const navLinks = user
    ? user.role === "contractor"
      ? [
          { href: "/feed", label: "Feed" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/feed", label: "Browse Jobs" },
          { href: "/search", label: "Search" },
        ]
      : [
          { href: "/feed", label: "Feed" },
          { href: "/post-job", label: "Post a Job" },
          { href: "/search", label: "Find Contractors" },
          { href: "/my-jobs", label: "My Jobs" },
        ]
    : [];

  return (
    <nav className="sticky top-0 z-50 bg-[#0A1628] border-b border-[#1a2f50]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Wordmark */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <span className="text-white font-black text-2xl tracking-tight">
              Contrakr
            </span>
          </Link>

          {/* Desktop nav links */}
          {user && (
            <div className="hidden md:flex items-center gap-8 h-full">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className={cn(
                      "relative h-full flex items-center text-[15px] font-medium transition-colors pt-0.5",
                      isActive ? "text-white" : "text-[#94A3B8] hover:text-white"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E6FFF] rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Link
                  href="/search"
                  className="p-2.5 text-[#94A3B8] hover:text-white hover:bg-white/10 rounded-xl transition-colors md:hidden"
                >
                  <Search size={20} />
                </Link>

                {/* Messages icon with unread badge */}
                <Link
                  href="/messages"
                  className="relative p-2.5 text-[#94A3B8] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <MessageSquare size={20} />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#1E6FFF] rounded-full flex items-center justify-center text-white text-[10px] font-black leading-none">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Link>

                <NotificationBell userId={user.id} />

                {/* Profile dropdown */}
                <div className="relative ml-1">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
                  >
                    <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-xl shadow-xl py-1 z-50">
                      <div className="px-4 py-3 border-b border-[#E5E7EB]">
                        <p className="text-sm font-bold text-[#0D0D0D]">{user.full_name}</p>
                        <p className="text-xs text-[#6B7280] capitalize">{user.role}</p>
                      </div>
                      {user.role === "contractor" && contractorProfileId && (
                        <Link
                          href={`/contractors/${contractorProfileId}`}
                          className="block px-4 py-2.5 text-sm text-[#0D0D0D] hover:bg-[#F3F4F6]"
                          onClick={() => setProfileOpen(false)}
                        >
                          My Profile
                        </Link>
                      )}
                      {user.role === "contractor" && !contractorProfileId && (
                        <Link
                          href="/onboarding/contractor"
                          className="block px-4 py-2.5 text-sm text-[#0D0D0D] hover:bg-[#F3F4F6]"
                          onClick={() => setProfileOpen(false)}
                        >
                          Set Up Profile
                        </Link>
                      )}
                      <Link
                        href="/settings"
                        className="block px-4 py-2.5 text-sm text-[#0D0D0D] hover:bg-[#F3F4F6]"
                        onClick={() => setProfileOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-[#FEF2F2]"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>

                <button
                  className="md:hidden p-2.5 text-[#94A3B8] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <button className="text-sm font-semibold text-[#94A3B8] hover:text-white transition-colors px-3 py-2">
                    Sign In
                  </button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileOpen && (
        <div className="md:hidden border-t border-[#1a2f50] bg-[#0A1628]">
          {navLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}-mobile`}
              href={link.href}
              className={cn(
                "block px-5 py-3.5 text-[15px] font-medium border-b border-[#1a2f50]",
                pathname === link.href ? "text-[#1E6FFF]" : "text-[#94A3B8] hover:text-white"
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
