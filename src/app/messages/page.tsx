"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Search, Phone, MoreVertical, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";


const MOCK_CONVERSATIONS = [
  {
    id: "1",
    name: "Marcus T.",
    preview: "Sounds good — when can you start?",
    time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    unread: 2,
    jobContext: "Backyard landscaping overhaul",
  },
  {
    id: "2",
    name: "Patricia M.",
    preview: "What wood do you recommend for the fence?",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread: 1,
    jobContext: "Full exterior fence installation",
  },
  {
    id: "3",
    name: "James H.",
    preview: "Do you have photos of past sod work?",
    time: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    unread: 0,
    jobContext: "Sod installation — front yard",
  },
  {
    id: "4",
    name: "Denise W.",
    preview: "Perfect, we'll see you Friday then.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unread: 0,
    jobContext: "Driveway pressure wash",
  },
];

type Message = {
  id: string;
  senderId: string;
  content: string;
  time: string;
};

const MOCK_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "1", senderId: "marcus", content: "Hey, I saw your profile and your work looks great. I posted a landscaping job — the backyard needs a full overhaul.", time: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: "2", senderId: "me", content: "Thanks Marcus! I saw your post — about a half acre, right? I can definitely help with that. Can I come take a look this week?", time: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
    { id: "3", senderId: "marcus", content: "Yes exactly. Wednesday afternoon work for you?", time: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
    { id: "4", senderId: "me", content: "Wednesday at 2pm works perfectly. I'll bring some samples of the sod and shrub options we typically use.", time: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: "5", senderId: "marcus", content: "Sounds good — when can you start?", time: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  ],
  "2": [
    { id: "1", senderId: "patricia", content: "Hi! I posted a job for a full fence around my property — about 200 linear feet.", time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
    { id: "2", senderId: "me", content: "Hi Patricia! Happy to help with that. Do you have a preference on material — wood, vinyl, chain link, or wrought iron?", time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
    { id: "3", senderId: "patricia", content: "What wood do you recommend for the fence?", time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  ],
};

export default function MessagesPage() {
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConvData = activeConv ? MOCK_CONVERSATIONS.find((c) => c.id === activeConv) : null;
  const activeMessages = activeConv ? (messages[activeConv] || []) : [];

  const filteredConvs = MOCK_CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.jobContext.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const sendMessage = () => {
    if (!input.trim() || !activeConv) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: "me",
      content: input.trim(),
      time: new Date().toISOString(),
    };
    setMessages((prev) => ({
      ...prev,
      [activeConv]: [...(prev[activeConv] || []), newMsg],
    }));
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-6xl w-full mx-auto flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col",
          activeConv && "hidden md:flex"
        )}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-[#E5E7EB]">
            <h2 className="font-black text-[#0A1628] text-lg mb-3">Messages</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-[#F3F4F6] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E6FFF]"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 border-b border-[#F3F4F6] hover:bg-[#F8FAFC] transition-colors text-left",
                  activeConv === conv.id && "bg-[#EFF6FF] border-l-2 border-l-[#1E6FFF]"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar name={conv.name} size="md" />
                  {conv.unread > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#1E6FFF] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-black">{conv.unread}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn("text-sm truncate", conv.unread > 0 ? "font-bold text-[#0D0D0D]" : "font-semibold text-[#374151]")}>
                      {conv.name}
                    </p>
                    <span className="text-xs text-[#9CA3AF] flex-shrink-0 ml-2">
                      {formatRelativeTime(conv.time)}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] truncate">{conv.preview}</p>
                  <p className="text-xs text-[#1E6FFF] truncate mt-0.5">📋 {conv.jobContext}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        {activeConv && activeConvData ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat header */}
            <div className="px-4 py-3.5 border-b border-[#E5E7EB] flex items-center gap-3">
              <button
                onClick={() => setActiveConv(null)}
                className="md:hidden p-1 text-[#6B7280]"
              >
                <ArrowLeft size={20} />
              </button>
              <Avatar name={activeConvData.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#0D0D0D] text-sm">{activeConvData.name}</p>
                <p className="text-xs text-[#1E6FFF] truncate">
                  Re: {activeConvData.jobContext}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-[#6B7280] hover:text-[#0D0D0D]">
                  <Phone size={18} />
                </button>
                <button className="p-2 text-[#6B7280] hover:text-[#0D0D0D]">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">
              {activeMessages.map((msg) => {
                const isMe = msg.senderId === "me";
                return (
                  <div
                    key={msg.id}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        isMe
                          ? "bg-[#1E6FFF] text-white rounded-br-sm"
                          : "bg-[#F3F4F6] text-[#0D0D0D] rounded-bl-sm"
                      )}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isMe ? "text-blue-200" : "text-[#9CA3AF]"
                        )}
                      >
                        {formatRelativeTime(msg.time)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-[#E5E7EB]">
              <div className="flex items-end gap-3">
                <div className="flex-1 bg-[#F3F4F6] rounded-2xl px-4 py-3">
                  <textarea
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
                    className="w-full bg-transparent text-sm text-[#0D0D0D] placeholder:text-[#9CA3AF] focus:outline-none resize-none"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-11 h-11 bg-[#1E6FFF] rounded-full flex items-center justify-center disabled:opacity-40 hover:bg-[#1558CC] transition-colors flex-shrink-0"
                >
                  <Send size={18} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-[#F8FAFC]">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#E5E7EB] rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-[#9CA3AF]" />
              </div>
              <p className="font-bold text-[#0D0D0D]">Select a conversation</p>
              <p className="text-sm text-[#6B7280] mt-1">
                Choose from your messages on the left
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
