"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getVendorBookings, updateBookingStatus, collectVendorPayment, bulkCollectVendorPayments, getVendorPaymentLogs } from "../../../lib/vendor";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { BookingStatus, VendorBooking, PaymentLogEntry } from "../../../lib/types";
import { format } from "date-fns";
import { formatBookingStatus, formatPaymentStatus, formatPricingInterval, formatPricingMode, formatSetupType } from "../../../lib/format";
import StatusBadge from "../../components/ui/status-badge";
import { Pagination } from "../../components/pagination";
import { SearchBar } from "../../components/search-bar";
import { CollectPaymentDialog } from "../../components/collect-payment-dialog";
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

function isCashPending(b: VendorBooking) {
    if (b.status === "NO_SHOW" || b.status === "CANCELLED" || b.status === "REJECTED" || b.status === "EXPIRED") return false;
    return b.payment?.method === "CASH" && b.payment?.status === "PENDING";
}

export default function VendorBookings() {
    const { token } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [bookings, setBookings] = useState<VendorBooking[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    // Collect dialog state
    const [collectDialogOpen, setCollectDialogOpen] = useState(false);
    const [collectTarget, setCollectTarget] = useState<VendorBooking | null>(null);
    const [collectLoading, setCollectLoading] = useState(false);

    // Bulk select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);

    // Payment log state
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [logCache, setLogCache] = useState<Record<string, PaymentLogEntry[]>>({});
    const [logLoading, setLogLoading] = useState<string | null>(null);

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

    // Clear selections when bookings change
    useEffect(() => { setSelectedIds(new Set()); }, [bookings]);

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

    // Single collect - open dialog
    const openCollectDialog = (booking: VendorBooking) => {
        setCollectTarget(booking);
        setCollectDialogOpen(true);
    };

    const handleCollectConfirm = async (data: { receiptNumber?: string; notes?: string }) => {
        if (!token || !collectTarget) return;
        setCollectLoading(true);
        try {
            await collectVendorPayment(token, collectTarget.id, data);
            setBookings((prev) =>
                prev.map((b) =>
                    b.id === collectTarget.id && b.payment
                        ? { ...b, payment: { ...b.payment, status: "COMPLETED" as const } }
                        : b
                )
            );
            toast("Cash payment collected successfully.", "success");
            setCollectDialogOpen(false);
            // Invalidate log cache for this booking
            setLogCache((prev) => {
                const next = { ...prev };
                delete next[collectTarget.id];
                return next;
            });
        } catch {
            toast("Failed to collect payment.", "error");
        } finally {
            setCollectLoading(false);
        }
    };

    // Bulk collect
    const cashPendingBookings = bookings.filter(isCashPending);
    const allCashPendingSelected = cashPendingBookings.length > 0 && cashPendingBookings.every(b => selectedIds.has(b.id));

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allCashPendingSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(cashPendingBookings.map(b => b.id)));
        }
    };

    const selectedBookings = bookings.filter(b => selectedIds.has(b.id));
    const bulkTotalAmount = selectedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const bulkCurrency = selectedBookings[0]?.currency || "JOD";

    const handleBulkCollectConfirm = async (data: { receiptNumber?: string; notes?: string }) => {
        if (!token || selectedIds.size === 0) return;
        setBulkLoading(true);
        try {
            await bulkCollectVendorPayments(token, Array.from(selectedIds), data);
            setBookings((prev) =>
                prev.map((b) =>
                    selectedIds.has(b.id) && b.payment
                        ? { ...b, payment: { ...b.payment, status: "COMPLETED" as const } }
                        : b
                )
            );
            toast(`${selectedIds.size} payment(s) collected successfully.`, "success");
            setBulkDialogOpen(false);
            setSelectedIds(new Set());
            // Clear log cache for all collected bookings
            setLogCache({});
        } catch {
            toast("Failed to collect payments.", "error");
        } finally {
            setBulkLoading(false);
        }
    };

    // Payment logs
    const toggleLogs = async (bookingId: string) => {
        if (expandedLogId === bookingId) {
            setExpandedLogId(null);
            return;
        }
        setExpandedLogId(bookingId);
        if (logCache[bookingId]) return;
        if (!token) return;
        setLogLoading(bookingId);
        try {
            const logs = await getVendorPaymentLogs(token, bookingId);
            setLogCache((prev) => ({ ...prev, [bookingId]: logs }));
        } catch {
            toast("Failed to load payment logs.", "error");
        } finally {
            setLogLoading(null);
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

    const LOG_ACTION_COLORS: Record<string, string> = {
        CREATED: "text-blue-400",
        COLLECTED: "text-green-400",
        REFUNDED: "text-red-400",
    };

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    const renderLogTimeline = (bookingId: string) => {
        if (expandedLogId !== bookingId) return null;
        const logs = logCache[bookingId];
        const isLoading = logLoading === bookingId;

        return (
            <div className="mt-3 rounded-xl bg-slate-50/50 dark:bg-dark-850/50 border border-slate-700/50 p-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment History</div>
                {isLoading ? (
                    <div className="flex items-center gap-2 py-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                        <span className="text-xs text-slate-500">Loading...</span>
                    </div>
                ) : !logs || logs.length === 0 ? (
                    <div className="text-xs text-slate-500 py-1">No payment activity recorded.</div>
                ) : (
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <div key={log.id} className="flex items-start gap-2 text-xs">
                                <div className={`font-bold min-w-[70px] ${LOG_ACTION_COLORS[log.action] || "text-slate-400"}`}>
                                    {log.action}
                                </div>
                                <div className="flex-1 text-slate-400">
                                    <span className="text-slate-300">{log.performedBy.name || "System"}</span>
                                    {log.receiptNumber && <span className="ml-2 text-slate-500">#{log.receiptNumber}</span>}
                                    {log.notes && <span className="ml-2 italic text-slate-500">{log.notes}</span>}
                                </div>
                                <div className="text-slate-600 whitespace-nowrap">
                                    {format(new Date(log.createdAt), "MMM d, h:mm a")}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

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
                            : "bg-slate-50 dark:bg-dark-850 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Bulk selection bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-4 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3">
                    <span className="text-sm font-bold text-green-400">
                        {selectedIds.size} booking{selectedIds.size > 1 ? "s" : ""} selected
                    </span>
                    <button
                        onClick={() => setBulkDialogOpen(true)}
                        className="text-sm font-bold bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Collect All Selected
                    </button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-sm text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Mobile card view */}
            <div className="space-y-4 md:hidden">
                {bookings.length === 0 ? (
                    <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-sm font-medium text-slate-500">No bookings found.</div>
                ) : bookings.map((booking) => (
                    <div key={booking.id} className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-3">
                                {isCashPending(booking) && (
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(booking.id)}
                                        onChange={() => toggleSelect(booking.id)}
                                        className="mt-1 h-4 w-4 rounded border-slate-600 text-brand-500 focus:ring-brand-500 cursor-pointer"
                                    />
                                )}
                                <div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{booking.customer?.name || "Anonymous"}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{booking.customer?.phone || "-"}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-brand-400">{booking.totalPrice.toFixed(2)} {booking.currency}</span>
                                {booking.unitPrice != null && booking.pricingInterval && (
                                    <div className="text-[10px] text-slate-500">{booking.unitPrice.toFixed(2)} / {formatPricingInterval(booking.pricingInterval)}{booking.pricingMode && booking.pricingMode !== "PER_BOOKING" ? ` (${formatPricingMode(booking.pricingMode)})` : ""}</div>
                                )}
                            </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">{booking.service.name}</div>
                        {booking.requestedSetup && (
                            <span className="inline-block rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-xs font-medium mb-1">
                                Setup: {formatSetupType(booking.requestedSetup)}
                            </span>
                        )}
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
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{formatPaymentStatus(booking.payment?.status || "UNPAID")}</span>
                                {isCashPending(booking) && (
                                    <button onClick={() => openCollectDialog(booking)} className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-md hover:bg-green-700 transition-colors">Collect</button>
                                )}
                                {booking.payment && (
                                    <button
                                        onClick={() => toggleLogs(booking.id)}
                                        className={`text-xs px-2 py-1 rounded-md transition-colors ${expandedLogId === booking.id ? "bg-brand-500/20 text-brand-400" : "text-slate-500 hover:text-slate-300"}`}
                                    >
                                        Log
                                    </button>
                                )}
                            </div>
                        </div>
                        {renderLogTimeline(booking.id)}
                    </div>
                ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-hidden rounded-2xl bg-white dark:bg-dark-900 shadow-float border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-dark-850">
                            <tr>
                                <th className="px-4 py-4 text-left">
                                    {cashPendingBookings.length > 0 && (
                                        <input
                                            type="checkbox"
                                            checked={allCashPendingSelected}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-slate-600 text-brand-500 focus:ring-brand-500 cursor-pointer"
                                        />
                                    )}
                                </th>
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
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-slate-500">
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <Fragment key={booking.id}>
                                        <tr className="even:bg-slate-50/30 dark:even:bg-dark-850/30 hover:bg-gray-50 dark:hover:bg-dark-850/60 transition-colors">
                                            <td className="px-4 py-4">
                                                {isCashPending(booking) && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(booking.id)}
                                                        onChange={() => toggleSelect(booking.id)}
                                                        className="h-4 w-4 rounded border-slate-600 text-brand-500 focus:ring-brand-500 cursor-pointer"
                                                    />
                                                )}
                                            </td>
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
                                                {booking.requestedSetup && (
                                                    <span className="inline-block mt-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-xs font-medium">
                                                        Setup: {formatSetupType(booking.requestedSetup)}
                                                    </span>
                                                )}
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
                                                {booking.unitPrice != null && booking.pricingInterval && (
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                                                        {booking.unitPrice.toFixed(2)} JOD / {formatPricingInterval(booking.pricingInterval)}
                                                        {booking.pricingMode && booking.pricingMode !== "PER_BOOKING" && <span className="ml-1 text-slate-400">({formatPricingMode(booking.pricingMode)})</span>}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-xs font-medium text-slate-500">
                                                        {formatPaymentStatus(booking.payment?.status || "UNPAID")}
                                                    </span>
                                                    {booking.payment && (
                                                        <button
                                                            onClick={() => toggleLogs(booking.id)}
                                                            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${expandedLogId === booking.id ? "bg-brand-500/20 text-brand-400" : "text-slate-600 hover:text-slate-400"}`}
                                                            title="View payment history"
                                                        >
                                                            Log
                                                        </button>
                                                    )}
                                                </div>
                                                {isCashPending(booking) && (
                                                    <button onClick={() => openCollectDialog(booking)} className="mt-1 text-xs bg-green-600 text-white px-2.5 py-1 rounded-md hover:bg-green-700 transition-colors">Collect</button>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedLogId === booking.id && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-2 bg-slate-50/20 dark:bg-dark-850/20">
                                                    {renderLogTimeline(booking.id)}
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {meta && <Pagination meta={meta} />}

            {/* Single collect dialog */}
            <CollectPaymentDialog
                isOpen={collectDialogOpen}
                onClose={() => setCollectDialogOpen(false)}
                onConfirm={handleCollectConfirm}
                amount={collectTarget?.totalPrice || 0}
                currency={collectTarget?.currency || "JOD"}
                customerName={collectTarget?.customer?.name || "Anonymous"}
                loading={collectLoading}
            />

            {/* Bulk collect dialog */}
            <CollectPaymentDialog
                isOpen={bulkDialogOpen}
                onClose={() => setBulkDialogOpen(false)}
                onConfirm={handleBulkCollectConfirm}
                amount={bulkTotalAmount}
                currency={bulkCurrency}
                customerName={`${selectedIds.size} booking${selectedIds.size > 1 ? "s" : ""} selected`}
                loading={bulkLoading}
                title="Bulk Collect Cash Payments"
            />
        </div>
    );
}
