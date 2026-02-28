"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getAdminBookings, updateBookingStatus } from "../../../lib/admin";
import { useAuth } from "../../../lib/auth-context";
import { format } from "date-fns";
import StatusBadge from "../../components/ui/status-badge";
import { Pagination } from "../../components/pagination";
import { SearchBar } from "../../components/search-bar";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { PaginationMeta } from "../../../lib/types";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];

export default function AdminBookingsPage() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const [bookings, setBookings] = useState<any[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ id: string; status: string } | null>(null);

    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";

    const loadBookings = useCallback(() => {
        if (!token) return;
        setLoading(true);
        getAdminBookings(token, {
            page,
            search: search || undefined,
            status: filter === "ALL" ? undefined : filter,
        })
            .then((res) => { setBookings(res.data); setMeta(res.meta); setLoading(false); })
            .catch(() => setLoading(false));
    }, [token, page, search, filter]);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    const handleStatusClick = (id: string, status: string) => {
        setConfirmAction({ id, status });
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;
        try {
            await updateBookingStatus(token!, confirmAction.id, confirmAction.status);
            setBookings((prev) => prev.map((b) => (b.id === confirmAction.id ? { ...b, status: confirmAction.status } : b)));
        } catch { alert("Failed to update booking."); }
        setConfirmOpen(false);
        setConfirmAction(null);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Bookings Management</h1>

            <SearchBar defaultValue={search} placeholder="Search by customer or branch name..." />

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`relative rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ${filter === s ? "bg-brand-500 text-white shadow-[0_2px_8px_rgba(255,91,4,0.4)]" : "bg-dark-850 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500"}`}>
                        {s.replace("_", " ")}
                        {filter === s && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-white/60" />}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl bg-dark-900 shadow-float border border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-800">
                            <thead className="bg-dark-850">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Space</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {bookings.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-slate-500">No bookings found.</td></tr>
                                ) : bookings.map((b) => (
                                    <tr key={b.id} className="even:bg-dark-850/30 hover:bg-dark-850/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-white mb-0.5">{b.customer?.name || "\u2014"}</div>
                                            <div className="text-xs font-medium text-slate-400">{b.customer?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-white mb-0.5">{b.branch?.vendor} <span className="text-slate-500 mx-1">{"\u2014"}</span> {b.branch?.name}</div>
                                            <div className="text-xs font-medium text-slate-400">{b.service?.name} ({b.service?.type})</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-white mb-0.5">{format(new Date(b.startTime), "MMM d, yyyy")}</div>
                                            <div className="text-xs font-medium text-slate-400">{format(new Date(b.startTime), "h:mm a")} {"\u2014"} {format(new Date(b.endTime), "h:mm a")}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-400">JOD {b.totalPrice.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={(e) => e.stopPropagation()}>
                                            {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                                                <button onClick={() => handleStatusClick(b.id, "CANCELLED")} className="rounded-lg bg-red-500/10 px-4 py-2 text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors mr-2">Cancel</button>
                                            )}
                                            {b.status === "CONFIRMED" && (
                                                <button onClick={() => handleStatusClick(b.id, "NO_SHOW")} className="rounded-lg bg-slate-500/10 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-colors">No-Show</button>
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
                title="Update Booking Status"
                message={`Are you sure you want to mark this booking as ${confirmAction?.status?.replace("_", " ")}?`}
                confirmLabel={confirmAction?.status === "CANCELLED" ? "Cancel Booking" : "Mark No-Show"}
                variant="danger"
            />
        </div>
    );
}
