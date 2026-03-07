"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { useToast } from "../../../components/ui/toast-provider";
import { getAdminVendorById, updateVendorStatus, verifyVendor, updateVendorCommission } from "../../../../lib/admin";
import { format } from "date-fns";
import { formatCity } from "../../../../lib/format";
import StatusBadge from "../../../components/ui/status-badge";
import { VerifiedBadge } from "../../../components/verified-badge";
import ImageLightbox from "../../../components/ui/image-lightbox";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";
import Link from "next/link";
import type { AdminVendorDetail } from "../../../../lib/types";

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-2xl bg-white dark:bg-dark-900 shadow-float border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-100 dark:hover:bg-dark-850 transition-colors">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h2>
                <svg className={`h-5 w-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            {open && <div className="px-6 pb-6">{children}</div>}
        </div>
    );
}

function maskString(val: string | null): string {
    if (!val || val.length <= 4) return val || "\u2014";
    return "\u2022".repeat(val.length - 4) + val.slice(-4);
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminVendorDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { token, user } = useAuth();
    const { toast } = useToast();

    const [vendor, setVendor] = useState<AdminVendorDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Lightbox
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Rejection modal
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // Confirm dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        getAdminVendorById(token, id)
            .then((data) => { setVendor(data); setLoading(false); })
            .catch((err) => { setError(err.message || "Failed to load vendor."); setLoading(false); });
    }, [token, id]);

    const handleStatusChange = async (newStatus: "APPROVED" | "REJECTED" | "SUSPENDED", reason?: string) => {
        if (!token || !vendor) return;
        try {
            await updateVendorStatus(token, vendor.id, newStatus, reason);
            setVendor({ ...vendor, status: newStatus, rejectionReason: reason || null });
            toast(`Vendor ${newStatus.toLowerCase()}.`, "success");
        } catch { toast("Failed to update status.", "error"); }
    };

    const handleVerify = async () => {
        if (!token || !vendor) return;
        try {
            await verifyVendor(token, vendor.id, !vendor.isVerified);
            setVendor({ ...vendor, isVerified: !vendor.isVerified });
        } catch { toast("Failed to update verification.", "error"); }
    };

    const handleConfirmAction = () => {
        if (confirmAction === "approve") handleStatusChange("APPROVED");
        else if (confirmAction === "suspend") handleStatusChange("SUSPENDED");
        else if (confirmAction === "reactivate") handleStatusChange("APPROVED");
        setConfirmOpen(false);
        setConfirmAction(null);
    };

    const confirmReject = () => {
        if (!rejectReason.trim()) return;
        handleStatusChange("REJECTED", rejectReason.trim());
        setRejectModalOpen(false);
        setRejectReason("");
    };

    const CONFIRM_LABELS: Record<string, { title: string; message: string; label: string; variant: "danger" | "warning" | "default" }> = {
        approve: { title: "Approve Vendor", message: "Are you sure you want to approve this vendor?", label: "Approve", variant: "default" },
        suspend: { title: "Suspend Vendor", message: "Are you sure you want to suspend this vendor?", label: "Suspend", variant: "danger" },
        reactivate: { title: "Reactivate Vendor", message: "Are you sure you want to reactivate this vendor?", label: "Reactivate", variant: "default" },
    };
    const currentConfirm = confirmAction ? CONFIRM_LABELS[confirmAction] : null;

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    if (error || !vendor) {
        return <div className="p-8 text-center text-red-500">{error || "Vendor not found."}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Back link */}
            <Link href="/admin/vendors" className="inline-flex items-center gap-2 text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
                Back to Vendors
            </Link>

            {/* Header */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{vendor.companyName}</h1>
                            {vendor.isVerified && <VerifiedBadge size="sm" />}
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Owned by {vendor.owner?.name || "Unknown"} &middot; {vendor.owner?.email}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Joined {format(new Date(vendor.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <StatusBadge status={vendor.status} size="md" />
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                    {vendor.status === "PENDING_APPROVAL" && (
                        <>
                            <button onClick={() => { setConfirmAction("approve"); setConfirmOpen(true); }} className="rounded-xl bg-green-500/10 px-5 py-2.5 text-sm font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Approve</button>
                            <button onClick={() => { setRejectModalOpen(true); setRejectReason(""); }} className="rounded-xl bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Reject</button>
                        </>
                    )}
                    {vendor.status === "APPROVED" && (
                        <>
                            <button onClick={handleVerify} className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${vendor.isVerified ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20" : "bg-slate-500/10 text-slate-500 border border-slate-500/20 hover:bg-slate-500/20"}`}>
                                {vendor.isVerified ? "Remove Verify" : "Verify"}
                            </button>
                            <button onClick={() => { setConfirmAction("suspend"); setConfirmOpen(true); }} className="rounded-xl bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Suspend</button>
                        </>
                    )}
                    {(vendor.status === "SUSPENDED" || vendor.status === "REJECTED") && (
                        <button onClick={() => { setConfirmAction("reactivate"); setConfirmOpen(true); }} className="rounded-xl bg-green-500/10 px-5 py-2.5 text-sm font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Reactivate</button>
                    )}
                </div>
            </div>

            {/* Application Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800 space-y-6">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Application Details</h2>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        {vendor.phone && (<><dt className="text-slate-500 font-medium">Phone</dt><dd className="text-gray-900 dark:text-white font-medium">{vendor.phone}</dd></>)}
                        {vendor.website && (<><dt className="text-slate-500 font-medium">Website</dt><dd className="text-brand-500 truncate font-medium"><a href={vendor.website} target="_blank" rel="noopener noreferrer">{vendor.website}</a></dd></>)}
                        <dt className="text-slate-500 font-medium">Branches</dt><dd className="text-gray-900 dark:text-white font-bold">{vendor.branches.length}</dd>
                    </dl>

                    {vendor.description && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h3>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{vendor.description}</p>
                        </div>
                    )}

                    {vendor.rejectionReason && (
                        <div className="rounded-2xl bg-red-500/10 p-5 border border-red-500/20">
                            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Rejection Reason</h3>
                            <p className="text-sm font-medium text-red-400">{vendor.rejectionReason}</p>
                        </div>
                    )}

                    {/* Commission Rate */}
                    {user?.role === "ADMIN" && (
                        <div className="rounded-2xl bg-orange-500/10 p-5 border border-orange-500/20">
                            <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Commission Rate</h3>
                            <div className="flex items-center gap-4">
                                <div className="relative w-40">
                                    <input
                                        type="number" min="0" max="100" placeholder="Default"
                                        defaultValue={vendor.commissionRate ?? ""}
                                        onBlur={(e) => {
                                            const val = e.target.value;
                                            const rate = val === "" ? null : parseFloat(val);
                                            if (rate !== null && (rate < 0 || rate > 100)) {
                                                toast("Rate must be between 0 and 100", "error");
                                                return;
                                            }
                                            updateVendorCommission(token!, vendor.id, rate)
                                                .then(() => toast(`Commission updated to ${rate === null ? "Default" : rate + "%"}`, "success"))
                                                .catch(() => toast("Failed to update.", "error"));
                                        }}
                                        className="block w-full rounded-xl border border-orange-500/30 bg-white dark:bg-dark-900 pl-4 pr-10 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                        <span className="text-slate-500 text-sm font-bold">%</span>
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-orange-400">Empty = global default</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Photos */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Space Photos</h2>
                    {vendor.images && vendor.images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {vendor.images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img.startsWith("/") ? `${API}${img}` : img}
                                    alt={`Photo ${i + 1}`}
                                    className="rounded-2xl h-36 w-full object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-all shadow-sm"
                                    onClick={() => { setLightboxImages(vendor.images); setLightboxIndex(i); setLightboxOpen(true); }}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm font-medium text-slate-500 italic py-8 text-center">No images uploaded.</p>
                    )}
                </div>
            </div>

            {/* Company Legal Information */}
            {(vendor.companyLegalName || vendor.companyNationalId || vendor.companyRegistrationNumber || vendor.companyDescription) && (
                <CollapsibleSection title="Company Legal Information">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        {vendor.companyLegalName && (<><dt className="text-slate-500 font-medium">Legal Name</dt><dd className="text-gray-900 dark:text-white font-medium">{vendor.companyLegalName}</dd></>)}
                        {vendor.companyShortName && (<><dt className="text-slate-500 font-medium">Short Name</dt><dd className="text-gray-900 dark:text-white font-medium">{vendor.companyShortName}</dd></>)}
                        {vendor.companyTradeName && (<><dt className="text-slate-500 font-medium">Trade Name</dt><dd className="text-gray-900 dark:text-white font-medium">{vendor.companyTradeName}</dd></>)}
                        {vendor.companyNationalId && (<><dt className="text-slate-500 font-medium">National ID</dt><dd className="text-gray-900 dark:text-white font-medium">{vendor.companyNationalId}</dd></>)}
                        {vendor.companyRegistrationNumber && (<><dt className="text-slate-500 font-medium">Registration Number</dt><dd className="text-gray-900 dark:text-white font-medium">{vendor.companyRegistrationNumber}</dd></>)}
                        {vendor.companyRegistrationDate && (<><dt className="text-slate-500 font-medium">Registration Date</dt><dd className="text-gray-900 dark:text-white font-medium">{format(new Date(vendor.companyRegistrationDate), "MMM d, yyyy")}</dd></>)}
                        {vendor.companySalesTaxNumber && (<><dt className="text-slate-500 font-medium">Sales Tax Number</dt><dd className="text-gray-900 dark:text-white font-medium">{vendor.companySalesTaxNumber}</dd></>)}
                        {vendor.registeredInCountry && (<><dt className="text-slate-500 font-medium">Registered In</dt><dd className="text-gray-900 dark:text-white font-medium">{vendor.registeredInCountry}</dd></>)}
                        <dt className="text-slate-500 font-medium">Tax Exemption</dt>
                        <dd><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${vendor.hasTaxExemption ? "bg-green-500/10 text-green-500" : "bg-slate-500/10 text-slate-400"}`}>{vendor.hasTaxExemption ? "Yes" : "No"}</span></dd>
                    </dl>
                    {vendor.companyDescription && (
                        <div className="mt-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Company Description</h3>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{vendor.companyDescription}</p>
                        </div>
                    )}
                </CollapsibleSection>
            )}

            {/* Verification Info */}
            {(vendor.verificationRequestedAt || vendor.verifiedAt || vendor.verificationNote) && (
                <div className="rounded-2xl bg-blue-500/10 p-6 border border-blue-500/20">
                    <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Verification Info</h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        {vendor.verificationRequestedAt && (<><dt className="text-blue-600/70 dark:text-blue-300/70 font-medium">Requested At</dt><dd className="text-gray-900 dark:text-white font-medium">{format(new Date(vendor.verificationRequestedAt), "MMM d, yyyy 'at' h:mm a")}</dd></>)}
                        {vendor.verifiedAt && (<><dt className="text-blue-600/70 dark:text-blue-300/70 font-medium">Verified At</dt><dd className="text-gray-900 dark:text-white font-medium">{format(new Date(vendor.verifiedAt), "MMM d, yyyy 'at' h:mm a")}</dd></>)}
                        {vendor.verificationNote && (<><dt className="text-blue-600/70 dark:text-blue-300/70 font-medium">Note</dt><dd className="text-gray-900 dark:text-white font-medium">{vendor.verificationNote}</dd></>)}
                    </dl>
                </div>
            )}

            {/* Social Links */}
            {vendor.socialLinks && Object.keys(vendor.socialLinks).length > 0 && (
                <CollapsibleSection title="Social Links">
                    <ul className="space-y-2">
                        {Object.entries(vendor.socialLinks).map(([platform, url]) => (
                            <li key={platform} className="flex items-center gap-3 text-sm">
                                <span className="text-slate-500 font-medium capitalize min-w-[100px]">{platform}</span>
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-400 truncate font-medium transition-colors">{url}</a>
                            </li>
                        ))}
                    </ul>
                </CollapsibleSection>
            )}

            {/* Authorized Signatories */}
            {vendor.authorizedSignatories && vendor.authorizedSignatories.length > 0 && (
                <CollapsibleSection title={`Authorized Signatories (${vendor.authorizedSignatories.length})`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vendor.authorizedSignatories.map((s) => (
                            <div key={s.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 p-4 space-y-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{s.fullName}</h4>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                    {s.nationality && (<><dt className="text-slate-500">Nationality</dt><dd className="text-slate-600 dark:text-slate-300">{s.nationality}</dd></>)}
                                    {s.legalDocType && (<><dt className="text-slate-500">Doc Type</dt><dd className="text-slate-600 dark:text-slate-300">{s.legalDocType.replace(/_/g, " ")}</dd></>)}
                                    {s.legalDocNumber && (<><dt className="text-slate-500">Doc Number</dt><dd className="text-slate-600 dark:text-slate-300">{s.legalDocNumber}</dd></>)}
                                    {s.mobile && (<><dt className="text-slate-500">Mobile</dt><dd className="text-slate-600 dark:text-slate-300">{s.mobile}</dd></>)}
                                    {s.email && (<><dt className="text-slate-500">Email</dt><dd className="text-slate-600 dark:text-slate-300">{s.email}</dd></>)}
                                    {s.gender && (<><dt className="text-slate-500">Gender</dt><dd className="text-slate-600 dark:text-slate-300">{s.gender}</dd></>)}
                                </dl>
                                {s.idFileUrl && (
                                    <a href={s.idFileUrl.startsWith("/") ? `${API}${s.idFileUrl}` : s.idFileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">
                                        View ID Document
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Company Contacts */}
            {vendor.companyContacts && vendor.companyContacts.length > 0 && (
                <CollapsibleSection title={`Company Contacts (${vendor.companyContacts.length})`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vendor.companyContacts.map((c) => (
                            <div key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 p-4 space-y-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{c.contactPersonName || "Contact"}</h4>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                    {c.mobile && (<><dt className="text-slate-500">Mobile</dt><dd className="text-slate-600 dark:text-slate-300">{c.mobile}</dd></>)}
                                    {c.email && (<><dt className="text-slate-500">Email</dt><dd className="text-slate-600 dark:text-slate-300">{c.email}</dd></>)}
                                    {c.phone && (<><dt className="text-slate-500">Phone</dt><dd className="text-slate-600 dark:text-slate-300">{c.phone}</dd></>)}
                                    {c.fax && (<><dt className="text-slate-500">Fax</dt><dd className="text-slate-600 dark:text-slate-300">{c.fax}</dd></>)}
                                    {c.website && (<><dt className="text-slate-500">Website</dt><dd className="text-brand-500 truncate"><a href={c.website} target="_blank" rel="noopener noreferrer">{c.website}</a></dd></>)}
                                </dl>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Department Contacts */}
            {vendor.departmentContacts && vendor.departmentContacts.length > 0 && (
                <CollapsibleSection title={`Department Contacts (${vendor.departmentContacts.length})`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vendor.departmentContacts.map((dc) => (
                            <div key={dc.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 p-4 space-y-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{dc.department.replace(/_/g, " ")}</h4>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                    {dc.contactName && (<><dt className="text-slate-500">Contact</dt><dd className="text-slate-600 dark:text-slate-300">{dc.contactName}</dd></>)}
                                    {dc.mobile && (<><dt className="text-slate-500">Mobile</dt><dd className="text-slate-600 dark:text-slate-300">{dc.mobile}</dd></>)}
                                    {dc.phone && (<><dt className="text-slate-500">Phone</dt><dd className="text-slate-600 dark:text-slate-300">{dc.phone}</dd></>)}
                                    {dc.email && (<><dt className="text-slate-500">Email</dt><dd className="text-slate-600 dark:text-slate-300">{dc.email}</dd></>)}
                                    {dc.fax && (<><dt className="text-slate-500">Fax</dt><dd className="text-slate-600 dark:text-slate-300">{dc.fax}</dd></>)}
                                </dl>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Banking Information */}
            {vendor.bankingInfo && vendor.bankingInfo.length > 0 && (
                <CollapsibleSection title={`Banking Information (${vendor.bankingInfo.length})`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vendor.bankingInfo.map((bi) => (
                            <div key={bi.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 p-4 space-y-2">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{bi.bankName || "Bank Account"}</h4>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                    {bi.bankBranch && (<><dt className="text-slate-500">Branch</dt><dd className="text-slate-600 dark:text-slate-300">{bi.bankBranch}</dd></>)}
                                    {bi.accountNumber && (<><dt className="text-slate-500">Account #</dt><dd className="text-slate-600 dark:text-slate-300 font-mono">{maskString(bi.accountNumber)}</dd></>)}
                                    {bi.iban && (<><dt className="text-slate-500">IBAN</dt><dd className="text-slate-600 dark:text-slate-300 font-mono">{maskString(bi.iban)}</dd></>)}
                                    {bi.swiftCode && (<><dt className="text-slate-500">SWIFT</dt><dd className="text-slate-600 dark:text-slate-300">{bi.swiftCode}</dd></>)}
                                    {bi.accountantManagerName && (<><dt className="text-slate-500">Accountant</dt><dd className="text-slate-600 dark:text-slate-300">{bi.accountantManagerName}</dd></>)}
                                    {bi.cliq && (<><dt className="text-slate-500">CliQ</dt><dd className="text-slate-600 dark:text-slate-300">{bi.cliq}</dd></>)}
                                </dl>
                                {bi.signatureUrl && (
                                    <a href={bi.signatureUrl.startsWith("/") ? `${API}${bi.signatureUrl}` : bi.signatureUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">
                                        View Signature
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Branches List */}
            {vendor.branches.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Branches ({vendor.branches.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {vendor.branches.map((b) => (
                            <Link
                                key={b.id}
                                href={`/admin/branches/${b.id}`}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 p-4 hover:border-brand-500/50 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">{b.name}</h3>
                                    <StatusBadge status={b.status} />
                                </div>
                                <p className="text-xs text-slate-500 mb-2">{b.address}, {formatCity(b.city)}</p>
                                <div className="flex gap-4 text-xs font-medium text-slate-500">
                                    <span>{b.servicesCount} services</span>
                                    <span>{b.bookingsCount} bookings</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRejectModalOpen(false)}>
                    <div className="w-full max-w-md rounded-3xl bg-white dark:bg-dark-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reject Vendor</h3>
                        <p className="text-sm font-medium text-slate-500 mb-6">Provide a reason. The vendor will see this.</p>
                        <textarea
                            rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                            className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-850 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none"
                            placeholder="e.g. Photos do not meet requirements..." autoFocus
                        />
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={() => setRejectModalOpen(false)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors">Cancel</button>
                            <button onClick={confirmReject} disabled={!rejectReason.trim()} className="rounded-xl px-6 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">Reject</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
                onConfirm={handleConfirmAction}
                title={currentConfirm?.title || "Confirm"}
                message={currentConfirm?.message || "Are you sure?"}
                confirmLabel={currentConfirm?.label || "Confirm"}
                variant={currentConfirm?.variant || "default"}
            />

            {lightboxOpen && lightboxImages.length > 0 && (
                <ImageLightbox
                    images={lightboxImages}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                    onNavigate={(i) => setLightboxIndex(i)}
                    apiBase={API}
                />
            )}
        </div>
    );
}
