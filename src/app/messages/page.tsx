"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Send, Search, ArrowLeft, MessageSquare } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface ChatItem {
  id: string;
  type: "direct" | "job";
  other_name: string;
  other_id: string;
  other_avatar: string | null;
  last_message: string | null;
  last_message_at: string | null;
  job_title: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

function MessagesInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [myId, setMyId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setMyId(data.user.id);
    });
  }, []);

  const loadAllChats = useCallback(async (userId: string): Promise<ChatItem[]> => {
    const supabase = createClient();

    // Load direct chats
    const { data: directChats } = await supabase
      .from("direct_chats")
      .select("id, last_message, last_message_at, user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    // Fetch other-user profiles for direct chats
    const otherIds = (directChats ?? []).map((c) =>
      c.user1_id === userId ? c.user2_id : c.user1_id
    ).filter(Boolean);

    const { data: otherProfiles } = otherIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherIds)
      : { data: [] };

    const profileMap = Object.fromEntries((otherProfiles ?? []).map((p) => [p.id, p]));

    const directItems: ChatItem[] = (directChats ?? []).map((c) => {
      const otherId = c.user1_id === userId ? c.user2_id : c.user1_id;
      const other = profileMap[otherId];
      return {
        id: c.id,
        type: "direct",
        other_name: other?.full_name ?? "User",
        other_id: otherId,
        other_avatar: other?.avatar_url ?? null,
        last_message: c.last_message,
        last_message_at: c.last_message_at,
        job_title: null,
      };
    });

    // Load job-based conversations
    const { data: cp } = await supabase
      .from("contractor_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    const contractorId = cp?.id ?? null;

    const { data: convs } = await supabase
      .from("conversations")
      .select(`
        id, last_message, last_message_at,
        customer:profiles!conversations_customer_id_fkey(id, full_name, avatar_url),
        contractor:contractor_profiles!conversations_contractor_id_fkey(id, business_name, profiles(id, full_name, avatar_url)),
        job_posts(title)
      `)
      .or(contractorId ? `customer_id.eq.${userId},contractor_id.eq.${contractorId}` : `customer_id.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    const jobItems: ChatItem[] = (convs ?? []).map((c: unknown) => {
      const conv = c as {
        id: string;
        last_message: string | null;
        last_message_at: string | null;
        customer: { id: string; full_name: string; avatar_url: string | null } | null;
        contractor: { id: string; business_name: string; profiles: { id: string; full_name: string; avatar_url: string | null } | null } | null;
        job_posts: { title: string } | null;
      };
      const isCustomer = conv.customer?.id === userId;
      const other_name = isCustomer
        ? (conv.contractor?.business_name ?? "Contractor")
        : (conv.customer?.full_name ?? "Customer");
      const other_id = isCustomer
        ? (conv.contractor?.profiles?.id ?? "")
        : (conv.customer?.id ?? "");
      const other_avatar = isCustomer
        ? (conv.contractor?.profiles?.avatar_url ?? null)
        : (conv.customer?.avatar_url ?? null);
      return {
        id: conv.id,
        type: "job",
        other_name,
        other_id,
        other_avatar,
        last_message: conv.last_message,
        last_message_at: conv.last_message_at,
        job_title: conv.job_posts?.title ?? null,
      };
    });

    return [...directItems, ...jobItems].sort((a, b) => {
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return tb - ta;
    });
  }, []);

  const findOrCreateDirectChat = useCallback(async (userId: string, otherId: string): Promise<string | null> => {
    const supabase = createClient();
    // Look for existing chat either direction
    const { data: existing } = await supabase
      .from("direct_chats")
      .select("id")
      .or(`and(user1_id.eq.${userId},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${userId})`)
      .single();

    if (existing) return existing.id;

    // Create new chat
    const { data: created } = await supabase
      .from("direct_chats")
      .insert({ user1_id: userId, user2_id: otherId })
      .select("id")
      .single();

    return created?.id ?? null;
  }, []);

  // Initial load
  useEffect(() => {
    if (!myId) return;
    loadAllChats(myId).then(async (items) => {
      setChats(items);
      setLoading(false);

      // Handle ?with=<user_id> param
      const withUserId = searchParams.get("with");
      if (withUserId && withUserId !== myId) {
        const chatId = await findOrCreateDirectChat(myId, withUserId);
        if (chatId) {
          // Reload chats to include the new one
          const refreshed = await loadAllChats(myId);
          setChats(refreshed);
          const chat = refreshed.find((c) => c.id === chatId);
          if (chat) setActiveChat(chat);
        }
        // Remove the ?with param from URL
        router.replace("/messages");
      }
    });
  }, [myId, loadAllChats, findOrCreateDirectChat, searchParams, router]);

  const loadMessages = useCallback(async (chat: ChatItem) => {
    const supabase = createClient();
    if (chat.type === "direct") {
      const { data } = await supabase
        .from("direct_messages")
        .select("id, sender_id, content, created_at")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    } else {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", chat.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    }
  }, []);

  // Poll when a chat is active
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeChat || !myId) return;

    loadMessages(activeChat);
    pollRef.current = setInterval(() => {
      loadMessages(activeChat);
      loadAllChats(myId).then(setChats);
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChat, loadMessages, loadAllChats, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeChat || !myId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    const supabase = createClient();

    if (activeChat.type === "direct") {
      await supabase.from("direct_messages").insert({
        chat_id: activeChat.id,
        sender_id: myId,
        content,
      });
      await supabase
        .from("direct_chats")
        .update({ last_message: content, last_message_at: new Date().toISOString() })
        .eq("id", activeChat.id);
    } else {
      await supabase.from("messages").insert({
        conversation_id: activeChat.id,
        sender_id: myId,
        content,
      });
      await supabase
        .from("conversations")
        .update({ last_message: content, last_message_at: new Date().toISOString() })
        .eq("id", activeChat.id);
    }

    // Notify the other person
    if (activeChat.other_id) {
      const { data: me } = await supabase.from("profiles").select("full_name").eq("id", myId).single();
      await supabase.from("notifications").insert({
        user_id: activeChat.other_id,
        type: "message",
        title: `New message from ${me?.full_name ?? "Someone"}`,
        body: content.slice(0, 100),
        data: { link: "/messages" },
      });
    }

    await loadMessages(activeChat);
    await loadAllChats(myId).then(setChats);
    setSending(false);
  };

  const openChat = (chat: ChatItem) => {
    setActiveChat(chat);
    setMessages([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const filtered = chats.filter((c) =>
    c.other_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.job_title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1628] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl w-full mx-auto flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-[#0D1F3C] border-r border-[#E5E7EB] dark:border-[#1E3A5F] flex flex-col",
          activeChat && "hidden md:flex"
        )}>
          <div className="px-4 py-4 border-b border-[#E5E7EB] dark:border-[#1E3A5F]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-[#0A1628] dark:text-white text-lg">Messages</h2>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-[#F3F4F6] dark:bg-[#1E3A5F] text-[#0D0D0D] dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E6FFF] placeholder:text-[#9CA3AF]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-[#9CA3AF]">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <MessageSquare size={32} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#374151] dark:text-[#CBD5E1]">No conversations yet</p>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Click Message on any post in the feed to start a conversation.
                </p>
              </div>
            ) : (
              filtered.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-4 border-b border-[#F3F4F6] dark:border-[#1E3A5F] hover:bg-[#F8FAFC] dark:hover:bg-[#1E3A5F] transition-colors text-left",
                    activeChat?.id === chat.id && "bg-[#EFF6FF] dark:bg-[#1E3A5F] border-l-2 border-l-[#1E6FFF]"
                  )}
                >
                  <Avatar name={chat.other_name} src={chat.other_avatar ?? undefined} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-bold text-[#0D0D0D] dark:text-white truncate">{chat.other_name}</p>
                      {chat.last_message_at && (
                        <span className="text-xs text-[#9CA3AF] flex-shrink-0 ml-2">
                          {formatRelativeTime(chat.last_message_at)}
                        </span>
                      )}
                    </div>
                    {chat.last_message ? (
                      <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] truncate">{chat.last_message}</p>
                    ) : (
                      <p className="text-xs text-[#9CA3AF] italic truncate">No messages yet — say hi!</p>
                    )}
                    {chat.job_title && (
                      <p className="text-xs text-[#1E6FFF] truncate mt-0.5">📋 {chat.job_title}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        {activeChat ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-[#0A1628]">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-[#E5E7EB] dark:border-[#1E3A5F] flex items-center gap-3 bg-white dark:bg-[#0D1F3C]">
              <button
                onClick={() => setActiveChat(null)}
                className="md:hidden p-1 text-[#6B7280] dark:text-[#94A3B8]"
              >
                <ArrowLeft size={20} />
              </button>
              <Avatar name={activeChat.other_name} src={activeChat.other_avatar ?? undefined} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0D0D0D] dark:text-white text-sm">{activeChat.other_name}</p>
                {activeChat.job_title && (
                  <p className="text-xs text-[#1E6FFF] truncate">Re: {activeChat.job_title}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare size={32} className="text-[#CBD5E1] dark:text-[#334155] mx-auto mb-3" />
                    <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                      Send the first message to start the conversation.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === myId;
                  return (
                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        isMe
                          ? "bg-[#1E6FFF] text-white rounded-br-sm"
                          : "bg-[#F3F4F6] dark:bg-[#1E3A5F] text-[#0D0D0D] dark:text-white rounded-bl-sm"
                      )}>
                        <p>{msg.content}</p>
                        <p className={cn("text-xs mt-1", isMe ? "text-blue-200" : "text-[#9CA3AF]")}>
                          {formatRelativeTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-[#E5E7EB] dark:border-[#1E3A5F] bg-white dark:bg-[#0D1F3C]">
              <div className="flex items-end gap-3">
                <div className="flex-1 bg-[#F3F4F6] dark:bg-[#1E3A5F] rounded-2xl px-4 py-3">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="w-full bg-transparent text-sm text-[#0D0D0D] dark:text-white placeholder:text-[#9CA3AF] focus:outline-none resize-none"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-11 h-11 bg-[#1E6FFF] rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-[#1558CC] transition-colors flex-shrink-0"
                >
                  <Send size={18} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0A1628]">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#E5E7EB] dark:bg-[#1E3A5F] rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={24} className="text-[#9CA3AF] dark:text-[#64748B]" />
              </div>
              <p className="font-bold text-[#0D0D0D] dark:text-white">Select a conversation</p>
              <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mt-1">
                Or click Message on any post to start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  );
}
