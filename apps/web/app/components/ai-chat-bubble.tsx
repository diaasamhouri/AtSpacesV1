"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const suggestions = [
  "Find a hot desk in Amman",
  "Compare private offices",
  "Best rated spaces",
  "Spaces with parking",
];

export function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide on vendor, admin, auth pages and the full AI assistant page
  if (
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/ai-assistant")
  ) {
    return null;
  }

  return (
    <>
      {/* Floating Bubble Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-gray-900 dark:text-white shadow-brand-glow hover:shadow-[0_0_30px_rgba(255,91,4,0.5)] active:scale-95 transition-shadow"
            aria-label="Open AI Assistant"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full border-2 border-brand-500 opacity-0 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-40 w-[360px] sm:w-[400px] h-[500px] rounded-3xl glass-panel shadow-float flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/20">
                  <svg className="h-3.5 w-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">AtSpaces AI</span>
                <span className="text-[10px] font-medium text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded-full">Beta</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat body - empty state */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl glass-card mb-4">
                <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Ask me anything</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">I can help you find workspaces</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {suggestions.map((s) => (
                  <Link
                    key={s}
                    href="/ai-assistant"
                    className="glass-card rounded-full px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-brand-500/50 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-white/5">
              <Link
                href="/ai-assistant"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 glass-input rounded-xl px-4 py-3 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                <span className="flex-1">Ask about workspaces...</span>
                <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
