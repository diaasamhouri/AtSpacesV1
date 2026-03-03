"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, Suspense } from "react";
import { apiFetch } from "../../../lib/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: { email, code, newPassword },
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 mx-auto">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Password Reset!</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Link
            href="/auth/login"
            className="inline-block w-full rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-600 shadow-[0_4px_12px_rgba(255,91,4,0.3)] transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Enter the 6-digit code sent to your email and your new password.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-medium text-red-500 text-center">
            {error}
          </div>
        )}

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
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-900 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              6-digit code
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={6}
              pattern="[0-9]{6}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-900 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500 tracking-[0.5em] text-center text-lg font-bold"
              placeholder="000000"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-900 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-900 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500"
              placeholder="Re-enter password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-brand-500 active:scale-95 px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-600 shadow-[0_4px_12px_rgba(255,91,4,0.3)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            <Link href="/auth/forgot-password" className="font-bold text-brand-500 hover:text-brand-400 transition-colors">
              Request a new code
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
