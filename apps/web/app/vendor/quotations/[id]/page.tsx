"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { useToast } from "../../../components/ui/toast-provider";
import { getQuotation, updateQuotation, sendQuotation, acceptQuotation, rejectQuotation, convertQuotationToBooking } from "../../../../lib/quotations";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";
import { format } from "date-fns";
import type { Quotation } from "../../../../lib/types";

const STATUS_COLORS: Record<string, string> = {
    NOT_SENT: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    SENT: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    ACCEPTED: "bg-green-500/10 text-green-400 border border-green-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border border-red-500/20",
};

export default function QuotationDetailPage() {
    const { id } = useParams() as { id: string };
    const { token } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit mode
    const [editing, setEditing] = useState(false);
    const [editStartTime, setEditStartTime] = useState("");
    const [editEndTime, setEditEndTime] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [editPeople, setEditPeople] = useState(1);
    const [editPricingInterval, setEditPricingInterval] = useState("");
    const [editPricingMode, setEditPricingMode] = useState("");
    const [saving, setSaving] = useState(false);

    // Confirm dialogs
    const [confirmSendOpen, setConfirmSendOpen] = useState(false);
    const [confirmAcceptOpen, setConfirmAcceptOpen] = useState(false);
    const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
    const [confirmConvertOpen, setConfirmConvertOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const loadQuotation = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await getQuotation(token, id);
            setQuotation(data);
        } catch (err: any) {
            setError(err.message || "Failed to load quotation.");
        } finally {
            setLoading(false);
        }
    }, [token, id]);

    useEffect(() => {
        loadQuotation();
    }, [loadQuotation]);

    // Populate edit fields when entering edit mode
    const enterEditMode = () => {
        if (!quotation) return;
        setEditStartTime(toLocalDatetime(quotation.startTime));
        setEditEndTime(toLocalDatetime(quotation.endTime));
        setEditAmount(String(quotation.totalAmount));
        setEditNotes(quotation.notes || "");
        setEditPeople(quotation.numberOfPeople);
        setEditPricingInterval(quotation.pricingInterval || "");
        setEditPricingMode(quotation.pricingMode || "");
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
    };

    const handleSaveEdit = async () => {
        if (!token || !quotation) return;
        setSaving(true);
        try {
            const updated = await updateQuotation(token, id, {
                startTime: new Date(editStartTime).toISOString(),
                endTime: new Date(editEndTime).toISOString(),
                totalAmount: Number(editAmount),
                numberOfPeople: editPeople,
                pricingInterval: editPricingInterval || undefined,
                pricingMode: editPricingMode || undefined,
                notes: editNotes || undefined,
            });
            setQuotation(updated);
            setEditing(false);
            toast("Quotation updated successfully.", "success");
        } catch (err: any) {
            toast(err.message || "Failed to update quotation.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async () => {
        if (!token) return;
        setActionLoading(true);
        try {
            const updated = await sendQuotation(token, id);
            setQuotation(updated);
            toast("Quotation sent to customer.", "success");
        } catch (err: any) {
            toast(err.message || "Failed to send quotation.", "error");
        } finally {
            setActionLoading(false);
            setConfirmSendOpen(false);
        }
    };

    const handleAccept = async () => {
        if (!token) return;
        setActionLoading(true);
        try {
            const updated = await acceptQuotation(token, id);
            setQuotation(updated);
            toast("Quotation accepted.", "success");
        } catch (err: any) {
            toast(err.message || "Failed to accept quotation.", "error");
        } finally {
            setActionLoading(false);
            setConfirmAcceptOpen(false);
        }
    };

    const handleReject = async () => {
        if (!token) return;
        setActionLoading(true);
        try {
            const updated = await rejectQuotation(token, id);
            setQuotation(updated);
            toast("Quotation rejected.", "success");
        } catch (err: any) {
            toast(err.message || "Failed to reject quotation.", "error");
        } finally {
            setActionLoading(false);
            setConfirmRejectOpen(false);
        }
    };

    const handleConvert = async () => {
        if (!token) return;
        setActionLoading(true);
        try {
            await convertQuotationToBooking(token, id);
            toast("Quotation converted to booking.", "success");
            router.push("/vendor/bookings");
        } catch (err: any) {
            toast(err.message || "Failed to convert quotation.", "error");
        } finally {
            setActionLoading(false);
            setConfirmConvertOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    if (error || !quotation) {
        return (
            <div className="text-center py-20">
                <p className="text-red-400 text-sm font-medium">{error || "Quotation not found."}</p>
                <button
                    onClick={() => router.push("/vendor/quotations")}
                    className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                    Back to Quotations
                </button>
            </div>
        );
    }

    const isEditable = quotation.status === "NOT_SENT" || quotation.status === "SENT";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push("/vendor/quotations")}
                        className="text-sm text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-2 inline-flex items-center gap-1"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        Back to Quotations
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Quotation {quotation.referenceNumber}
                    </h1>
                </div>
                <span
                    className={`inline-flex self-start rounded-full border px-3 py-1 text-sm font-bold ${STATUS_COLORS[quotation.status] || ""}`}
                >
                    {quotation.status.replace("_", " ")}
                </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
                {quotation.status === "NOT_SENT" && (
                    <button
                        onClick={() => setConfirmSendOpen(true)}
                        className="rounded-xl bg-blue-600 active:scale-95 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-sm"
                    >
                        Send to Customer
                    </button>
                )}
                {quotation.status === "SENT" && (
                    <>
                        <button
                            onClick={() => setConfirmAcceptOpen(true)}
                            className="rounded-xl bg-green-600 active:scale-95 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-all shadow-sm"
                        >
                            Accept Quotation
                        </button>
                        <button
                            onClick={() => setConfirmRejectOpen(true)}
                            className="rounded-xl bg-red-600 active:scale-95 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-all shadow-sm"
                        >
                            Reject Quotation
                        </button>
                    </>
                )}
                {quotation.status === "ACCEPTED" && (
                    <button
                        onClick={() => setConfirmConvertOpen(true)}
                        className="rounded-xl bg-brand-500 active:scale-95 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-all shadow-[0_4px_12px_rgba(255,91,4,0.3)]"
                    >
                        Convert to Booking
                    </button>
                )}
                {isEditable && !editing && (
                    <button
                        onClick={enterEditMode}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                    >
                        Edit Quotation
                    </button>
                )}
                <button
                    onClick={async () => {
                        try {
                            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                            const res = await fetch(`${apiBase}/quotations/${id}/pdf`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            if (!res.ok) throw new Error("Failed to download PDF");
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `quotation-${quotation.referenceNumber}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);
                        } catch {
                            toast("Failed to download PDF.", "error");
                        }
                    }}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                    Download PDF
                </button>
                <button
                    onClick={() => window.print()}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                    Print
                </button>
            </div>

            {/* Details cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer info */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                        Customer
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-slate-500">Name</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {quotation.customer?.name || "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Email</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {quotation.customer?.email || "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Space info */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                        Space Details
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-slate-500">Branch</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {quotation.branch?.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Service / Room</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {quotation.service?.name}{" "}
                                <span className="text-xs text-slate-500">
                                    ({quotation.service?.type?.replace("_", " ")})
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Booking details */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                        Booking Details
                    </h2>
                    {editing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    Start Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    End Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editEndTime}
                                    onChange={(e) => setEditEndTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    Number of People
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={editPeople}
                                    onChange={(e) => setEditPeople(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500">Start Time</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {format(new Date(quotation.startTime), "MMM d, yyyy - h:mm a")}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">End Time</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {format(new Date(quotation.endTime), "MMM d, yyyy - h:mm a")}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Number of People</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {quotation.numberOfPeople}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Financial details */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                        Financial
                    </h2>
                    {editing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    Pricing Interval
                                </label>
                                <select
                                    value={editPricingInterval}
                                    onChange={(e) => setEditPricingInterval(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                                >
                                    <option value="">Not set</option>
                                    <option value="HOURLY">Hourly</option>
                                    <option value="HALF_DAY">Half Day</option>
                                    <option value="DAILY">Daily</option>
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="MONTHLY">Monthly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    Pricing Mode
                                </label>
                                <select
                                    value={editPricingMode}
                                    onChange={(e) => setEditPricingMode(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                                >
                                    <option value="">Not set</option>
                                    <option value="PER_BOOKING">Per Booking</option>
                                    <option value="PER_PERSON">Per Person</option>
                                    <option value="PER_HOUR">Per Hour</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    Total Amount (JOD)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500">Total Amount</p>
                                <p className="text-2xl font-bold text-brand-400">
                                    {quotation.totalAmount} JOD
                                </p>
                            </div>
                            {quotation.pricingInterval && (
                                <div>
                                    <p className="text-xs text-slate-500">Pricing</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {quotation.pricingInterval.replace("_", " ").toLowerCase()}{quotation.pricingMode ? ` (${quotation.pricingMode.replace(/_/g, " ").toLowerCase()})` : ""}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Line Items */}
            {quotation.lineItems && quotation.lineItems.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                        Line Items
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-dark-850 text-left">
                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 w-8">#</th>
                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Description</th>
                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">Unit Price</th>
                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">Qty</th>
                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotation.lineItems.map((item, i) => (
                                    <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-white">{item.description}</td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-white text-right">{item.unitPrice.toFixed(3)}</td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-white text-right">{item.quantity}</td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-white text-right">{item.totalPrice.toFixed(3)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add-Ons */}
            {quotation.addOns && quotation.addOns.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                        Add-Ons
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-dark-850 text-left">
                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Name</th>
                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">Unit Price</th>
                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">Qty</th>
                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotation.addOns.map((addOn) => (
                                    <tr key={addOn.id} className="border-t border-slate-200 dark:border-slate-700">
                                        <td className="px-4 py-2 text-gray-900 dark:text-white">{addOn.name}</td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-white text-right">{addOn.unitPrice.toFixed(3)}</td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-white text-right">{addOn.quantity}</td>
                                        <td className="px-4 py-2 text-gray-900 dark:text-white text-right">{addOn.totalPrice.toFixed(3)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Financial Breakdown */}
            {(quotation.subtotal != null || quotation.taxAmount != null || quotation.discountAmount != null) && (
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                        Financial Summary
                    </h2>
                    <div className="ml-auto max-w-xs space-y-2">
                        {quotation.subtotal != null && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span className="font-medium text-gray-900 dark:text-white">{quotation.subtotal.toFixed(3)} JOD</span>
                            </div>
                        )}
                        {quotation.discountAmount != null && quotation.discountAmount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-red-400">
                                    Discount{quotation.discountType === "PERCENTAGE" && quotation.discountValue ? ` (${quotation.discountValue}%)` : ""}
                                </span>
                                <span className="font-medium text-red-400">-{quotation.discountAmount.toFixed(3)} JOD</span>
                            </div>
                        )}
                        {quotation.taxAmount != null && quotation.taxAmount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Tax{quotation.taxRate ? ` (${quotation.taxRate}%)` : ""}</span>
                                <span className="font-medium text-gray-900 dark:text-white">{quotation.taxAmount.toFixed(3)} JOD</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold border-t border-slate-200 dark:border-slate-700 pt-2">
                            <span className="text-gray-900 dark:text-white">Total</span>
                            <span className="text-brand-400">{quotation.totalAmount} JOD</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes section */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Notes
                </h2>
                {editing ? (
                    <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        placeholder="Add notes..."
                        className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder-slate-500 resize-none"
                    />
                ) : (
                    <p className="text-sm text-gray-900 dark:text-slate-300">
                        {quotation.notes || "No notes."}
                    </p>
                )}
            </div>

            {/* Edit action buttons */}
            {editing && (
                <div className="flex justify-end gap-3">
                    <button
                        onClick={cancelEdit}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-6 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            )}

            {/* Metadata */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Metadata
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-slate-500">Created</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(new Date(quotation.createdAt), "MMM d, yyyy")}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Last Updated</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(new Date(quotation.updatedAt), "MMM d, yyyy")}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Sent At</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {quotation.sentAt
                                ? format(new Date(quotation.sentAt), "MMM d, yyyy - h:mm a")
                                : "Not sent yet"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Created By</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {quotation.createdBy?.name || "N/A"}
                        </p>
                    </div>
                    {quotation.bookingId && (
                        <div>
                            <p className="text-xs text-slate-500">Linked Booking</p>
                            <button
                                onClick={() => router.push(`/vendor/bookings`)}
                                className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
                            >
                                View Booking
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm dialogs */}
            <ConfirmDialog
                isOpen={confirmSendOpen}
                onClose={() => setConfirmSendOpen(false)}
                onConfirm={handleSend}
                title="Send Quotation"
                message={`Are you sure you want to send quotation ${quotation.referenceNumber} to ${quotation.customer?.name || quotation.customer?.email || "the customer"}? They will receive an email with the quotation details.`}
                confirmLabel={actionLoading ? "Sending..." : "Send"}
                variant="default"
            />

            <ConfirmDialog
                isOpen={confirmAcceptOpen}
                onClose={() => setConfirmAcceptOpen(false)}
                onConfirm={handleAccept}
                title="Accept Quotation"
                message={`Are you sure you want to mark quotation ${quotation.referenceNumber} as accepted? You can then convert it to a booking.`}
                confirmLabel={actionLoading ? "Accepting..." : "Accept"}
                variant="default"
            />

            <ConfirmDialog
                isOpen={confirmRejectOpen}
                onClose={() => setConfirmRejectOpen(false)}
                onConfirm={handleReject}
                title="Reject Quotation"
                message={`Are you sure you want to reject quotation ${quotation.referenceNumber}? This action cannot be undone.`}
                confirmLabel={actionLoading ? "Rejecting..." : "Reject"}
                variant="danger"
            />

            <ConfirmDialog
                isOpen={confirmConvertOpen}
                onClose={() => setConfirmConvertOpen(false)}
                onConfirm={handleConvert}
                title="Convert to Booking"
                message={`Are you sure you want to convert quotation ${quotation.referenceNumber} into a confirmed booking? This action cannot be undone.`}
                confirmLabel={actionLoading ? "Converting..." : "Convert"}
                variant="default"
            />
        </div>
    );
}

/** Convert an ISO string to a datetime-local input value */
function toLocalDatetime(iso: string): string {
    const d = new Date(iso);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
