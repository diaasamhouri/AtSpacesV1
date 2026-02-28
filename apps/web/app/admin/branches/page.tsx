"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getAdminBranches, updateBranchStatus } from "../../../lib/admin";
import { useAuth } from "../../../lib/auth-context";
import { format } from "date-fns";
import { Pagination } from "../../components/pagination";
import { SearchBar } from "../../components/search-bar";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { PaginationMeta } from "../../../lib/types";

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-green-500/10 text-green-500 border border-green-500/20",
    SUSPENDED: "bg-red-500/10 text-red-500 border border-red-500/20",
    UNDER_REVIEW: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
};

export default function AdminBranchesPage() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const [branches, setBranches] = useState<any[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);

    // Confirm dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ id: string; status: string } | null>(null);

    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";

    const loadBranches = useCallback(() => {
        if (!token) return;
        setLoading(true);
        getAdminBranches(token, { page, search: search || undefined })
            .then((res) => { setBranches(res.data); setMeta(res.meta); setLoading(false); })
            .catch(() => setLoading(false));
    }, [token, page, search]);

    useEffect(() => { loadBranches(); }, [loadBranches]);

    const handleStatusClick = (id: string, status: string) => {
        setConfirmAction({ id, status });
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;
        try {
            await updateBranchStatus(token!, confirmAction.id, confirmAction.status);
            setBranches((prev) => prev.map((b) => (b.id === confirmAction.id ? { ...b, status: confirmAction.status } : b)));
        } catch { alert("Failed to update branch."); }
        setConfirmOpen(false);
        setConfirmAction(null);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Branches Overview</h1>

            <SearchBar defaultValue={search} placeholder="Search by branch name or vendor..." />

            {loading ? (
                <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl bg-dark-900 shadow-sm border border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-800">
                            <thead className="bg-dark-850">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Branch</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Vendor</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">City</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Services</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Bookings</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {branches.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-8 text-center text-sm font-medium text-slate-500">No branches found.</td></tr>
                                ) : branches.map((b) => (
                                    <tr key={b.id} className="hover:bg-dark-850 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-white mb-0.5">{b.name}</div>
                                            <div className="text-xs font-medium text-slate-400 truncate max-w-xs">{b.address}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-white">{b.vendor}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-300">{b.city}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-300">{b.servicesCount}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-300">{b.bookingsCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[b.status]}`}>{b.status.replace("_", " ")}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {b.status === "ACTIVE" && (
                                                <button onClick={() => handleStatusClick(b.id, "SUSPENDED")} className="rounded-lg bg-red-500/10 px-4 py-2 text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Suspend</button>
                                            )}
                                            {b.status === "SUSPENDED" && (
                                                <button onClick={() => handleStatusClick(b.id, "ACTIVE")} className="rounded-lg bg-green-500/10 px-4 py-2 text-xs font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Reactivate</button>
                                            )}
                                            {b.status === "UNDER_REVIEW" && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleStatusClick(b.id, "ACTIVE")} className="rounded-lg bg-green-500/10 px-4 py-2 text-xs font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Approve</button>
                                                    <button onClick={() => handleStatusClick(b.id, "SUSPENDED")} className="rounded-lg bg-red-500/10 px-4 py-2 text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Suspend</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {meta && <Pagination meta={meta} />}

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
                onConfirm={handleConfirm}
                title="Update Branch Status"
                message={`Are you sure you want to set this branch to ${confirmAction?.status?.replace("_", " ")}?`}
                confirmLabel={confirmAction?.status === "SUSPENDED" ? "Suspend" : confirmAction?.status === "ACTIVE" ? "Approve" : "Confirm"}
                variant={confirmAction?.status === "SUSPENDED" ? "danger" : "default"}
            />
        </div>
    );
}
