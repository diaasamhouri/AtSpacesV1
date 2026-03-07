"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Workspace Administration
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Secure entry point for AtSpaces staff
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-500/100/10 p-4 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-t-md border-0 bg-white dark:bg-dark-850 py-3 text-gray-900 dark:text-white ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-500 sm:text-sm sm:leading-6"
                placeholder="Admin Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full rounded-b-md border-0 bg-white dark:bg-dark-850 py-3 text-gray-900 dark:text-white ring-1 ring-inset ring-slate-200 dark:ring-slate-700 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-brand-500 sm:text-sm sm:leading-6"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-brand-500 active:scale-95 px-3 py-3 text-sm font-semibold text-white hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign in to Dashboard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
