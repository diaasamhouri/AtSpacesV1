"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { formatVendorStatus } from "../../lib/format";

interface VendorProfile {
  id: string;
  companyName: string;
  status: string;
}

interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  image: string | null;
  role: "ADMIN" | "VENDOR" | "CUSTOMER";
  isActive: boolean;
  createdAt: string;
  vendorProfile: VendorProfile | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  VENDOR: "Vendor",
  CUSTOMER: "Customer",
};

const VENDOR_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-dark-800 text-slate-500 dark:text-slate-400",
  PENDING_APPROVAL: "bg-yellow-500/10 text-yellow-500",
  APPROVED: "bg-green-500/10 text-green-500",
  REJECTED: "bg-red-500/10 text-red-500",
  SUSPENDED: "bg-red-500/10 text-red-500",
};

export default function ProfilePage() {
  const { user, token, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL_UPLOAD = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(`${API_BASE_URL_UPLOAD}/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: imageUrl }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setProfile(updated);
      setSuccess("Profile picture updated!");
    } catch {
      setError("Failed to upload picture");
    } finally {
      setUploading(false);
    }
  }

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setName(data.name || "");
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.push("/auth/login?redirect=/profile");
      return;
    }

    fetchProfile();
  }, [user, token, authLoading, router, fetchProfile]);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updated = await res.json();
      setProfile(updated);
      setEditing(false);
      setSuccess("Profile updated successfully!");
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-dark-950 min-h-screen pt-24 pb-8 flex items-center justify-center">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Profile not found
          </h1>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 rounded-xl bg-brand-500 active:scale-95 px-6 py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.4)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.6)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          My Profile
        </h1>

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-medium text-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-sm font-medium text-green-500">
            {success}
          </div>
        )}

        {/* Profile card */}
        <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 p-8 shadow-float">
          {/* Avatar & name */}
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer group">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              {profile.image ? (
                <img src={profile.image} alt="Avatar" className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-800" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-dark-800 border border-slate-200 dark:border-slate-700 text-3xl font-bold text-brand-500">
                  {profile.name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              {/* Camera badge — always visible */}
              <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg border-2 border-dark-900">
                {uploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                  </svg>
                )}
              </div>
            </label>
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {profile.name || "No name set"}
                </h2>
              )}
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {[profile.email, profile.phone].filter(Boolean).join(" · ") || "No contact info"}
              </p>
            </div>
          </div>

          {/* Role badge */}
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex rounded-full bg-brand-500/10 px-3 py-1.5 text-xs font-bold tracking-wide text-brand-500 uppercase">
              {ROLE_LABELS[profile.role] || profile.role}
            </span>
            {profile.vendorProfile && (
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold tracking-wide uppercase ${VENDOR_STATUS_COLORS[profile.vendorProfile.status] || "bg-dark-800 text-slate-500 dark:text-slate-400"
                  }`}
              >
                {formatVendorStatus(profile.vendorProfile.status)}
              </span>
            )}
          </div>

          {/* Edit / Save buttons */}
          <div className="mt-6 flex gap-3">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setName(profile.name || "");
                  }}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="flex-1 rounded-xl bg-brand-500 active:scale-95 px-4 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Vendor info */}
        {profile.vendorProfile && (
          <div className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 p-8 shadow-float">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Vendor Details
            </h3>
            <div className="mt-6 space-y-4 text-sm bg-slate-50 dark:bg-dark-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Company</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {profile.vendorProfile.companyName}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status</span>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${VENDOR_STATUS_COLORS[profile.vendorProfile.status]
                    }`}
                >
                  {formatVendorStatus(profile.vendorProfile.status)}
                </span>
              </div>
            </div>
            {user?.role === 'VENDOR' && (
              <button
                type="button"
                onClick={() => router.push("/vendor")}
                className="mt-6 w-full rounded-xl bg-brand-500 px-4 py-4 text-sm font-bold text-white hover:bg-brand-600 transition-colors shadow-sm"
              >
                Go to Vendor Dashboard
              </button>
            )}
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="mt-6 w-full rounded-xl bg-purple-500 px-4 py-4 text-sm font-bold text-white hover:bg-purple-600 transition-colors shadow-sm"
              >
                Go to Admin Dashboard
              </button>
            )}
          </div>
        )}

        {/* Account info */}
        <div className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 p-8 shadow-float">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Account Facts
          </h3>
          <div className="mt-6 space-y-4 text-sm bg-slate-50 dark:bg-dark-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Role</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {ROLE_LABELS[profile.role] || profile.role}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Member since</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {profile.email && (
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Email</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {profile.email}
                </span>
              </div>
            )}
            {profile.phone && (
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Phone</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {profile.phone}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={() => router.push("/bookings")}
            className="group flex w-full items-center justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 p-6 text-left transition-all hover:border-brand-500/50 hover:shadow-[0_10px_40px_rgba(255,91,4,0.1)] hover:-translate-y-1"
          >
            <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
              My Historic Bookings
            </span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dark-800 group-hover:bg-brand-500/10 transition-colors">
              <svg
                className="h-5 w-5 text-slate-500 group-hover:text-brand-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>

          {profile.role === "CUSTOMER" && !profile.vendorProfile && (
            <button
              type="button"
              onClick={() => router.push("/become-vendor")}
              className="group flex w-full items-center justify-between rounded-3xl border border-brand-500/30 bg-brand-500/10 p-6 text-left transition-all hover:bg-brand-500/20 hover:shadow-[0_10px_40px_rgba(255,91,4,0.15)] hover:-translate-y-1"
            >
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                  Become a Vendor
                </p>
                <p className="mt-2 text-sm text-brand-500/70 font-medium">
                  List your spaces and start earning
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/20 group-hover:bg-brand-500/30 transition-colors">
                <svg
                  className="h-5 w-5 text-brand-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}