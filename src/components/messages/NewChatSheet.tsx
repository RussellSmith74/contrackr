"use client";

import { useEffect, useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { fetchBlockedIds } from "@/lib/moderation";

const MIN_QUERY = 2;

export interface PersonResult {
  id: string;
  name: string;
  avatar_url: string | null;
  role: "customer" | "contractor";
  /** Contractors are known by their business, so it leads and the owner's name sits under it. */
  business_name: string | null;
}

interface NewChatSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (person: PersonResult) => void;
}

export default function NewChatSheet({ open, onClose, onSelect }: NewChatSheetProps) {
  if (!open) return null;
  return <NewChatDialog onClose={onClose} onSelect={onSelect} />;
}

function NewChatDialog({ onClose, onSelect }: Omit<NewChatSheetProps, "open">) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

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

  useEffect(() => {
    const q = query.trim();
    let cancelled = false;

    // Debounced so typing doesn't fire a query per keystroke. The too-short
    // case is handled inside the callback rather than as an early return —
    // setState directly in an effect body triggers cascading renders.
    const timer = setTimeout(async () => {
      if (q.length < MIN_QUERY) {
        if (!cancelled) {
          setResults([]);
          setSearched(false);
        }
        return;
      }

      setSearching(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const [{ data: people }, { data: businesses }, blocked] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .ilike("full_name", `%${q}%`)
          .limit(20),
        // Contractors are searched by business name too — people know
        // "Adams Land Services", not "Walker Adams".
        supabase
          .from("contractor_profiles")
          .select("user_id, business_name, owner_name, logo_url")
          .ilike("business_name", `%${q}%`)
          .limit(20),
        fetchBlockedIds(supabase, user?.id ?? null),
      ]);

      if (cancelled) return;

      const merged = new Map<string, PersonResult>();

      for (const p of people ?? []) {
        merged.set(p.id, {
          id: p.id,
          name: p.full_name,
          avatar_url: p.avatar_url,
          role: p.role as "customer" | "contractor",
          business_name: null,
        });
      }

      for (const b of businesses ?? []) {
        const existing = merged.get(b.user_id);
        if (existing) {
          existing.business_name = b.business_name;
        } else {
          merged.set(b.user_id, {
            id: b.user_id,
            name: b.owner_name,
            avatar_url: b.logo_url,
            role: "contractor",
            business_name: b.business_name,
          });
        }
      }

      // Never surface yourself or anyone you've blocked — blocking would mean
      // nothing if search handed them straight back.
      if (user) merged.delete(user.id);
      for (const id of blocked) merged.delete(id);

      setResults([...merged.values()]);
      setSearching(false);
      setSearched(true);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="New message"
    >
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-[#0D1F3C] border border-[#E5E7EB] dark:border-[#1E3A5F] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-[#0A1628] dark:text-white">New message</h2>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-[#94A3B8] hover:text-[#0A1628] dark:hover:text-white rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              autoFocus
              type="text"
              placeholder="Search by name or business…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F3F4F6] dark:bg-[#1E3A5F] text-[#0D0D0D] dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E6FFF] placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-0">
          {query.trim().length < MIN_QUERY ? (
            <p className="px-3 py-8 text-center text-[13px] text-[#94A3B8] dark:text-[#4B6A8A]">
              Type at least {MIN_QUERY} characters to search.
            </p>
          ) : searching ? (
            <div className="flex justify-center py-8 text-[#94A3B8]">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : results.length === 0 && searched ? (
            <p className="px-3 py-8 text-center text-[13px] text-[#94A3B8] dark:text-[#4B6A8A]">
              Nobody found matching &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            results.map((person) => (
              <button
                key={person.id}
                onClick={() => onSelect(person)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-[#12294a] transition-colors text-left"
              >
                <Avatar name={person.name} src={person.avatar_url ?? undefined} size="md" />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#0A1628] dark:text-white truncate">
                    {person.business_name ?? person.name}
                  </p>
                  <p className="text-[12.5px] text-[#6B7280] dark:text-[#94A3B8] truncate capitalize">
                    {person.business_name ? `${person.name} · ` : ""}
                    {person.role}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
