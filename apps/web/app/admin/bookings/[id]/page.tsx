"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { useToast } from "../../../components/ui/toast-provider";
import { getAdminBookingById, updateBookingStatus } from "../../../../lib/admin";
import { format } from "date-fns";
import { formatBookingStatus, formatServiceType, formatCity } from "../../../../lib/format";
import StatusBadge from "../../../components/ui/status-badge";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";
import Link from "next/link";
import type { AdminBookingDetail } from "../../../../lib/types";
import { formatSetupType } from "../../../../lib/types";

const STATUS_FLOW = ["PENDING", "PENDING_APPROVAL", "CONFIRMED", "CHECKED_IN", "COMPLETED"];

export default function AdminBookingDetailPage() {
    const { id } = useParams() as { id: string };
    const { token } = useAuth();
    const { toast } = useToast();

    const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        getAdminBookingById(token, id)
            .then((data) => { setBooking(data); setLoading(false); })
            .catch((err) => { setError(err.message || "Failed to load booking."); setLoading(false); });
    }, [token, id]);

    const handleStatusChange = async (newStatus: string) => {
        if (!token || !booking) return;
        try {
            await updateBookingStatus(token, booking.id, newStatus);
            setBooking({ ...booking, status: newStatus as AdminBookingDetail["status"] });
            toast(`Booking ${formatBookingStatus(newStatus).toLowerCase()}.`, "success");
        } catch { toast("Failed to update booking.", "error"); }
        setConfirmOpen(false);
        setConfirmAction(null);
    };

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    if (error || !booking) {
        return <div className="p-8 text-center text-red-500">{error || "Booking not found."}</div>;
    }

    const currentFlowIndex = STATUS_FLOW.indexOf(booking.status);

    return (
        <div className="space-y-6">
            <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
                Back to Bookings
            </Link>

            {/* Header */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Booking Details</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            ID: <span className="font-mono text-xs">{booking.id}</span>
                        </p>
                    </div>
                    <StatusBadge status={booking.status} size="md" />
                </div>

                {/* Status Timeline */}
                {currentFlowIndex >= 0 && (
                    <div className="mt-6 flex items-center gap-1">
                        {STATUS_FLOW.map((step, i) => {
                            const isActive = i <= currentFlowIndex;
                            return (
                                <div key={step} className="flex items-center flex-1">
                                    <div className={`flex-1 h-1.5 rounded-full ${isActive ? "bg-brand-500" : "bg-slate-700"}`} />
                                    <span className={`ml-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isActive ? "text-brand-500" : "text-slate-500"}`}>
                                        {formatBookingStatus(step)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                    {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                        <button onClick={() => { setConfirmAction("CANCELLED"); setConfirmOpen(true); }} className="rounded-xl bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Cancel Booking</button>
                    )}
                    {booking.status === "CONFIRMED" && (
                        <button onClick={() => { setConfirmAction("NO_SHOW"); setConfirmOpen(true); }} className="rounded-xl bg-slate-500/10 px-5 py-2.5 text-sm font-bold text-slate-500 border border-slate-500/20 hover:bg-slate-500/20 transition-colors">Mark No-Show</button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Customer</h2>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">Name</dt>
                            <dd className="text-gray-900 dark:text-white font-bold">{booking.customer?.name || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">Email</dt>
                            <dd className="text-gray-900 dark:text-white font-medium">{booking.customer?.email || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">Phone</dt>
                            <dd className="text-gray-900 dark:text-white font-medium">{booking.customer?.phone || "—"}</dd>
                        </div>
                    </dl>
                </div>

                {/* Space Info */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Space</h2>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">Branch</dt>
                            <dd className="text-gray-900 dark:text-white font-bold">{booking.branch?.name || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">City</dt>
                            <dd className="text-gray-900 dark:text-white font-medium">{booking.branch?.city ? formatCity(booking.branch.city) : "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">Vendor</dt>
                            <dd className="text-gray-900 dark:text-white font-medium">{booking.branch?.vendor || "—"}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">Service</dt>
                            <dd className="text-gray-900 dark:text-white font-medium">{booking.service?.name || "—"} <span className="text-brand-500 text-xs">({formatServiceType(booking.service?.type || "")})</span></dd>
                        </div>
                        {booking.requestedSetup && (
                            <div className="flex justify-between">
                                <dt className="text-slate-500 font-medium">Requested Setup</dt>
                                <dd className="text-gray-900 dark:text-white font-medium">
                                    <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-xs font-bold">
                                        {formatSetupType(booking.requestedSetup)}
                                    </span>
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Booking Details */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Booking Details</h2>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">Date</dt>
                            <dd className="text-gray-900 dark:text-white font-bold">{format(new Date(booking.startTime), "MMM d, yyyy")}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">Time</dt>
                            <dd className="text-gray-900 dark:text-white font-medium">{format(new Date(booking.startTime), "h:mm a")} — {format(new Date(booking.endTime), "h:mm a")}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">People</dt>
                            <dd className="text-gray-900 dark:text-white font-medium">{booking.numberOfPeople}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-500 font-medium">Total</dt>
                            <dd className="text-brand-400 font-bold">{booking.currency} {booking.totalPrice.toFixed(2)}</dd>
                        </div>
                        {booking.notes && (
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                                <dt className="text-slate-500 font-medium mb-1">Notes</dt>
                                <dd className="text-gray-900 dark:text-white font-medium bg-white dark:bg-dark-850 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-sm">{booking.notes}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Payment Details */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Payment</h2>
                    {booking.payment ? (
                        <dl className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-slate-500 font-medium">Status</dt>
                                <dd><StatusBadge status={booking.payment.status} /></dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500 font-medium">Method</dt>
                                <dd className="text-gray-900 dark:text-white font-medium">{booking.payment.method}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500 font-medium">Amount</dt>
                                <dd className="text-brand-400 font-bold">{booking.payment.currency} {booking.payment.amount.toFixed(2)}</dd>
                            </div>
                            {booking.payment.paidAt && (
                                <div className="flex justify-between">
                                    <dt className="text-slate-500 font-medium">Paid At</dt>
                                    <dd className="text-gray-900 dark:text-white font-medium">{format(new Date(booking.payment.paidAt), "MMM d, yyyy h:mm a")}</dd>
                                </div>
                            )}
                        </dl>
                    ) : (
                        <p className="text-sm text-slate-500 italic py-4 text-center">No payment recorded.</p>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
                onConfirm={() => confirmAction && handleStatusChange(confirmAction)}
                title="Update Booking"
                message={`Are you sure you want to mark this booking as ${formatBookingStatus(confirmAction || "")}?`}
                confirmLabel={confirmAction === "CANCELLED" ? "Cancel Booking" : "Mark No-Show"}
                variant="danger"
            />
        </div>
    );
}
