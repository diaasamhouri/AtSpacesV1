"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getAdminUsers, createTeamUser, toggleUserActive } from "../../../lib/admin";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { format } from "date-fns";
import { formatUserRole } from "../../../lib/format";
import { Pagination } from "../../components/pagination";
import { SearchBar } from "../../components/search-bar";
import type { PaginationMeta, AdminUser } from "../../../lib/types";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  MODERATOR: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  ACCOUNTANT: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
  VENDOR: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
  CUSTOMER: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20",
};

export default function AdminUsersPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MODERATOR" });
  const [createError, setCreateError] = useState("");

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  const loadUsers = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getAdminUsers(token, { page, search: search || undefined })
      .then((res) => { setUsers(res.data); setMeta(res.meta); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token, page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleToggle = async (id: string) => {
    try {
      const updated = await toggleUserActive(token!, id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: updated.isActive } : u)));
    } catch { toast("Failed to update user.", "error"); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return;
    setCreateError("");
    try {
      const newUser = await createTeamUser(token!, form);
      setUsers((prev) => [newUser, ...prev]);
      setShowCreate(false);
      setForm({ name: "", email: "", password: "", role: "MODERATOR" });
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user.");
    }
  };

  const isSuperAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-brand-500 active:scale-95 px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.4)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.6)] hover:-translate-y-0.5 transition-all duration-300"
          >
            + Create Team User
          </button>
        )}
      </div>

      <SearchBar defaultValue={search} placeholder="Search by name or email..." />

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-dark-900 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-50 dark:bg-dark-850">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name & Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  {isSuperAdmin && <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-500">No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-dark-850 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{u.name || "Anonymous"}</div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{u.email || u.phone || "\u2014"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wider ${ROLE_COLORS[u.role]}`}>{formatUserRole(u.role)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${u.isActive ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-right text-sm">
                        {u.role !== "ADMIN" && (
                          <button
                            onClick={() => handleToggle(u.id)}
                            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${u.isActive ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 hover:bg-slate-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"}`}
                          >
                            {u.isActive ? "Disable" : "Enable"}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta && <Pagination meta={meta} />}

      {/* Create Team User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-dark-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800 shadow-black/50" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Team User</h3>

            {createError && (
              <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-500 border border-red-500/20">{createError}</div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Full Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-dark-850 focus:bg-slate-100 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-dark-850 focus:bg-slate-100 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-dark-850 focus:bg-slate-100 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-dark-850 focus:bg-slate-100 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors">
                  <option value="MODERATOR">Moderator</option>
                  <option value="ACCOUNTANT">Accountant</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button onClick={() => setShowCreate(false)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-dark-850 hover:bg-gray-100 dark:hover:bg-dark-800 hover:border-slate-600 transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!form.name || !form.email || !form.password}
                className="rounded-xl px-6 py-3 text-sm font-bold text-white bg-brand-500 active:scale-95 hover:bg-brand-600 transition-colors shadow-[0_4px_12px_rgba(255,91,4,0.4)] disabled:opacity-50 disabled:shadow-none">Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
