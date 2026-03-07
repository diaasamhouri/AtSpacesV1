"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  redirectTo?: string;
}

export function AuthDialog({
  isOpen,
  onClose,
  title = "Sign in to continue",
  subtitle = "You need an account to complete this action.",
  redirectTo = "/",
}: AuthDialogProps) {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Invalid credentials");
      }

      const data = await res.json();
      await login(data.accessToken);
      onClose();
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white dark:bg-dark-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 border border-slate-200 dark:border-slate-700/50"
            role="dialog"
            aria-modal="true"
          >
            {/* Header pattern */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-dark-850 dark:to-dark-900 border-b border-slate-200 dark:border-slate-800" />

            <button
              onClick={onClose}
              className="absolute right-6 top-6 z-10 p-2 rounded-full bg-slate-200/50 dark:bg-dark-800/50 hover:bg-gray-100 dark:hover:bg-dark-800 text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors backdrop-blur-md"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>

            <div className="relative px-8 pt-12 pb-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-slate-600 dark:text-slate-300"
                  >
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 py-3 px-4 text-gray-900 dark:text-white shadow-sm ring-0 placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium leading-6 text-slate-600 dark:text-slate-300"
                    >
                      Password
                    </label>
                  </div>
                  <div className="mt-2">
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 py-3 px-4 text-gray-900 dark:text-white shadow-sm ring-0 placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-8 flex w-full justify-center rounded-full bg-brand-500 active:scale-95 px-3 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 hover:-translate-y-0.5  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in to continue"}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="font-semibold text-brand-500 hover:text-brand-400"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
