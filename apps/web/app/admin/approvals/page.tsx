"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getAdminApprovals, processApproval } from "../../../lib/admin";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { format } from "date-fns";
import StatusBadge from "../../components/ui/status-badge";
import { Pagination } from "../../components/pagination";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { PaginationMeta, AdminApproval } from "../../../lib/types";

const TYPE_LABELS: Record<string, string> = {
    VENDOR_REGISTRATION: "Vendor Registration",
    CAPACITY_CHANGE: "Capacity Change",
    BRANCH_SUSPENSION: "Branch Suspension",
};

const TYPE_ACCENT: Record<string, string> = {
    VENDOR_REGISTRATION: "border-l-blue-500",
    CAPACITY_CHANGE: "border-l-yellow-500",
    BRANCH_SUSPENSION: "border-l-red-500",
};

export default function AdminApprovalsPage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [requests, setRequests] = useState<AdminApproval[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [reason, setReason] = useState("");

    // Confirm dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [approveTarget, setApproveTarget] = useState<string | null>(null);

    const page = Number(searchParams.get("page")) || 1;

    const loadApprovals = useCallback(() => {
        if (!token) return;
        setLoading(true);
        getAdminApprovals(token, { page })
            .then((res) => { setRequests(res.data); setMeta(res.meta); setLoading(false); })
            .catch(() => setLoading(false));
    }, [token, page]);

    useEffect(() => { loadApprovals(); }, [loadApprovals]);

    const handleApproveClick = (id: string) => {
        setApproveTarget(id);
        setConfirmOpen(true);
    };

    const handleApproveConfirm = async () => {
        if (!approveTarget) return;
        try {
            await processApproval(token!, approveTarget, "APPROVED");
            setRequests((prev) => prev.map((r) => (r.id === approveTarget ? { ...r, status: "APPROVED" } : r)));
        } catch { toast("Failed to approve.", "error"); }
        setConfirmOpen(false);
        setApproveTarget(null);
    };

    const confirmReject = async () => {
        if (!rejectId || !reason.trim()) return;
        try {
            await processApproval(token!, rejectId, "REJECTED", reason.trim());
            setRequests((prev) => prev.map((r) => (r.id === rejectId ? { ...r, status: "REJECTED", reason: reason.trim() } : r)));
            setRejectId(null);
            setReason("");
        } catch { toast("Failed to reject.", "error"); }
    };

    const pending = requests.filter((r) => r.status === "PENDING");
    const processed = requests.filter((r) => r.status !== "PENDING");

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Approval Queue</h1>

            {loading ? (
                <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
            ) : (
                <>
                    {/* Pending */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Pending ({pending.length})</h2>
                        {pending.length === 0 ? (
                            <div className="rounded-2xl bg-green-500/10 p-5 text-sm font-medium text-green-500 text-center border border-green-500/20">
                                No pending approval requests. All caught up!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pending.map((r) => (
                                    <div key={r.id} className={`rounded-2xl bg-dark-900 p-6 border border-slate-200 dark:border-slate-800 shadow-float border-l-4 ${TYPE_ACCENT[r.type] || "border-l-slate-500"}`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <StatusBadge status={r.type} label={TYPE_LABELS[r.type] || r.type} />
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-3">{r.branch} <span className="text-slate-500 mx-1">&mdash;</span> {r.vendor}</h3>
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{r.description}</p>
                                                <p className="text-xs font-medium text-slate-500 mt-3">{format(new Date(r.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                                            </div>
                                            <div className="flex flex-col gap-2 shrink-0 ml-6">
                                                <button onClick={() => handleApproveClick(r.id)} className="rounded-xl bg-green-500/10 px-6 py-2.5 text-xs font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Approve</button>
                                                <button onClick={() => { setRejectId(r.id); setReason(""); }} className="rounded-xl bg-red-500/10 px-6 py-2.5 text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Reject</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Processed */}
                    {processed.length > 0 && (
                        <div className="pt-8">
                            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">History ({processed.length})</h2>
                            <div className="overflow-hidden rounded-2xl bg-dark-900 shadow-float border border-slate-200 dark:border-slate-800">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-800">
                                        <thead className="bg-dark-850">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Branch / Vendor</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {processed.map((r) => (
                                                <tr key={r.id} className="even:bg-dark-850/30 hover:bg-gray-50 dark:hover:bg-dark-850/60 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{TYPE_LABELS[r.type] || r.type}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">{r.branch} <span className="text-slate-500 mx-1">&mdash;</span> {r.vendor}</td>
                                                    <td className="px-6 py-4">
                                                        <StatusBadge status={r.status} />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">{format(new Date(r.createdAt), "MMM d, yyyy")}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {meta && <Pagination meta={meta} />}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setApproveTarget(null); }}
                onConfirm={handleApproveConfirm}
                title="Approve Request"
                message="Are you sure you want to approve this request?"
                confirmLabel="Approve"
                variant="default"
            />

            {/* Reject Modal */}
            {rejectId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRejectId(null)}>
                    <div className="w-full max-w-md rounded-3xl bg-dark-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reject Request</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">Please provide a reason for rejecting this request.</p>
                        <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus
                            className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white bg-dark-850 focus:bg-dark-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none mb-2" />
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={() => setRejectId(null)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white bg-dark-850 hover:bg-gray-100 dark:hover:bg-dark-800 hover:border-slate-600 transition-colors">Cancel</button>
                            <button onClick={confirmReject} disabled={!reason.trim()} className="rounded-xl px-6 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
