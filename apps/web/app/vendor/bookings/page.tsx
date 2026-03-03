"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getVendorBookings, updateBookingStatus } from "../../../lib/vendor";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { BookingStatus, VendorBooking } from "../../../lib/types";
import { format } from "date-fns";
import { formatBookingStatus, formatPaymentStatus } from "../../../lib/format";
import StatusBadge from "../../components/ui/status-badge";
import { Pagination } from "../../components/pagination";
import { SearchBar } from "../../components/search-bar";
import type { PaginationMeta } from "../../../lib/types";

const STATUSES = [
    { value: "", label: "All" },
    { value: "PENDING_APPROVAL", label: "Needs Approval" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "CHECKED_IN", label: "Checked In" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "REJECTED", label: "Rejected" },
    { value: "NO_SHOW", label: "No Show" },
];

export default function VendorBookings() {
    const { token } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [bookings, setBookings] = useState<VendorBooking[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";

    const loadBookings = useCallback(() => {
        if (!token) return;
        setLoading(true);
        getVendorBookings(token, { page, search: search || undefined, status: filter || undefined })
            .then((res: any) => {
                setBookings(res.data);
                setMeta(res.meta);
                setLoading(false);
            })
            .catch((err: any) => {
                console.error(err);
                setLoading(false);
            });
    }, [token, page, search, filter]);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
        if (!token) return;
        try {
            await updateBookingStatus(token, id, newStatus);
            setBookings((prev) =>
                prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
            );
        } catch {
            toast("Failed to update status.", "error");
        }
    };

    const STATUS_BG: Record<string, string> = {
        CONFIRMED: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        CHECKED_IN: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        COMPLETED: "bg-green-500/10 text-green-500 border border-green-500/20",
        CANCELLED: "bg-red-500/10 text-red-500 border border-red-500/20",
        REJECTED: "bg-red-500/10 text-red-500 border border-red-500/20",
        NO_SHOW: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20",
        PENDING: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
        PENDING_APPROVAL: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
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
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Customer Bookings</h1>
            </div>

            <SearchBar defaultValue={search} placeholder="Search by customer name..." />

            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => setFilter(s.value)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${filter === s.value
                            ? "bg-brand-500 text-white shadow-sm"
                            : "bg-dark-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Mobile card view */}
            <div className="space-y-4 md:hidden">
                {bookings.length === 0 ? (
                    <div className="rounded-2xl bg-dark-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm font-medium text-slate-500">No bookings found.</div>
                ) : bookings.map((booking) => (
                    <div key={booking.id} className="rounded-2xl bg-dark-900 border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">{booking.customer?.name || "Anonymous"}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{booking.customer?.phone || "-"}</div>
                            </div>
                            <span className="text-sm font-bold text-brand-400">{booking.totalPrice.toFixed(2)} {booking.currency}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">{booking.service.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            {booking.branch.name} &middot; {format(new Date(booking.startTime), "MMM d, yyyy")} &middot; {format(new Date(booking.startTime), "h:mm a")}
                        </div>
                        <div className="flex items-center justify-between">
                            {booking.status === "PENDING_APPROVAL" ? (
                                <div className="flex items-center gap-2">
                                    <StatusBadge status="PENDING_APPROVAL" label="Needs Approval" />
                                    <button onClick={() => handleStatusChange(booking.id, "CONFIRMED" as any)} className="text-xs bg-brand-500 active:scale-95 text-white px-3 py-1.5 rounded-md hover:bg-brand-600 transition-colors shadow">Approve</button>
                                    <button onClick={() => handleStatusChange(booking.id, "REJECTED" as any)} className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-md hover:bg-red-500/20 transition-colors">Reject</button>
                                </div>
                            ) : (
                                <StatusBadge status={booking.status} />
                            )}
                            <div className="text-xs text-slate-500">{formatPaymentStatus(booking.payment?.status || "UNPAID")}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-hidden rounded-2xl bg-dark-900 shadow-float border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-dark-850">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date & Time</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Service</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-500">
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="even:bg-dark-850/30 hover:bg-gray-50 dark:hover:bg-dark-850/60 transition-colors">
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                                                {format(new Date(booking.startTime), "MMM d, yyyy")}
                                            </div>
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{booking.customer?.name || "Anonymous"}</div>
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{booking.customer?.phone || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{booking.service.name}</div>
                                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{booking.branch.name}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            {booking.status === "PENDING_APPROVAL" ? (
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status="PENDING_APPROVAL" label="Needs Approval" />
                                                    <button onClick={() => handleStatusChange(booking.id, "CONFIRMED" as any)} className="text-xs bg-brand-500 active:scale-95 text-white px-2 py-1 rounded-md hover:bg-brand-600 transition-colors shadow">Approve</button>
                                                    <button onClick={() => handleStatusChange(booking.id, "REJECTED" as any)} className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-md hover:bg-red-500/20 transition-colors">Reject</button>
                                                </div>
                                            ) : (
                                                <select
                                                    className={`text-xs font-bold rounded-full px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-500 ${STATUS_BG[booking.status]}`}
                                                    value={booking.status}
                                                    onChange={(e) => handleStatusChange(booking.id, e.target.value as BookingStatus)}
                                                    disabled={booking.status === "CANCELLED" || booking.status === "COMPLETED" || booking.status === "REJECTED"}
                                                    style={{ appearance: "none", backgroundImage: "none", textAlign: "center", cursor: "pointer" }}
                                                >
                                                    <option value="PENDING">{formatBookingStatus("PENDING")}</option>
                                                    <option value="CONFIRMED">{formatBookingStatus("CONFIRMED")}</option>
                                                    <option value="CHECKED_IN">{formatBookingStatus("CHECKED_IN")}</option>
                                                    <option value="COMPLETED">{formatBookingStatus("COMPLETED")}</option>
                                                    <option value="NO_SHOW">{formatBookingStatus("NO_SHOW")}</option>
                                                    <option value="CANCELLED">{formatBookingStatus("CANCELLED")}</option>
                                                    <option value="REJECTED">{formatBookingStatus("REJECTED")}</option>
                                                </select>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right">
                                            <div className="text-sm font-bold text-brand-400 mb-0.5">
                                                {booking.totalPrice.toFixed(2)} {booking.currency}
                                            </div>
                                            <div className="text-xs font-medium text-slate-500">
                                                {formatPaymentStatus(booking.payment?.status || "UNPAID")}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {meta && <Pagination meta={meta} />}
        </div>
    );
}
