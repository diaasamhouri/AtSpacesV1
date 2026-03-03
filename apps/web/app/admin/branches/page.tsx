"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAdminBranches, updateBranchStatus } from "../../../lib/admin";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { formatCity, formatBranchStatus } from "../../../lib/format";
import StatusBadge from "../../components/ui/status-badge";
import { Pagination } from "../../components/pagination";
import { SearchBar } from "../../components/search-bar";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { PaginationMeta, AdminBranch } from "../../../lib/types";

export default function AdminBranchesPage() {
    const router = useRouter();
    const { token } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [branches, setBranches] = useState<AdminBranch[]>([]);
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
            setBranches((prev) => prev.map((b) => (b.id === confirmAction.id ? { ...b, status: confirmAction.status as AdminBranch["status"] } : b)));
        } catch { toast("Failed to update branch.", "error"); }
        setConfirmOpen(false);
        setConfirmAction(null);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branches Overview</h1>

            <SearchBar defaultValue={search} placeholder="Search by branch name or vendor..." />

            {loading ? (
                <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
            ) : branches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-dark-900 p-12 text-center">
                    <p className="text-sm font-medium text-slate-500">No branches found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {branches.map((b) => (
                        <div
                            key={b.id}
                            onClick={() => router.push(`/admin/branches/${b.id}`)}
                            className="rounded-2xl bg-dark-900 border border-slate-200 dark:border-slate-800 p-5 shadow-float hover:border-brand-500/50 cursor-pointer transition-all group"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">{b.name}</h3>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{b.address}</p>
                                </div>
                                <StatusBadge status={b.status} />
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{b.vendor}</span>
                                <span className="rounded-md bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-400">{formatCity(b.city)}</span>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                                <span>{b.servicesCount} services</span>
                                <span>{b.bookingsCount} bookings</span>
                            </div>

                            {/* Quick actions */}
                            <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                                {b.status === "ACTIVE" && (
                                    <button onClick={() => handleStatusClick(b.id, "SUSPENDED")} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Suspend</button>
                                )}
                                {b.status === "SUSPENDED" && (
                                    <button onClick={() => handleStatusClick(b.id, "ACTIVE")} className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Reactivate</button>
                                )}
                                {b.status === "UNDER_REVIEW" && (
                                    <>
                                        <button onClick={() => handleStatusClick(b.id, "ACTIVE")} className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Approve</button>
                                        <button onClick={() => handleStatusClick(b.id, "SUSPENDED")} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Suspend</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {meta && <Pagination meta={meta} />}

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
                onConfirm={handleConfirm}
                title="Update Branch Status"
                message={`Are you sure you want to set this branch to ${formatBranchStatus(confirmAction?.status || "")}?`}
                confirmLabel={confirmAction?.status === "SUSPENDED" ? "Suspend" : confirmAction?.status === "ACTIVE" ? "Approve" : "Confirm"}
                variant={confirmAction?.status === "SUSPENDED" ? "danger" : "default"}
            />
        </div>
    );
}
