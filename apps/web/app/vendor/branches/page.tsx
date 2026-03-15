"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVendorBranches, deleteBranch } from "../../../lib/vendor";
import { useAuth } from "../../../lib/auth-context";
import { formatServiceType } from "../../../lib/format";
import { SERVICE_TYPE_OPTIONS } from "../../../lib/types";
import StatusBadge from "../../components/ui/status-badge";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { useToast } from "../../components/ui/toast-provider";

export default function VendorBranches() {
    const { token } = useAuth();
    const { toast } = useToast();
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [unitTypeFilter, setUnitTypeFilter] = useState("");
    const [suspendTarget, setSuspendTarget] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const loadBranches = () => {
        if (!token) return;
        setLoading(true);
        getVendorBranches(token, { unitType: unitTypeFilter || undefined })
            .then((res) => { setBranches(res.data); setLoading(false); })
            .catch(() => { setError("Failed to load branches."); setLoading(false); });
    };

    useEffect(() => { loadBranches(); }, [token, unitTypeFilter]);

    const handleSuspendConfirm = async () => {
        if (!suspendTarget || !token) return;
        try {
            await deleteBranch(token, suspendTarget);
            toast("Branch suspension requested. Pending admin approval.", "success");
            loadBranches();
        } catch {
            toast("Failed to request branch suspension.", "error");
        }
        setSuspendTarget(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget || !token) return;
        try {
            await deleteBranch(token, deleteTarget);
            toast("Branch deleted permanently.", "success");
            loadBranches();
        } catch {
            toast("Failed to delete branch.", "error");
        }
        setDeleteTarget(null);
    };

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-medium text-red-400 mb-6">
                    {error}
                </div>
            )}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branches & Units</h1>
                <div className="flex items-center gap-3">
                    <select
                        value={unitTypeFilter}
                        onChange={(e) => setUnitTypeFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                    >
                        <option value="">All Unit Types</option>
                        {SERVICE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <Link href="/vendor/branches/new" className="rounded-xl bg-brand-500 active:scale-95 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(255,91,4,0.3)] transition-all">
                        Add New Branch
                    </Link>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white dark:bg-dark-900 shadow-float border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-dark-850">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Branch Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">City / Address</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Units</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {branches.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-500">
                                        You haven't added any branches yet. Click "Add New Branch" to get started.
                                    </td>
                                </tr>
                            ) : (
                                branches.map((branch) => (
                                    <tr key={branch.id} className="even:bg-slate-50/30 dark:even:bg-dark-850/30 hover:bg-gray-50 dark:hover:bg-dark-850/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{branch.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-0.5">{branch.city}</div>
                                            <div className="text-xs text-slate-500">{branch.address}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {branch.services?.length > 0 ? (
                                                    branch.services.map((s: any) => (
                                                        <span key={s.id} className="inline-flex items-center gap-1 rounded-md tracking-wider bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 text-[10px] font-bold text-brand-400">
                                                            {s.name}{s.unitNumber ? ` (${s.unitNumber})` : ""} — {formatServiceType(s.type)}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs font-medium text-slate-500">No units</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={branch.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link href={`/vendor/branches/${branch.id}`} className="text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors">
                                                    Manage
                                                </Link>
                                                {branch.status === "SUSPENDED" ? (
                                                    <button
                                                        onClick={() => setDeleteTarget(branch.id)}
                                                        className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setSuspendTarget(branch.id)}
                                                        className="text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
                                                    >
                                                        Suspend
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!suspendTarget}
                onClose={() => setSuspendTarget(null)}
                onConfirm={handleSuspendConfirm}
                title="Suspend Branch"
                message="This will request a suspension of this branch. An admin will review the request. All active bookings under this branch will remain unaffected until approved."
                confirmLabel="Request Suspension"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Branch Permanently"
                message="This will permanently delete this suspended branch and all its services. This action cannot be undone."
                confirmLabel="Delete Permanently"
                variant="danger"
            />
        </div>
    );
}
