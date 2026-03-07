"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { useToast } from "../../../components/ui/toast-provider";
import {
    getVendorBranches, searchVendorCustomers, createVendorBooking,
    getVendorAddOns, validatePromoCode,
} from "../../../../lib/vendor";
import { CreateCustomerModal } from "../../../components/create-customer-modal";
import type { VendorBranchDetail, ServiceItem, CustomerSearchResult, VendorAddOn } from "../../../../lib/types";
import { formatSetupType } from "../../../../lib/types";

interface AddOnRow {
    id: string;
    vendorAddOnId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    serviceTime: string;
    comments: string;
}

interface BookingDayRow {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    serviceId: string;
    setupType: string;
    pricingInterval: string;
    unitPrice: number;
    numberOfPeople: number;
    notes: string;
    addOns: AddOnRow[];
    expanded: boolean;
}

let rowCounter = 0;
function nextId() { return `row-${++rowCounter}`; }

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, n: number) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputCls = "w-full px-3 py-2 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors";
const selectCls = inputCls;

export default function CreateVendorBookingPage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    const qBranchId = searchParams.get("branchId") || "";
    const qServiceId = searchParams.get("serviceId") || "";
    const qStartDate = searchParams.get("startDate") || "";
    const qStartTime = searchParams.get("startTime") || "";
    const qEndTime = searchParams.get("endTime") || "";
    const qCapacity = searchParams.get("capacity") || "";
    const qDates = searchParams.get("dates") || "";
    const lockedCapacity = !!qCapacity;

    // Data
    const [branches, setBranches] = useState<VendorBranchDetail[]>([]);
    const [vendorAddOns, setVendorAddOns] = useState<VendorAddOn[]>([]);
    const [loading, setLoading] = useState(true);

    // Customer
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
    const [searchingCustomers, setSearchingCustomers] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [customerId, setCustomerId] = useState("");
    const [customerLabel, setCustomerLabel] = useState("");
    const [customerInfo, setCustomerInfo] = useState<CustomerSearchResult | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const customerDropdownRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Branch
    const [branchId, setBranchId] = useState(qBranchId);

    // Days
    const initialPeople = qCapacity ? parseInt(qCapacity) || 1 : 1;
    const [pendingServiceId, setPendingServiceId] = useState(qServiceId);
    const [days, setDays] = useState<BookingDayRow[]>(() => {
        const defaultRow = (date: string): BookingDayRow => ({
            id: nextId(),
            date,
            startTime: qStartTime || "09:00",
            endTime: qEndTime || "17:00",
            serviceId: "",
            setupType: "",
            pricingInterval: "",
            unitPrice: 0,
            numberOfPeople: initialPeople,
            notes: "",
            addOns: [],
            expanded: false,
        });
        if (qDates) {
            return qDates.split(",").filter(Boolean).map(d => defaultRow(d));
        }
        return [defaultRow(qStartDate || todayStr())];
    });

    // Tax & Discount
    const [subjectToTax, setSubjectToTax] = useState(true);
    const [discountType, setDiscountType] = useState<string>("NONE");
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [promoCodeInput, setPromoCodeInput] = useState("");
    const [promoValidation, setPromoValidation] = useState<{ valid: boolean; message: string; discountPercent: number } | null>(null);
    const [validatingPromo, setValidatingPromo] = useState(false);

    // General
    const [generalNotes, setGeneralNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Success
    const [result, setResult] = useState<{ bookingIds: string[]; bookingGroupId: string; financialSummary: any } | null>(null);
    const [copied, setCopied] = useState(false);

    // Load data
    useEffect(() => {
        if (!token) return;
        setLoading(true);
        Promise.all([
            getVendorBranches(token).then(res => {
                const data = res.data || (res as unknown as VendorBranchDetail[]);
                setBranches(Array.isArray(data) ? data : []);
            }).catch(() => setBranches([])),
            getVendorAddOns(token).then(data => {
                setVendorAddOns(Array.isArray(data) ? data.filter(a => a.isActive) : []);
            }).catch(() => setVendorAddOns([])),
        ]).finally(() => setLoading(false));
    }, [token]);

    // Get services for selected branch
    const branchServices = useMemo(() => {
        const b = branches.find(b => b.id === branchId);
        return b?.services || [];
    }, [branchId, branches]);

    // Reset service selections when branch changes (but pre-fill from search if available)
    useEffect(() => {
        if (!branchId) return;
        if (pendingServiceId && branchServices.some(s => s.id === pendingServiceId)) {
            setDays(prev => prev.map(d => ({ ...d, serviceId: pendingServiceId })));
            setPendingServiceId("");
        } else if (!pendingServiceId) {
            setDays(prev => prev.map(d => ({ ...d, serviceId: "", setupType: "", pricingInterval: "", unitPrice: 0 })));
        }
    }, [branchId, branchServices, pendingServiceId]);

    // Customer search
    const doSearch = useCallback(async (q: string) => {
        if (!token || q.length < 2) { setCustomerResults([]); setShowCustomerDropdown(false); return; }
        setSearchingCustomers(true);
        try {
            const res = await searchVendorCustomers(token, q, 10);
            setCustomerResults(res.data || []);
            setShowCustomerDropdown(true);
        } catch { setCustomerResults([]); setShowCustomerDropdown(false); }
        finally { setSearchingCustomers(false); }
    }, [token]);

    const handleCustomerSearchChange = (v: string) => {
        setCustomerSearch(v);
        setCustomerId("");
        setCustomerLabel("");
        setCustomerInfo(null);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => doSearch(v), 300);
    };

    const selectCustomer = (u: CustomerSearchResult) => {
        setCustomerId(u.id);
        setCustomerLabel(u.name || u.email || u.id);
        setCustomerSearch(u.name || u.email || "");
        setCustomerInfo(u);
        setShowCustomerDropdown(false);
    };

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) setShowCustomerDropdown(false);
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Day row helpers
    const updateDay = (id: string, patch: Partial<BookingDayRow>) => {
        setDays(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
    };

    const addDay = () => {
        const last = days[days.length - 1];
        if (!last) return;
        setDays(prev => [...prev, {
            id: nextId(),
            date: addDays(last.date, 1),
            startTime: last.startTime,
            endTime: last.endTime,
            serviceId: last.serviceId,
            setupType: last.setupType,
            pricingInterval: last.pricingInterval,
            unitPrice: last.unitPrice,
            numberOfPeople: last.numberOfPeople,
            notes: "",
            addOns: [],
            expanded: false,
        }]);
    };

    const removeDay = (id: string) => {
        if (days.length <= 1) return;
        setDays(prev => prev.filter(d => d.id !== id));
    };

    // Add-on helpers
    const addAddOn = (dayId: string) => {
        setDays(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            return { ...d, expanded: true, addOns: [...d.addOns, { id: nextId(), vendorAddOnId: "", name: "", unitPrice: 0, quantity: 1, serviceTime: "", comments: "" }] };
        }));
    };

    const updateAddOn = (dayId: string, addOnId: string, patch: Partial<AddOnRow>) => {
        setDays(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            return { ...d, addOns: d.addOns.map(a => a.id === addOnId ? { ...a, ...patch } : a) };
        }));
    };

    const removeAddOn = (dayId: string, addOnId: string) => {
        setDays(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            return { ...d, addOns: d.addOns.filter(a => a.id !== addOnId) };
        }));
    };

    const selectAddOnFromCatalog = (dayId: string, addOnId: string, vendorAddOnId: string) => {
        const catalogItem = vendorAddOns.find(a => a.id === vendorAddOnId);
        if (!catalogItem) return;
        updateAddOn(dayId, addOnId, { vendorAddOnId, name: catalogItem.name, unitPrice: catalogItem.unitPrice });
    };

    // When service changes in a row, update setup/pricing options
    const handleServiceChange = (dayId: string, serviceId: string) => {
        updateDay(dayId, { serviceId, setupType: "", pricingInterval: "", unitPrice: 0 });
    };

    const handlePricingChange = (dayId: string, interval: string, service: ServiceItem | undefined) => {
        const p = service?.pricing?.find(p => p.interval === interval);
        updateDay(dayId, { pricingInterval: interval, unitPrice: p ? p.price : 0 });
    };

    // Promo validation
    const handleValidatePromo = async () => {
        if (!token || !promoCodeInput.trim()) return;
        setValidatingPromo(true);
        try {
            const res = await validatePromoCode(token, promoCodeInput.trim(), branchId || undefined);
            setPromoValidation(res);
            if (res.valid) {
                setDiscountValue(res.discountPercent);
            }
        } catch (err: any) {
            setPromoValidation({ valid: false, message: err.message || "Validation failed", discountPercent: 0 });
        } finally {
            setValidatingPromo(false);
        }
    };

    // Financial computation
    const financial = useMemo(() => {
        let subtotal = 0;
        const lineItems: { desc: string; unitPrice: number; qty: number; total: number }[] = [];

        for (const day of days) {
            const svc = branchServices.find(s => s.id === day.serviceId);
            const svcName = svc?.name || "Room";
            const dateLabel = day.date ? `(${day.date.slice(5).replace("-", "/")})` : "";

            if (day.unitPrice > 0) {
                // Check if pricing mode is PER_PERSON to multiply by people count
                const pricingRecord = svc?.pricing?.find(p => p.interval === day.pricingInterval);
                const isPerPerson = pricingRecord?.pricingMode === "PER_PERSON";
                const qty = isPerPerson ? day.numberOfPeople : 1;
                const total = day.unitPrice * qty;
                lineItems.push({ desc: `${svcName} ${dateLabel}`, unitPrice: day.unitPrice, qty, total });
                subtotal += total;
            }

            for (const addOn of day.addOns) {
                if (addOn.unitPrice > 0 && addOn.quantity > 0) {
                    const total = addOn.unitPrice * addOn.quantity;
                    lineItems.push({ desc: `${addOn.name || "Add-on"} ${dateLabel}`, unitPrice: addOn.unitPrice, qty: addOn.quantity, total });
                    subtotal += total;
                }
            }
        }

        let discount = 0;
        let discountLabel = "";
        if (discountType === "PERCENTAGE" && discountValue > 0) {
            discount = subtotal * (discountValue / 100);
            discountLabel = `Discount (${discountValue}%)`;
        } else if (discountType === "FIXED" && discountValue > 0) {
            discount = Math.min(discountValue, subtotal);
            discountLabel = "Discount (Fixed)";
        } else if (discountType === "PROMO_CODE" && promoValidation?.valid && promoValidation.discountPercent > 0) {
            discount = subtotal * (promoValidation.discountPercent / 100);
            discountLabel = `Promo Code (${promoValidation.discountPercent}%)`;
        }

        const taxable = subtotal - discount;
        const taxRate = subjectToTax ? 16 : 0;
        const tax = taxable * (taxRate / 100);
        const total = taxable + tax;

        return { lineItems, subtotal, discount, discountLabel, taxRate, tax, total };
    }, [days, branchServices, discountType, discountValue, promoValidation, subjectToTax]);

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!customerId) { setError("Please select a customer."); return; }
        if (!branchId) { setError("Please select a branch."); return; }
        for (const day of days) {
            if (!day.serviceId) { setError(`Please select a room for ${day.date}.`); return; }
            if (!day.startTime || !day.endTime) { setError(`Please set times for ${day.date}.`); return; }
        }

        setSubmitting(true);
        try {
            const payload = {
                customerId,
                branchId,
                days: days.map(d => ({
                    date: d.date,
                    startTime: d.startTime,
                    endTime: d.endTime,
                    serviceId: d.serviceId,
                    setupType: d.setupType || undefined,
                    pricingInterval: d.pricingInterval || undefined,
                    unitPrice: d.unitPrice || undefined,
                    numberOfPeople: d.numberOfPeople || undefined,
                    notes: d.notes || undefined,
                    addOns: d.addOns.filter(a => a.vendorAddOnId).map(a => ({
                        vendorAddOnId: a.vendorAddOnId,
                        quantity: a.quantity,
                        serviceTime: a.serviceTime || undefined,
                        comments: a.comments || undefined,
                    })),
                })),
                subjectToTax,
                discountType: discountType === "PROMO_CODE" ? undefined : (discountType !== "NONE" ? discountType : undefined),
                discountValue: discountType !== "NONE" && discountType !== "PROMO_CODE" ? discountValue : undefined,
                promoCode: discountType === "PROMO_CODE" && promoValidation?.valid ? promoCodeInput.trim() : undefined,
                notes: generalNotes || undefined,
            };

            const res = await createVendorBooking(token!, payload);
            setResult(res);
            toast(`${res.bookingIds.length} booking${res.bookingIds.length > 1 ? "s" : ""} created.`, "success");
        } catch (err: any) {
            setError(err.message || "Failed to create booking.");
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

    // Success panel
    if (result) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {result.bookingIds.length > 1 ? `${result.bookingIds.length} Bookings Created` : "Booking Created"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-2">Payment method: Cash (Pending).</p>
                        <div className="mt-3 text-sm">
                            <span className="text-slate-500">Total: </span>
                            <span className="font-bold text-brand-400">{result.financialSummary.total.toFixed(3)} JOD</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                const link = `${window.location.origin}/bookings/${result.bookingIds[0]}`;
                                navigator.clipboard.writeText(link).then(() => { setCopied(true); toast("Link copied.", "success"); setTimeout(() => setCopied(false), 2000); });
                            }}
                            className="w-full rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                        >
                            {copied ? "Copied!" : "Copy Payment Link"}
                        </button>
                        <button onClick={() => {
                                const params = new URLSearchParams({ branchId });
                                if (customerId) params.set("customerId", customerId);
                                router.push(`/vendor/quotations/new?${params}`);
                            }}
                            className="w-full rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors">
                            Create Quotation
                        </button>
                        <button onClick={() => window.print()}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-6 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors">
                            Print
                        </button>
                        <button onClick={() => router.push("/vendor/bookings/overview")}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-6 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors">
                            Go to Bookings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Book for Customer</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create a confirmed booking on behalf of a customer.</p>
                </div>
                <button onClick={() => router.back()}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                    Cancel
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-medium border border-red-500/20">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ============ SECTION 1: Customer ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Customer</h2>
                    <div className="flex gap-3 items-start" ref={customerDropdownRef}>
                        <div className="flex-1 relative">
                            <input type="text" autoComplete="off" value={customerSearch} onChange={(e) => handleCustomerSearchChange(e.target.value)}
                                placeholder="Search by name, email or phone..."
                                className={`${inputCls} pr-10`} />
                            {searchingCustomers && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>}
                            {customerId && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg></div>}
                            {showCustomerDropdown && customerResults.length > 0 && (
                                <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 shadow-lg max-h-60 overflow-y-auto">
                                    {customerResults.map(u => (
                                        <button key={u.id} type="button" onClick={() => selectCustomer(u)}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-dark-750 transition-colors border-b border-slate-200 dark:border-slate-700/50 last:border-b-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name || "Unnamed"}</p>
                                            <p className="text-xs text-slate-500">{u.email || u.phone || ""}</p>
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
                        <button type="button" onClick={() => setShowCreateModal(true)}
                            className="shrink-0 rounded-xl bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-slate-200 dark:hover:bg-dark-800 transition-colors">
                            + New Client
                        </button>
                    </div>
                    {customerInfo && (
                        <div className="mt-3 flex flex-wrap gap-4 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-700 px-4 py-3">
                            <div><p className="text-xs text-slate-500">Type</p><p className="text-sm font-medium text-gray-900 dark:text-white">{customerInfo.entityType === "COMPANY" ? "Company" : "Individual"}</p></div>
                            <div><p className="text-xs text-slate-500">Name</p><p className="text-sm font-medium text-gray-900 dark:text-white">{customerInfo.name || "N/A"}</p></div>
                            <div><p className="text-xs text-slate-500">Email</p><p className="text-sm font-medium text-gray-900 dark:text-white">{customerInfo.email || "N/A"}</p></div>
                            <div><p className="text-xs text-slate-500">Phone</p><p className="text-sm font-medium text-gray-900 dark:text-white">{customerInfo.phone || "N/A"}</p></div>
                            <div>
                                <p className="text-xs text-slate-500">Status</p>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    !customerInfo.customerClassification || customerInfo.customerClassification === "LEVEL_0"
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                }`}>
                                    {!customerInfo.customerClassification || customerInfo.customerClassification === "LEVEL_0" ? "New" : "Verified"}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ============ SECTION 2: Branch ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Branch</h2>
                    <select value={branchId} onChange={e => setBranchId(e.target.value)} required className={selectCls}>
                        <option value="">Select a branch</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name} - {b.city}</option>)}
                    </select>
                </div>

                {/* ============ SECTION 3: Booking Days Table ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Booking Days</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-dark-850 text-left">
                                    <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[130px]">Date</th>
                                    <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[100px]">From</th>
                                    <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[100px]">To</th>
                                    <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[160px]">Room</th>
                                    <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[130px]">Setup</th>
                                    <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[130px]">Pricing</th>
                                    <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[100px] text-right">Unit Price</th>
                                    <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[80px]">People</th>
                                    <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[120px]">Notes</th>
                                    <th className="px-3 py-2 font-medium text-slate-600 dark:text-slate-300 min-w-[100px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {days.map((day) => {
                                    const svc = branchServices.find(s => s.id === day.serviceId);
                                    return (
                                        <tr key={day.id} className="border-t border-slate-200 dark:border-slate-700 align-top">
                                            <td className="px-3 py-2"><input type="date" value={day.date} onChange={e => updateDay(day.id, { date: e.target.value })} className={inputCls} /></td>
                                            <td className="px-3 py-2"><input type="time" value={day.startTime} onChange={e => updateDay(day.id, { startTime: e.target.value })} className={inputCls} /></td>
                                            <td className="px-3 py-2"><input type="time" value={day.endTime} onChange={e => updateDay(day.id, { endTime: e.target.value })} className={inputCls} /></td>
                                            <td className="px-3 py-2">
                                                <select value={day.serviceId} onChange={e => handleServiceChange(day.id, e.target.value)} disabled={!branchId} className={selectCls}>
                                                    <option value="">{branchId ? "Select room" : "Select branch"}</option>
                                                    {branchServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                <select value={day.setupType} onChange={e => updateDay(day.id, { setupType: e.target.value })} disabled={!svc || !["MEETING_ROOM", "EVENT_SPACE"].includes(svc.type) || (svc.setupConfigs || []).length === 0} className={selectCls}>
                                                    <option value="">None</option>
                                                    {(svc?.setupConfigs || []).map(c => <option key={c.setupType} value={c.setupType}>{formatSetupType(c.setupType)}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                <select value={day.pricingInterval} onChange={e => handlePricingChange(day.id, e.target.value, svc)} disabled={!svc} className={selectCls}>
                                                    <option value="">Select</option>
                                                    {(svc?.pricing || []).map(p => <option key={p.interval} value={p.interval}>{p.interval.toLowerCase().replace("_", " ")} ({p.price} JOD)</option>)}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                <input type="number" step="0.001" min="0" value={day.unitPrice || ""} onChange={e => updateDay(day.id, { unitPrice: Number(e.target.value) || 0 })}
                                                    className={`${inputCls} text-right`} />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input type="number" min="1" value={day.numberOfPeople}
                                                    onChange={e => updateDay(day.id, { numberOfPeople: Math.max(1, parseInt(e.target.value) || 1) })}
                                                    disabled={lockedCapacity}
                                                    className={`${inputCls} ${lockedCapacity ? "opacity-60 cursor-not-allowed" : ""}`} />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input type="text" value={day.notes} onChange={e => updateDay(day.id, { notes: e.target.value })}
                                                    placeholder="Comment..."
                                                    className={inputCls} />
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex gap-1">
                                                    <button type="button" onClick={() => addAddOn(day.id)} title="Add add-on"
                                                        className="rounded-lg px-2 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-500/10 transition-colors">
                                                        +Add
                                                    </button>
                                                    <button type="button" onClick={() => removeDay(day.id)} disabled={days.length <= 1} title="Remove day"
                                                        className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30">
                                                        Del
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Add-ons sub-rows */}
                    {days.filter(d => d.addOns.length > 0).map(day => (
                        <div key={`addons-${day.id}`} className="mt-3 ml-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-dark-850 p-4">
                            <p className="text-xs font-bold text-slate-500 mb-2">Add-ons for {day.date}</p>
                            {day.addOns.map(addOn => (
                                <div key={addOn.id} className="flex gap-2 items-center mb-2">
                                    <select value={addOn.vendorAddOnId} onChange={e => selectAddOnFromCatalog(day.id, addOn.id, e.target.value)}
                                        className={`${selectCls} flex-1`}>
                                        <option value="">Select add-on</option>
                                        {vendorAddOns.map(a => <option key={a.id} value={a.id}>{a.name} ({a.unitPrice.toFixed(3)} JOD)</option>)}
                                    </select>
                                    <input type="number" min="1" value={addOn.quantity} onChange={e => updateAddOn(day.id, addOn.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                        className={`${inputCls} w-20`} placeholder="Qty" />
                                    <span className="text-xs text-slate-500 w-24 text-right">{(addOn.unitPrice * addOn.quantity).toFixed(3)} JOD</span>
                                    <button type="button" onClick={() => removeAddOn(day.id, addOn.id)} className="text-red-400 hover:text-red-300 p-1">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}

                    <button type="button" onClick={addDay}
                        className="mt-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 px-5 py-2.5 text-sm font-bold text-slate-500 hover:border-brand-500 hover:text-brand-500 transition-colors w-full">
                        + ADD DAY
                    </button>
                </div>

                {/* ============ SECTION 4: Tax & Discount ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Tax & Discount</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Subject to Sales Tax</label>
                            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-fit">
                                <button type="button" onClick={() => setSubjectToTax(true)}
                                    className={`px-5 py-2 text-sm font-medium transition-colors ${subjectToTax ? "bg-brand-500 text-white" : "bg-white dark:bg-dark-850 text-gray-700 dark:text-slate-300"}`}>
                                    Yes (16%)
                                </button>
                                <button type="button" onClick={() => setSubjectToTax(false)}
                                    className={`px-5 py-2 text-sm font-medium transition-colors ${!subjectToTax ? "bg-brand-500 text-white" : "bg-white dark:bg-dark-850 text-gray-700 dark:text-slate-300"}`}>
                                    No
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Discount Type</label>
                            <select value={discountType} onChange={e => { setDiscountType(e.target.value); setDiscountValue(0); setPromoValidation(null); setPromoCodeInput(""); }} className={selectCls}>
                                <option value="NONE">None</option>
                                <option value="PERCENTAGE">Percentage</option>
                                <option value="FIXED">Fixed Amount</option>
                                <option value="PROMO_CODE">Promo Code</option>
                            </select>
                        </div>
                        {discountType === "PERCENTAGE" && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Discount (%)</label>
                                <input type="number" min="0" max="100" step="0.1" value={discountValue || ""} onChange={e => setDiscountValue(Number(e.target.value) || 0)} className={inputCls} />
                            </div>
                        )}
                        {discountType === "FIXED" && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Discount Amount (JOD)</label>
                                <input type="number" min="0" step="0.001" value={discountValue || ""} onChange={e => setDiscountValue(Number(e.target.value) || 0)} className={inputCls} />
                            </div>
                        )}
                        {discountType === "PROMO_CODE" && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Promo Code</label>
                                <div className="flex gap-2">
                                    <input type="text" value={promoCodeInput} onChange={e => { setPromoCodeInput(e.target.value); setPromoValidation(null); }} placeholder="Enter code" className={`${inputCls} flex-1`} />
                                    <button type="button" onClick={handleValidatePromo} disabled={validatingPromo || !promoCodeInput.trim()}
                                        className="shrink-0 rounded-xl bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-slate-200 dark:hover:bg-dark-800 disabled:opacity-50 transition-colors">
                                        {validatingPromo ? "..." : "Validate"}
                                    </button>
                                </div>
                                {promoValidation && (
                                    <p className={`mt-1 text-xs font-medium ${promoValidation.valid ? "text-green-400" : "text-red-400"}`}>
                                        {promoValidation.message}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ============ SECTION 5: Notes ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Notes</h2>
                    <textarea value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} rows={2} placeholder="General notes..."
                        className={`${inputCls} resize-none`} />
                </div>

                {/* ============ SECTION 6: Financial Overview ============ */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Financial Overview</h2>
                    {financial.lineItems.length > 0 ? (
                        <>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-dark-850 text-left">
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 w-8">#</th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300">Item Description</th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">Unit Price</th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">Qty</th>
                                            <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {financial.lineItems.map((item, i) => (
                                            <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                                                <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                                                <td className="px-4 py-2 text-gray-900 dark:text-white">{item.desc}</td>
                                                <td className="px-4 py-2 text-gray-900 dark:text-white text-right">{item.unitPrice.toFixed(3)}</td>
                                                <td className="px-4 py-2 text-gray-900 dark:text-white text-right">{item.qty}</td>
                                                <td className="px-4 py-2 text-gray-900 dark:text-white text-right">{item.total.toFixed(3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-4 ml-auto max-w-xs space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{financial.subtotal.toFixed(3)} JOD</span>
                                </div>
                                {financial.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-400">{financial.discountLabel}</span>
                                        <span className="font-medium text-red-400">-{financial.discount.toFixed(3)} JOD</span>
                                    </div>
                                )}
                                {financial.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Sales Tax ({financial.taxRate}%)</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{financial.tax.toFixed(3)} JOD</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-base font-bold border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                    <span className="text-gray-900 dark:text-white">Total</span>
                                    <span className="text-brand-400">{financial.total.toFixed(3)} JOD</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500">Add rooms and pricing to see the financial breakdown.</p>
                    )}
                </div>

                {/* ============ Submit ============ */}
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => router.back()}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-6 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                        className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-all disabled:opacity-50 shadow-[0_4px_12px_rgba(255,91,4,0.3)]">
                        {submitting ? "Creating..." : "Create Booking"}
                    </button>
                </div>
            </form>

            <CreateCustomerModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                token={token!}
                onCreated={(customer) => {
                    selectCustomer(customer);
                    setShowCreateModal(false);
                    toast(customer.isNew ? "Customer created." : "Existing customer found.", "success");
                }}
            />
        </div>
    );
}
