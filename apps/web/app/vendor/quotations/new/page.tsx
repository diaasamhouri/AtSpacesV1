"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { useToast } from "../../../components/ui/toast-provider";
import { createQuotation } from "../../../../lib/quotations";
import { getVendorBranches, searchVendorCustomers } from "../../../../lib/vendor";
import type { VendorBranchDetail, ServiceItem, CustomerSearchResult } from "../../../../lib/types";

interface DateEntry {
    date: string;
    startTime: string;
    endTime: string;
    numberOfPeople: number;
}

export default function NewQuotationPage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Query param pre-fill
    const qBranchId = searchParams.get("branchId") || "";
    const qServiceId = searchParams.get("serviceId") || "";
    const qStartDate = searchParams.get("startDate") || "";
    const qStartTime = searchParams.get("startTime") || "";
    const qEndTime = searchParams.get("endTime") || "";
    const qDates = searchParams.get("dates") || "";
    const qCapacity = searchParams.get("capacity") || "";
    const qEndDate = searchParams.get("endDate") || "";

    // Branches & services
    const [branches, setBranches] = useState<VendorBranchDetail[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Customer search
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
    const [searchingCustomers, setSearchingCustomers] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerDropdownRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Form state
    const [customerId, setCustomerId] = useState("");
    const [customerLabel, setCustomerLabel] = useState("");
    const [branchId, setBranchId] = useState(qBranchId);
    const [serviceId, setServiceId] = useState("");
    const [pendingServiceId, setPendingServiceId] = useState(qServiceId);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Multi-date entries
    const initialPeople = qCapacity ? parseInt(qCapacity) || 1 : 1;
    const [dateEntries, setDateEntries] = useState<DateEntry[]>(() => {
        if (qDates) {
            const dates = qDates.split(",").filter(Boolean);
            return dates.map((d) => ({
                date: d,
                startTime: qStartTime || "09:00",
                endTime: qEndTime || "17:00",
                numberOfPeople: initialPeople,
            }));
        }
        if (qStartDate) {
            return [{
                date: qStartDate,
                startTime: qStartTime || "09:00",
                endTime: qEndTime || "17:00",
                numberOfPeople: initialPeople,
            }];
        }
        return [{
            date: "",
            startTime: "09:00",
            endTime: "17:00",
            numberOfPeople: 1,
        }];
    });

    // Pricing type for auto-calculation
    const [pricingInterval, setPricingInterval] = useState("");

    // Selected service details
    const selectedService = useMemo(
        () => services.find((s) => s.id === serviceId),
        [services, serviceId],
    );

    // Get available pricing options for selected service
    const pricingOptions = useMemo(
        () => selectedService?.pricing || [],
        [selectedService],
    );

    // Auto-set pricing interval when service changes
    useEffect(() => {
        if (pricingOptions.length > 0 && !pricingOptions.find((p) => p.interval === pricingInterval)) {
            setPricingInterval(pricingOptions[0]!.interval);
        }
    }, [pricingOptions, pricingInterval]);

    // Auto-calculate total amount
    const calculatedTotal = useMemo(() => {
        if (!selectedService || !pricingInterval) return null;

        const pricing = pricingOptions.find((p) => p.interval === pricingInterval);
        if (!pricing) return null;

        let total = 0;
        const breakdown: { date: string; subtotal: number; hours: number; people: number }[] = [];

        for (const entry of dateEntries) {
            if (!entry.date || !entry.startTime || !entry.endTime) continue;

            const start = new Date(`${entry.date}T${entry.startTime}:00`);
            const end = new Date(`${entry.date}T${entry.endTime}:00`);
            const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
            const people = entry.numberOfPeople;

            let dayTotal = 0;
            switch (pricingInterval) {
                case "HOURLY":
                    dayTotal = hours * pricing.price;
                    break;
                case "HALF_DAY":
                case "DAILY":
                case "WEEKLY":
                case "MONTHLY":
                    dayTotal = pricing.price;
                    break;
                default:
                    dayTotal = pricing.price;
            }

            // Multiply by people if pricing mode is PER_PERSON
            if (pricing.pricingMode === "PER_PERSON") {
                dayTotal = dayTotal * people;
            }

            breakdown.push({ date: entry.date, subtotal: dayTotal, hours, people });
            total += dayTotal;
        }

        return { total: Math.round(total * 100) / 100, breakdown, unitPrice: pricing.price };
    }, [selectedService, pricingInterval, pricingOptions, dateEntries]);

    const [totalAmountOverride, setTotalAmountOverride] = useState("");
    const effectiveTotal = totalAmountOverride !== "" ? Number(totalAmountOverride) : (calculatedTotal?.total ?? 0);

    // Load branches on mount
    useEffect(() => {
        if (!token) return;
        setLoading(true);
        getVendorBranches(token)
            .then((res) => {
                const data = res.data || (res as unknown as VendorBranchDetail[]);
                setBranches(Array.isArray(data) ? data : []);
            })
            .catch(() => setBranches([]))
            .finally(() => setLoading(false));
    }, [token]);

    // Filter services when branch changes
    useEffect(() => {
        if (!branchId) {
            setServices([]);
            setServiceId("");
            return;
        }
        const branch = branches.find((b) => b.id === branchId);
        const branchServices = branch?.services || [];
        setServices(branchServices);

        // Deferred serviceId pre-fill
        if (pendingServiceId && branchServices.some((s) => s.id === pendingServiceId)) {
            setServiceId(pendingServiceId);
            setPendingServiceId("");
        } else if (!pendingServiceId) {
            setServiceId("");
        }
    }, [branchId, branches, pendingServiceId]);

    // Customer search with debounce
    const searchCustomers = useCallback(
        async (query: string) => {
            if (!token || query.length < 2) {
                setCustomerResults([]);
                setShowCustomerDropdown(false);
                return;
            }
            setSearchingCustomers(true);
            try {
                const res = await searchVendorCustomers(token, query, 10);
                setCustomerResults(res.data || []);
                setShowCustomerDropdown(true);
            } catch {
                setCustomerResults([]);
                setShowCustomerDropdown(false);
            } finally {
                setSearchingCustomers(false);
            }
        },
        [token],
    );

    const handleCustomerSearchChange = (value: string) => {
        setCustomerSearch(value);
        setCustomerId("");
        setCustomerLabel("");
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => searchCustomers(value), 300);
    };

    const selectCustomer = (user: CustomerSearchResult) => {
        setCustomerId(user.id);
        setCustomerLabel(user.name || user.email || user.id);
        setCustomerSearch(user.name || user.email || "");
        setShowCustomerDropdown(false);
    };

    // Close customer dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
                setShowCustomerDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Date entry management
    function updateDateEntry(index: number, field: keyof DateEntry, value: string | number) {
        setDateEntries((prev) => prev.map((entry, i) =>
            i === index ? { ...entry, [field]: value } : entry,
        ));
    }

    function addDateEntry() {
        const last = dateEntries[dateEntries.length - 1];
        setDateEntries((prev) => [...prev, {
            date: "",
            startTime: last?.startTime || "09:00",
            endTime: last?.endTime || "17:00",
            numberOfPeople: last?.numberOfPeople || 1,
        }]);
    }

    function removeDateEntry(index: number) {
        if (dateEntries.length <= 1) return;
        setDateEntries((prev) => prev.filter((_, i) => i !== index));
    }

    // Capacity validation
    function getCapacityError(people: number): string | null {
        if (!selectedService) return null;
        const maxCap = selectedService.setupConfigs?.length > 0
            ? Math.max(...selectedService.setupConfigs.map((c) => c.maxPeople))
            : selectedService.capacity ?? 0;
        const minCap = selectedService.setupConfigs?.length > 0
            ? Math.min(...selectedService.setupConfigs.map((c) => c.minPeople))
            : 1;
        if (maxCap > 0 && people > maxCap) return `Max capacity is ${maxCap}`;
        if (people < minCap) return `Min capacity is ${minCap}`;
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!customerId) { setError("Please select a customer."); return; }
        if (!branchId) { setError("Please select a branch."); return; }
        if (!serviceId) { setError("Please select a service/room."); return; }

        // Validate all date entries
        for (let i = 0; i < dateEntries.length; i++) {
            const entry = dateEntries[i]!;
            if (!entry.date) { setError(`Please set a date for entry ${i + 1}.`); return; }
            if (!entry.startTime || !entry.endTime) { setError(`Please set start and end times for ${entry.date}.`); return; }
            const capError = getCapacityError(entry.numberOfPeople);
            if (capError) { setError(`${entry.date}: ${capError}`); return; }
        }

        if (effectiveTotal <= 0) { setError("Please enter a valid total amount."); return; }

        // Use the first entry as the primary start/end for the quotation model
        // For multi-date, we use the earliest start and latest end
        const sortedEntries = [...dateEntries].sort((a, b) => a.date.localeCompare(b.date));
        const firstEntry = sortedEntries[0]!;
        const lastEntry = sortedEntries[sortedEntries.length - 1]!;

        const startTimeISO = new Date(`${firstEntry.date}T${firstEntry.startTime}:00`).toISOString();
        const endTimeISO = new Date(`${lastEntry.date}T${lastEntry.endTime}:00`).toISOString();

        // Build line items from date entries
        const lineItems = dateEntries.map((entry, i) => {
            const price = calculatedTotal?.breakdown[i]?.subtotal ?? effectiveTotal / dateEntries.length;
            return {
                description: `${entry.date} (${entry.startTime} - ${entry.endTime}) - ${entry.numberOfPeople} people`,
                unitPrice: calculatedTotal?.unitPrice ?? price,
                quantity: 1,
                totalPrice: price,
                sortOrder: i,
            };
        });

        setSubmitting(true);
        try {
            await createQuotation(token!, {
                customerId,
                branchId,
                serviceId,
                startTime: startTimeISO,
                endTime: endTimeISO,
                numberOfPeople: firstEntry.numberOfPeople,
                totalAmount: effectiveTotal,
                notes: notes || undefined,
                subtotal: effectiveTotal,
                lineItems: dateEntries.length > 1 ? lineItems : undefined,
            });
            toast("Quotation created successfully.", "success");
            router.push("/vendor/quotations");
        } catch (err: any) {
            setError(err.message || "Failed to create quotation.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Quotation</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Create a new quotation for a customer.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/vendor/quotations")}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                    Cancel
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-medium border border-red-500/20">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer, Branch, Service row */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-float border border-slate-200 dark:border-slate-800 space-y-6">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Booking Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer search */}
                        <div className="md:col-span-2" ref={customerDropdownRef}>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Customer *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    autoComplete="off"
                                    value={customerSearch}
                                    onChange={(e) => handleCustomerSearchChange(e.target.value)}
                                    placeholder="Search by name or email (min 2 characters)..."
                                    className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder-slate-500"
                                />
                                {searchingCustomers && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                                    </div>
                                )}
                                {customerId && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    </div>
                                )}
                                {showCustomerDropdown && customerResults.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 shadow-lg max-h-60 overflow-y-auto">
                                        {customerResults.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => selectCustomer(user)}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors border-b border-slate-200 dark:border-slate-700/50 last:border-b-0"
                                            >
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name || "Unnamed"}</p>
                                                <p className="text-xs text-slate-500">{user.email || user.phone || ""}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {showCustomerDropdown && customerResults.length === 0 && customerSearch.length >= 2 && !searchingCustomers && (
                                    <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 shadow-lg px-4 py-3">
                                        <p className="text-sm text-slate-500">No customers found.</p>
                                    </div>
                                )}
                            </div>
                            {customerLabel && (
                                <p className="mt-1 text-xs text-brand-400">Selected: {customerLabel}</p>
                            )}
                        </div>

                        {/* Branch */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Branch *
                            </label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                            >
                                <option value="">Select a branch</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} - {b.city}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Service/Room */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Service / Room *
                            </label>
                            <select
                                value={serviceId}
                                onChange={(e) => { setServiceId(e.target.value); setTotalAmountOverride(""); }}
                                required
                                disabled={!branchId}
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors disabled:opacity-50"
                            >
                                <option value="">{branchId ? "Select a service" : "Select a branch first"}</option>
                                {services.map((s) => {
                                    const maxCap = s.setupConfigs?.length > 0
                                        ? Math.max(...s.setupConfigs.map((c) => c.maxPeople))
                                        : s.capacity ?? 0;
                                    return (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.type.replace(/_/g, " ")}) - Cap: {maxCap}
                                        </option>
                                    );
                                })}
                            </select>
                            {selectedService && selectedService.setupConfigs?.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                    {selectedService.setupConfigs.map((sc) => (
                                        <span key={sc.setupType} className="rounded bg-slate-100 dark:bg-dark-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                                            {sc.setupType.replace(/_/g, " ")}: {sc.minPeople}–{sc.maxPeople}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Date & Time Entries */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-float border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Date & Time {dateEntries.length > 1 ? `(${dateEntries.length} dates)` : ""}
                        </h2>
                        <button
                            type="button"
                            onClick={addDateEntry}
                            className="rounded-lg bg-slate-100 dark:bg-dark-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-750 transition-colors"
                        >
                            + Add Date
                        </button>
                    </div>

                    <div className="space-y-3">
                        {dateEntries.map((entry, i) => {
                            const capError = getCapacityError(entry.numberOfPeople);
                            return (
                                <div
                                    key={i}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                                >
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={entry.date}
                                            onChange={(e) => updateDateEntry(i, "date", e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            Start Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={entry.startTime}
                                            onChange={(e) => updateDateEntry(i, "startTime", e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            End Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={entry.endTime}
                                            onChange={(e) => updateDateEntry(i, "endTime", e.target.value)}
                                            required
                                            className="w-full px-3 py-2 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            People
                                        </label>
                                        <input
                                            type="number"
                                            value={entry.numberOfPeople}
                                            onChange={(e) => updateDateEntry(i, "numberOfPeople", Math.max(1, parseInt(e.target.value) || 1))}
                                            min="1"
                                            className={`w-full px-3 py-2 bg-white dark:bg-dark-850 border rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 transition-colors ${
                                                capError ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                                            }`}
                                        />
                                        {capError && (
                                            <p className="text-xs text-red-400 mt-0.5">{capError}</p>
                                        )}
                                    </div>
                                    <div className="flex items-end">
                                        {dateEntries.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDateEntry(i)}
                                                className="rounded-lg border border-red-300 dark:border-red-800 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pricing & Total */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-float border border-slate-200 dark:border-slate-800 space-y-6">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pricing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pricing interval */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Pricing Type
                            </label>
                            <select
                                value={pricingInterval}
                                onChange={(e) => { setPricingInterval(e.target.value); setTotalAmountOverride(""); }}
                                disabled={pricingOptions.length === 0}
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors disabled:opacity-50"
                            >
                                <option value="">{pricingOptions.length > 0 ? "Select pricing" : "Select a service first"}</option>
                                {pricingOptions.map((p) => {
                                    const modeLabel = p.pricingMode === "PER_PERSON" ? "Per Person" : p.pricingMode === "PER_HOUR" ? "Per Hour" : "Per Booking";
                                    return (
                                        <option key={p.interval} value={p.interval}>
                                            {modeLabel} — {p.price} {p.currency || "JOD"}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Auto-calculated total */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Total Amount (JOD) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={totalAmountOverride !== "" ? totalAmountOverride : (calculatedTotal?.total?.toFixed(2) ?? "")}
                                onChange={(e) => setTotalAmountOverride(e.target.value)}
                                required
                                placeholder="Auto-calculated"
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder-slate-500"
                            />
                            {calculatedTotal && totalAmountOverride === "" && (
                                <p className="text-xs text-green-500 mt-1">Auto-calculated from pricing</p>
                            )}
                            {totalAmountOverride !== "" && calculatedTotal && (
                                <button
                                    type="button"
                                    onClick={() => setTotalAmountOverride("")}
                                    className="text-xs text-brand-400 hover:text-brand-300 mt-1"
                                >
                                    Reset to auto-calculated ({calculatedTotal.total.toFixed(2)} JOD)
                                </button>
                            )}
                        </div>

                        {/* Unit price info */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                Unit Rate
                            </label>
                            <div className="px-4 py-2.5 bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white">
                                {calculatedTotal ? `${calculatedTotal.unitPrice} JOD / ${pricingInterval.toLowerCase().replace(/_/g, " ")}` : "—"}
                            </div>
                        </div>
                    </div>

                    {/* Breakdown for multi-date */}
                    {calculatedTotal && dateEntries.length > 1 && calculatedTotal.breakdown.length > 0 && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Breakdown</h3>
                            <div className="space-y-1.5">
                                {calculatedTotal.breakdown.map((b, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {b.date} ({b.hours.toFixed(1)}h, {b.people} people)
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {b.subtotal.toFixed(2)} JOD
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-slate-700 pt-1.5">
                                    <span className="text-gray-900 dark:text-white">Total</span>
                                    <span className="text-brand-400">{calculatedTotal.total.toFixed(2)} JOD</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-float border border-slate-200 dark:border-slate-800">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                        Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Any additional notes for the customer..."
                        className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder-slate-500 resize-none"
                    />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/vendor/quotations")}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-6 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(255,91,4,0.3)]"
                    >
                        {submitting ? "Creating..." : "Create Quotation"}
                    </button>
                </div>
            </form>
        </div>
    );
}
