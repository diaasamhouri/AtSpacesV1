"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { apiFetch } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Forgot password?
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {submitted
              ? "Check your email for the reset code."
              : "Enter your email and we'll send you a reset code."}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-medium text-red-500 text-center">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="space-y-6">
            <div className="rounded-2xl bg-brand-500/10 border border-brand-500/20 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/20 mx-auto mb-4">
                <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                If an account with <strong>{email}</strong> exists, a 6-digit reset code has been sent.
              </p>
            </div>
            <Link
              href={`/auth/reset-password?email=${encodeURIComponent(email)}`}
              className="block w-full text-center rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-600 shadow-[0_4px_12px_rgba(255,91,4,0.3)] transition-all"
            >
              Enter Reset Code
            </Link>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              <Link href="/auth/login" className="font-bold text-brand-500 hover:text-brand-400 transition-colors">
                Back to Sign in
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-brand-500 active:scale-95 px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-600 shadow-[0_4px_12px_rgba(255,91,4,0.3)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Remember your password?{" "}
              <Link href="/auth/login" className="font-bold text-brand-500 hover:text-brand-400 transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
