"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getAdminPayments, refundPayment, exportRevenueCSV } from "../../../lib/admin";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { format } from "date-fns";
import StatusBadge from "../../components/ui/status-badge";
import { Pagination } from "../../components/pagination";
import { SearchBar } from "../../components/search-bar";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { PaginationMeta, AdminPayment } from "../../../lib/types";

const STATUSES = ["ALL", "PENDING", "COMPLETED", "FAILED", "REFUNDED"];

export default function AdminPaymentsPage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [payments, setPayments] = useState<AdminPayment[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [filter, setFilter] = useState("ALL");

    // Confirm dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [refundTarget, setRefundTarget] = useState<string | null>(null);

    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";

    const loadPayments = useCallback(() => {
        if (!token) return;
        setLoading(true);
        getAdminPayments(token, {
            page,
            search: search || undefined,
            status: filter === "ALL" ? undefined : filter,
        })
            .then((res) => { setPayments(res.data); setMeta(res.meta); setLoading(false); })
            .catch(() => setLoading(false));
    }, [token, page, search, filter]);

    useEffect(() => { loadPayments(); }, [loadPayments]);

    const handleRefundClick = (id: string) => {
        setRefundTarget(id);
        setConfirmOpen(true);
    };

    const handleRefundConfirm = async () => {
        if (!refundTarget) return;
        try {
            await refundPayment(token!, refundTarget);
            setPayments((prev) => prev.map((p) => (p.id === refundTarget ? { ...p, status: "REFUNDED" } : p)));
        } catch { toast("Failed to refund payment.", "error"); }
        setConfirmOpen(false);
        setRefundTarget(null);
    };

    const handleExport = async () => {
        if (!token) return;
        setExporting(true);
        try {
            const csvData = await exportRevenueCSV(token);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `atspaces_revenue_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch {
            toast('Failed to export CSV data', "error");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments Management</h1>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="rounded-xl bg-brand-500 active:scale-95 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                    {exporting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                    )}
                    Export Revenue CSV
                </button>
            </div>

            <SearchBar defaultValue={search} placeholder="Search by customer name..." />

            <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ${filter === s ? "bg-brand-500 text-white shadow-[0_2px_8px_rgba(255,91,4,0.4)]" : "bg-slate-100 dark:bg-dark-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-gray-900 dark:hover:text-white hover:border-slate-500"}`}>
                        {s}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl bg-white dark:bg-dark-900 shadow-float border border-slate-200 dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-dark-850">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vendor / Branch</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Commission</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vendor Payout</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Method</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {payments.length === 0 ? (
                                    <tr><td colSpan={9} className="px-6 py-8 text-center text-sm font-medium text-slate-500">No payments found.</td></tr>
                                ) : payments.map((p) => (
                                    <tr key={p.id} className="even:bg-dark-850/30 hover:bg-gray-50 dark:hover:bg-dark-850/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{p.booking?.customer?.name || "\u2014"}</div>
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{p.booking?.customer?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{p.booking?.vendor}</div>
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{p.booking?.branch}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">JOD {p.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-500">JOD {p.commissionAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-500">JOD {p.vendorEarnings.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">{p.method}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">
                                            {p.paidAt ? format(new Date(p.paidAt), "MMM d, yyyy") : format(new Date(p.createdAt), "MMM d, yyyy")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {p.status === "COMPLETED" && (
                                                <button onClick={() => handleRefundClick(p.id)} className="rounded-lg bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors">Refund</button>
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
                onClose={() => { setConfirmOpen(false); setRefundTarget(null); }}
                onConfirm={handleRefundConfirm}
                title="Refund Payment"
                message="Are you sure you want to refund this payment? This action cannot be undone."
                confirmLabel="Refund"
                variant="danger"
            />
        </div>
    );
}
