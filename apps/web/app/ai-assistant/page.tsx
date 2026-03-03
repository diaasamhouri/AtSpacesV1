"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  spaces?: { name: string; type: string; city: string; price: string; rating: number; id: string }[];
}

interface Conversation {
  id: string;
  title: string;
  preview: string;
}

const sampleConversations: Conversation[] = [
  { id: "1", title: "Find a quiet office in Amman", preview: "I'm looking for a private office..." },
  { id: "2", title: "Compare meeting rooms", preview: "What meeting rooms are available..." },
  { id: "3", title: "Best rated spaces in Irbid", preview: "Show me top-rated coworking..." },
];

const suggestions = [
  "Find a hot desk in Amman",
  "Compare private offices",
  "Best rated spaces",
  "Spaces with parking",
];

const sampleAIResponses: Record<string, Message> = {
  "Find a hot desk in Amman": {
    id: "ai-1",
    role: "ai",
    content: "Here are some great hot desk options in Amman:",
    spaces: [
      { name: "Hub71 Amman", type: "Hot Desk", city: "Amman", price: "15 JOD/day", rating: 4.8, id: "1" },
      { name: "The Hive Workspace", type: "Hot Desk", city: "Amman", price: "12 JOD/day", rating: 4.6, id: "2" },
      { name: "Zain Innovation Campus", type: "Hot Desk", city: "Amman", price: "18 JOD/day", rating: 4.9, id: "3" },
    ],
  },
  "Compare private offices": {
    id: "ai-2",
    role: "ai",
    content: "Here's a comparison of popular private offices across Jordan:",
    spaces: [
      { name: "Regus Amman Center", type: "Private Office", city: "Amman", price: "350 JOD/mo", rating: 4.5, id: "4" },
      { name: "WeWork Abdali", type: "Private Office", city: "Amman", price: "400 JOD/mo", rating: 4.7, id: "5" },
    ],
  },
  "Best rated spaces": {
    id: "ai-3",
    role: "ai",
    content: "These are the highest-rated workspaces in Jordan:",
    spaces: [
      { name: "Zain Innovation Campus", type: "Hot Desk", city: "Amman", price: "18 JOD/day", rating: 4.9, id: "3" },
      { name: "Hub71 Amman", type: "Hot Desk", city: "Amman", price: "15 JOD/day", rating: 4.8, id: "1" },
    ],
  },
  "Spaces with parking": {
    id: "ai-4",
    role: "ai",
    content: "Here are workspaces that include dedicated parking:",
    spaces: [
      { name: "Regus Amman Center", type: "Private Office", city: "Amman", price: "350 JOD/mo", rating: 4.5, id: "4" },
      { name: "Jordan Business Center", type: "Meeting Room", city: "Amman", price: "25 JOD/hr", rating: 4.3, id: "6" },
    ],
  },
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleSend(text?: string) {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const matchedResponse = sampleAIResponses[messageText];
      const aiMsg: Message = matchedResponse || {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: `I'd be happy to help you find workspaces related to "${messageText}". Try browsing our spaces page for the latest availability, or ask me about specific cities, workspace types, or amenities.`,
      };
      setMessages((prev) => [...prev, { ...aiMsg, id: `ai-${Date.now()}` }]);
    }, 800);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen pt-20">
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-24 left-4 z-30 md:hidden flex h-10 w-10 items-center justify-center rounded-xl glass-card text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || typeof window !== "undefined") && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`${sidebarOpen ? "fixed inset-y-0 left-0 z-20 pt-20" : "hidden"} md:relative md:flex md:pt-0 w-72 shrink-0 flex-col glass-panel border-r border-white/5`}
          >
            <div className="p-4 border-b border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setSidebarOpen(false);
                }}
                className="w-full rounded-xl glass-card px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:border-brand-500/50 transition-colors flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {sampleConversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className="w-full text-left rounded-xl px-3 py-3 hover:bg-white/5 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{conv.title}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{conv.preview}</p>
                </button>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar backdrop (mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20">
            <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">AtSpaces AI</h1>
          <span className="text-xs font-medium text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full">Beta</span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl glass-card mb-6">
                <svg className="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ask me about workspaces in Jordan</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">I can help you find the perfect workspace, compare options, and answer questions about amenities and pricing.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="glass-card rounded-full px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:border-brand-500/50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] ${msg.role === "user" ? "bg-brand-500 text-white rounded-2xl rounded-br-md px-5 py-3" : ""}`}>
                    {msg.role === "ai" && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/20">
                          <svg className="h-3 w-3 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">AtSpaces AI</span>
                      </div>
                    )}
                    {msg.role === "ai" && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{msg.content}</p>
                    )}
                    {msg.role === "user" && (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                    {msg.spaces && (
                      <div className="mt-3 space-y-2">
                        {msg.spaces.map((space) => (
                          <div key={space.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{space.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{space.type} &middot; {space.city}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-brand-500">{space.price}</span>
                                <span className="text-xs text-slate-500">|</span>
                                <span className="text-xs text-yellow-500 flex items-center gap-0.5">
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                  {space.rating}
                                </span>
                              </div>
                            </div>
                            <Link
                              href={`/spaces/${space.id}`}
                              className="shrink-0 rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-bold text-brand-500 hover:bg-brand-500/20 transition-colors"
                            >
                              View
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="shrink-0 p-4 border-t border-white/5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-3xl mx-auto flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about workspaces in Jordan..."
              className="flex-1 glass-input rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
