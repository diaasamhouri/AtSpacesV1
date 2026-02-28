"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getVendorBookings, updateBookingStatus } from "../../../lib/vendor";
import { useAuth } from "../../../lib/auth-context";
import { BookingStatus, VendorBooking } from "../../../lib/types";
import { format } from "date-fns";
import StatusBadge from "../../components/ui/status-badge";
import { Pagination } from "../../components/pagination";
import { SearchBar } from "../../components/search-bar";
import type { PaginationMeta } from "../../../lib/types";

export default function VendorBookings() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const [bookings, setBookings] = useState<VendorBooking[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);

    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";

    const loadBookings = useCallback(() => {
        if (!token) return;
        setLoading(true);
        getVendorBookings(token, { page, search: search || undefined })
            .then((res: any) => {
                setBookings(res.data);
                setMeta(res.meta);
                setLoading(false);
            })
            .catch((err: any) => {
                console.error(err);
                setLoading(false);
            });
    }, [token, page, search]);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
        if (!token) return;
        try {
            await updateBookingStatus(token, id, newStatus);
            setBookings((prev) =>
                prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
            );
        } catch (err: any) {
            alert("Failed to update status.");
        }
    };

    const STATUS_BG: Record<string, string> = {
        CONFIRMED: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        CHECKED_IN: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        COMPLETED: "bg-green-500/10 text-green-500 border border-green-500/20",
        CANCELLED: "bg-red-500/10 text-red-500 border border-red-500/20",
        REJECTED: "bg-red-500/10 text-red-500 border border-red-500/20",
        NO_SHOW: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
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
                <h1 className="text-3xl font-bold text-white">Customer Bookings</h1>
            </div>

            <SearchBar defaultValue={search} placeholder="Search by customer name..." />

            <div className="overflow-hidden rounded-2xl bg-dark-900 shadow-float border border-slate-800">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-dark-850">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Date & Time</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Service</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Revenue</th>
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
                                    <tr key={booking.id} className="even:bg-dark-850/30 hover:bg-dark-850/60 transition-colors">
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="text-sm font-bold text-white mb-0.5">
                                                {format(new Date(booking.startTime), "MMM d, yyyy")}
                                            </div>
                                            <div className="text-xs font-medium text-slate-400">
                                                {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-white mb-0.5">{booking.customer?.name || "Anonymous"}</div>
                                            <div className="text-xs font-medium text-slate-400">{booking.customer?.phone || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-white mb-0.5">{booking.service.name}</div>
                                            <div className="text-xs font-medium text-slate-400">{booking.branch.name}</div>
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
                                                    <option value="PENDING">PENDING</option>
                                                    <option value="CONFIRMED">CONFIRMED</option>
                                                    <option value="CHECKED_IN">CHECKED_IN</option>
                                                    <option value="COMPLETED">COMPLETED</option>
                                                    <option value="NO_SHOW">NO_SHOW</option>
                                                    <option value="CANCELLED">CANCELLED</option>
                                                    <option value="REJECTED">REJECTED</option>
                                                </select>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right">
                                            <div className="text-sm font-bold text-brand-400 mb-0.5">
                                                {booking.totalPrice.toFixed(2)} {booking.currency}
                                            </div>
                                            <div className="text-xs font-medium text-slate-500">
                                                {booking.payment?.status || "UNPAID"}
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
