"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../../lib/auth-context";
import { useToast } from "../../../../components/ui/toast-provider";
import {
    getVendorBookingById,
    getVendorBranches,
    getVendorAddOns,
    getVendorProfile,
    updateVendorBooking,
} from "../../../../../lib/vendor";
import type {
    VendorBooking,
    VendorBranchDetail,
    ServiceItem,
    VendorAddOn,
} from "../../../../../lib/types";
import { isSetupEligible, getAvailablePricingModes, getServicePriceByMode } from "../../../../../lib/types";
import { formatSetupType } from "../../../../../lib/format";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

interface AddOnRow {
    id: string;
    vendorAddOnId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    serviceTime: string;
    comments: string;
}

let rowCounter = 0;
function nextId() {
    return `ao-${++rowCounter}`;
}

/** Extract "YYYY-MM-DD" from an ISO date-time string */
function isoToDate(iso: string): string {
    return iso.slice(0, 10);
}

/** Extract "HH:mm" from an ISO date-time string */
function isoToTime(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const inputCls =
    "w-full px-3 py-2 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors";
const selectCls = inputCls;

/* ------------------------------------------------------------------ */
/*  Page Component                                                    */
/* ------------------------------------------------------------------ */

export default function EditVendorBookingPage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const bookingId = params.id as string;

    // Data
    const [booking, setBooking] = useState<VendorBooking | null>(null);
    const [branches, setBranches] = useState<VendorBranchDetail[]>([]);
    const [vendorAddOns, setVendorAddOns] = useState<VendorAddOn[]>([]);
    const [vendorTaxRate, setVendorTaxRate] = useState<number>(16);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [branchId, setBranchId] = useState("");
    const [serviceId, setServiceId] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [numberOfPeople, setNumberOfPeople] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);
    const [pricingMode, setPricingMode] = useState("");
    const [setupType, setSetupType] = useState("");
    const [notes, setNotes] = useState("");
    const [addOns, setAddOns] = useState<AddOnRow[]>([]);
    const [discountType, setDiscountType] = useState("NONE");
    const [discountValue, setDiscountValue] = useState(0);
    const [subjectToTax, setSubjectToTax] = useState(true);

    // Load data on mount
    useEffect(() => {
        if (!token || !bookingId) return;
        setLoading(true);
        Promise.all([
            getVendorBookingById(token, bookingId),
            getVendorBranches(token).then((res) => {
                const data = res.data || (res as unknown as VendorBranchDetail[]);
                return Array.isArray(data) ? data : [];
            }),
            getVendorAddOns(token).then((data) => {
                return Array.isArray(data) ? data.filter((a) => a.isActive) : [];
            }),
            getVendorProfile(token).then((profile) => {
                if (profile.taxRate != null) {
                    return Number(profile.taxRate);
                }
                return 16;
            }),
        ])
            .then(([bk, br, ao, tr]) => {
                setBooking(bk);
                setBranches(br);
                setVendorAddOns(ao);
                setVendorTaxRate(tr);

                // Pre-populate form from existing booking
                setBranchId(bk.branch?.id || "");
                setServiceId(bk.service?.id || "");
                setDate(isoToDate(bk.startTime));
                setStartTime(isoToTime(bk.startTime));
                setEndTime(isoToTime(bk.endTime));
                setNumberOfPeople(bk.numberOfPeople || 1);
                setUnitPrice(bk.unitPrice ?? 0);
                setPricingMode(bk.pricingMode || "");
                setSetupType(bk.requestedSetup || "");
                setNotes(bk.notes || "");
                setSubjectToTax(
                    bk.taxRate !== null && bk.taxRate !== undefined && bk.taxRate > 0
                );

                // Pre-populate discount
                if (bk.discountType && bk.discountType !== "NONE" && bk.discountType !== "PROMO_CODE") {
                    setDiscountType(bk.discountType);
                    setDiscountValue(bk.discountValue ?? 0);
                } else {
                    setDiscountType("NONE");
                    setDiscountValue(0);
                }

                // Pre-populate add-ons
                if (bk.addOns && bk.addOns.length > 0) {
                    setAddOns(
                        bk.addOns.map((a) => ({
                            id: nextId(),
                            vendorAddOnId: a.vendorAddOnId || "",
                            name: a.name,
                            unitPrice: a.unitPrice,
                            quantity: a.quantity,
                            serviceTime: a.serviceTime || "",
                            comments: a.comments || "",
                        }))
                    );
                }
            })
            .catch((err) => {
                setError(err.message || "Failed to load booking data.");
            })
            .finally(() => setLoading(false));
    }, [token, bookingId]);

    // Derived: services for the selected branch
    const branchServices = useMemo(() => {
        const b = branches.find((b) => b.id === branchId);
        return b?.services || [];
    }, [branchId, branches]);

    // Derived: selected service
    const selectedService: ServiceItem | undefined = useMemo(() => {
        return branchServices.find((s) => s.id === serviceId);
    }, [branchServices, serviceId]);

    // When branch changes, reset service if not in the branch
    const handleBranchChange = (newBranchId: string) => {
        setBranchId(newBranchId);
        const newBranch = branches.find((b) => b.id === newBranchId);
        const svcStillValid = newBranch?.services.some((s) => s.id === serviceId);
        if (!svcStillValid) {
            setServiceId("");
            setSetupType("");
            setPricingMode("");
            setUnitPrice(0);
        }
    };

    // When service changes, reset dependent fields and set price from service
    const handleServiceChange = (newServiceId: string) => {
        setServiceId(newServiceId);
        setSetupType("");
        const svc = branchServices.find(s => s.id === newServiceId);
        const modes = svc ? getAvailablePricingModes(svc) : [];
        const defaultMode = modes[0];
        setPricingMode(defaultMode?.mode || "");
        setUnitPrice(defaultMode?.price || 0);
    };

    // Add-on helpers
    const addAddOn = () => {
        setAddOns((prev) => [
            ...prev,
            {
                id: nextId(),
                vendorAddOnId: "",
                name: "",
                unitPrice: 0,
                quantity: 1,
                serviceTime: "",
                comments: "",
            },
        ]);
    };

    const updateAddOn = (addOnId: string, patch: Partial<AddOnRow>) => {
        setAddOns((prev) => prev.map((a) => (a.id === addOnId ? { ...a, ...patch } : a)));
    };

    const removeAddOn = (addOnId: string) => {
        setAddOns((prev) => prev.filter((a) => a.id !== addOnId));
    };

    const selectAddOnFromCatalog = (addOnId: string, vendorAddOnId: string) => {
        const catalogItem = vendorAddOns.find((a) => a.id === vendorAddOnId);
        if (!catalogItem) return;
        updateAddOn(addOnId, {
            vendorAddOnId,
            name: catalogItem.name,
            unitPrice: catalogItem.unitPrice,
        });
    };

    /* ------------------------------------------------------------------ */
    /*  Financial Calculation                                             */
    /* ------------------------------------------------------------------ */

    const financial = useMemo(() => {
        const lineItems: { desc: string; unitPrice: number; qty: number; total: number }[] = [];
        let subtotal = 0;

        // Service line item
        if (unitPrice > 0 && selectedService) {
            const effectivePricingMode = pricingMode || "PER_BOOKING";
            let qty = 1;

            if (effectivePricingMode === "PER_PERSON") {
                qty = numberOfPeople;
            } else if (effectivePricingMode === "PER_HOUR" && startTime && endTime) {
                const [sh, sm] = startTime.split(":").map(Number);
                const [eh, em] = endTime.split(":").map(Number);
                qty = Math.max(((eh! * 60 + em!) - (sh! * 60 + sm!)) / 60, 0);
            }

            const total = unitPrice * qty;
            lineItems.push({
                desc: selectedService.name || "Room",
                unitPrice,
                qty,
                total,
            });
            subtotal += total;
        }

        // Add-on line items
        for (const ao of addOns) {
            if (ao.unitPrice > 0 && ao.quantity > 0) {
                const total = ao.unitPrice * ao.quantity;
                lineItems.push({
                    desc: ao.name || "Add-on",
                    unitPrice: ao.unitPrice,
                    qty: ao.quantity,
                    total,
                });
                subtotal += total;
            }
        }

        // Discount
        let discount = 0;
        let discountLabel = "";
        if (discountType === "PERCENTAGE" && discountValue > 0) {
            discount = subtotal * (discountValue / 100);
            discountLabel = `Discount (${discountValue}%)`;
        } else if (discountType === "FIXED" && discountValue > 0) {
            discount = Math.min(discountValue, subtotal);
            discountLabel = "Discount (Fixed)";
        }

        const taxable = subtotal - discount;
        const taxRate = subjectToTax ? vendorTaxRate : 0;
        const tax = taxable * (taxRate / 100);
        const total = taxable + tax;

        return { lineItems, subtotal, discount, discountLabel, taxRate, tax, total };
    }, [
        unitPrice,
        pricingMode,
        selectedService,
        numberOfPeople,
        startTime,
        endTime,
        addOns,
        discountType,
        discountValue,
        subjectToTax,
        vendorTaxRate,
    ]);

    /* ------------------------------------------------------------------ */
    /*  Submit                                                            */
    /* ------------------------------------------------------------------ */

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!branchId) {
            setError("Please select a branch.");
            return;
        }
        if (!serviceId) {
            setError("Please select a service/room.");
            return;
        }
        if (!date || !startTime || !endTime) {
            setError("Please set a date and time range.");
            return;
        }

        setSubmitting(true);
        try {
            const startISO = new Date(`${date}T${startTime}:00`).toISOString();
            const endISO = new Date(`${date}T${endTime}:00`).toISOString();

            await updateVendorBooking(token!, bookingId, {
                branchId,
                serviceId,
                startTime: startISO,
                endTime: endISO,
                numberOfPeople,
                pricingMode: pricingMode || undefined,
                requestedSetup: setupType || undefined,
                notes: notes || undefined,
                addOns: addOns
                    .filter((a) => a.vendorAddOnId)
                    .map((a) => ({
                        vendorAddOnId: a.vendorAddOnId,
                        quantity: a.quantity,
                        serviceTime: a.serviceTime || undefined,
                        comments: a.comments || undefined,
                    })),
                discountType: discountType !== "NONE" ? discountType : undefined,
                discountValue:
                    discountType !== "NONE" && discountValue > 0
                        ? discountValue
                        : undefined,
                subjectToTax,
            });

            toast("Booking updated successfully.", "success");
            router.push("/vendor/bookings/confirmed");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to update booking.";
            setError(message);
            toast(message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* ------------------------------------------------------------------ */
    /*  Render: Loading                                                   */
    /* ------------------------------------------------------------------ */

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full text-center space-y-4">
                    <p className="text-red-400 font-medium">
                        {error || "Booking not found."}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Render: Form                                                      */
    /* ------------------------------------------------------------------ */

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-lg p-2 text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                    title="Go back"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                        />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Edit Booking
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Modify booking details for{" "}
                        {booking.customer?.name || booking.customer?.email || "customer"}.
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-medium border border-red-500/20">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ============ SECTION 1: Branch & Service ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Branch & Service
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Branch
                            </label>
                            <select
                                value={branchId}
                                onChange={(e) => handleBranchChange(e.target.value)}
                                required
                                className={selectCls}
                            >
                                <option value="">Select a branch</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} - {b.city}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Service / Room
                            </label>
                            <select
                                value={serviceId}
                                onChange={(e) => handleServiceChange(e.target.value)}
                                disabled={!branchId}
                                required
                                className={selectCls}
                            >
                                <option value="">
                                    {branchId ? "Select room" : "Select branch first"}
                                </option>
                                {branchServices.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                        {s.isPublic === false ? " (hidden)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ============ SECTION 2: Date & Time ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Date & Time
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>

                {/* ============ SECTION 3: Capacity & Pricing ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Capacity & Pricing
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Number of People
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={numberOfPeople}
                                onChange={(e) =>
                                    setNumberOfPeople(
                                        Math.max(1, parseInt(e.target.value) || 1)
                                    )
                                }
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Pricing Mode
                            </label>
                            <select
                                value={pricingMode}
                                onChange={(e) => {
                                    const mode = e.target.value;
                                    setPricingMode(mode);
                                    if (selectedService) {
                                        setUnitPrice(getServicePriceByMode(selectedService, mode));
                                    }
                                }}
                                disabled={!serviceId}
                                className={selectCls}
                            >
                                <option value="">--</option>
                                {(selectedService ? getAvailablePricingModes(selectedService) : []).map(m => (
                                    <option key={m.mode} value={m.mode}>
                                        {m.price.toFixed(3)} JOD {m.mode === 'PER_PERSON' ? '/person' : m.mode === 'PER_HOUR' ? '/hour' : '/booking'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Unit Price (JOD)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={unitPrice || ""}
                                onChange={(e) =>
                                    setUnitPrice(Number(e.target.value) || 0)
                                }
                                className={`${inputCls} text-right`}
                            />
                        </div>
                    </div>

                    {/* Setup type (only for MEETING_ROOM / EVENT_SPACE) */}
                    {selectedService &&
                        isSetupEligible(selectedService.type) &&
                        (selectedService.setupConfigs || []).length > 0 && (
                            <div className="mt-4">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                    Setup Type
                                </label>
                                <select
                                    value={setupType}
                                    onChange={(e) => setSetupType(e.target.value)}
                                    className={`${selectCls} max-w-xs`}
                                >
                                    <option value="">None</option>
                                    {(selectedService.setupConfigs || []).map((c) => (
                                        <option
                                            key={c.setupType}
                                            value={c.setupType}
                                        >
                                            {formatSetupType(c.setupType)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                </div>

                {/* ============ SECTION 4: Notes ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Notes
                    </h2>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Booking notes..."
                        className={`${inputCls} resize-none`}
                    />
                </div>

                {/* ============ SECTION 5: Add-Ons ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Add-Ons
                    </h2>
                    {addOns.length > 0 ? (
                        <div className="space-y-3">
                            {addOns.map((ao) => (
                                <div
                                    key={ao.id}
                                    className="grid grid-cols-[1fr_80px_auto_auto] gap-3 items-center"
                                >
                                    <select
                                        value={ao.vendorAddOnId}
                                        onChange={(e) =>
                                            selectAddOnFromCatalog(
                                                ao.id,
                                                e.target.value
                                            )
                                        }
                                        className={selectCls}
                                    >
                                        <option value="">Select add-on</option>
                                        {vendorAddOns.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.name} ({a.unitPrice.toFixed(3)} JOD)
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        value={ao.quantity}
                                        onChange={(e) =>
                                            updateAddOn(ao.id, {
                                                quantity: Math.max(
                                                    1,
                                                    parseInt(e.target.value) || 1
                                                ),
                                            })
                                        }
                                        className={inputCls}
                                        placeholder="Qty"
                                    />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap min-w-[90px] text-right">
                                        {(ao.unitPrice * ao.quantity).toFixed(3)} JOD
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeAddOn(ao.id)}
                                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                    >
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth="2"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 18 18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 mb-3">
                            No add-ons selected.
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={addAddOn}
                        className="mt-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 px-5 py-2.5 text-sm font-bold text-slate-500 hover:border-brand-500 hover:text-brand-500 transition-colors w-full"
                    >
                        + Add Add-On
                    </button>
                </div>

                {/* ============ SECTION 6: Tax & Discount ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Tax & Discount
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Subject to Sales Tax
                            </label>
                            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-fit">
                                <button
                                    type="button"
                                    onClick={() => setSubjectToTax(true)}
                                    className={`px-5 py-2 text-sm font-medium transition-colors ${
                                        subjectToTax
                                            ? "bg-brand-500 text-white"
                                            : "bg-white dark:bg-dark-850 text-gray-700 dark:text-slate-300"
                                    }`}
                                >
                                    Yes ({vendorTaxRate}%)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSubjectToTax(false)}
                                    className={`px-5 py-2 text-sm font-medium transition-colors ${
                                        !subjectToTax
                                            ? "bg-brand-500 text-white"
                                            : "bg-white dark:bg-dark-850 text-gray-700 dark:text-slate-300"
                                    }`}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Discount Type
                            </label>
                            <select
                                value={discountType}
                                onChange={(e) => {
                                    setDiscountType(e.target.value);
                                    setDiscountValue(0);
                                }}
                                className={selectCls}
                            >
                                <option value="NONE">None</option>
                                <option value="PERCENTAGE">Percentage</option>
                                <option value="FIXED">Fixed Amount</option>
                            </select>
                        </div>
                        {discountType === "PERCENTAGE" && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                    Discount (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={discountValue || ""}
                                    onChange={(e) =>
                                        setDiscountValue(Number(e.target.value) || 0)
                                    }
                                    className={inputCls}
                                />
                            </div>
                        )}
                        {discountType === "FIXED" && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                                    Discount Amount (JOD)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={discountValue || ""}
                                    onChange={(e) =>
                                        setDiscountValue(Number(e.target.value) || 0)
                                    }
                                    className={inputCls}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ============ SECTION 7: Financial Overview ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Financial Overview
                    </h2>
                    {financial.lineItems.length > 0 ? (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-dark-850 text-left">
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 w-8">
                                                #
                                            </th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">
                                                Item Description
                                            </th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">
                                                Unit Price
                                            </th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">
                                                Qty
                                            </th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {financial.lineItems.map((item, i) => (
                                            <tr
                                                key={i}
                                                className="border-t border-slate-200 dark:border-slate-700"
                                            >
                                                <td className="px-4 py-2 text-slate-500">
                                                    {i + 1}
                                                </td>
                                                <td className="px-4 py-2 text-gray-900 dark:text-white">
                                                    {item.desc}
                                                </td>
                                                <td className="px-4 py-2 text-gray-900 dark:text-white text-right">
                                                    {item.unitPrice.toFixed(3)}
                                                </td>
                                                <td className="px-4 py-2 text-gray-900 dark:text-white text-right">
                                                    {item.qty}
                                                </td>
                                                <td className="px-4 py-2 text-gray-900 dark:text-white text-right">
                                                    {item.total.toFixed(3)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 ml-auto max-w-xs space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {financial.subtotal.toFixed(3)} JOD
                                    </span>
                                </div>
                                {financial.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-400">
                                            {financial.discountLabel}
                                        </span>
                                        <span className="font-medium text-red-400">
                                            -{financial.discount.toFixed(3)} JOD
                                        </span>
                                    </div>
                                )}
                                {financial.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">
                                            Sales Tax ({financial.taxRate}%)
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {financial.tax.toFixed(3)} JOD
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                    <span className="text-gray-900 dark:text-white">
                                        Total
                                    </span>
                                    <span className="text-brand-400">
                                        {financial.total.toFixed(3)} JOD
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500">
                            Select a service and pricing to see the financial breakdown.
                        </p>
                    )}
                </div>

                {/* ============ Actions ============ */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-6 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-xl active:scale-95 bg-brand-500 hover:bg-brand-600 shadow-[0_4px_12px_rgba(255,91,4,0.3)] px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                    >
                        {submitting ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
