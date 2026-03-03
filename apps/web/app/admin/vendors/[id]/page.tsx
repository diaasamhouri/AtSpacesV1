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
            <div className="rounded-2xl bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
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
                <div className="rounded-2xl bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800 space-y-6">
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
                                        className="block w-full rounded-xl border border-orange-500/30 bg-dark-900 pl-4 pr-10 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
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
                <div className="rounded-2xl bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
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

            {/* Branches List */}
            {vendor.branches.length > 0 && (
                <div className="rounded-2xl bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Branches ({vendor.branches.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {vendor.branches.map((b) => (
                            <Link
                                key={b.id}
                                href={`/admin/branches/${b.id}`}
                                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-850 p-4 hover:border-brand-500/50 transition-all group"
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
                    <div className="w-full max-w-md rounded-3xl bg-dark-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reject Vendor</h3>
                        <p className="text-sm font-medium text-slate-500 mb-6">Provide a reason. The vendor will see this.</p>
                        <textarea
                            rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                            className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-dark-850 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none"
                            placeholder="e.g. Photos do not meet requirements..." autoFocus
                        />
                        <div className="mt-6 flex justify-end gap-4">
                            <button onClick={() => setRejectModalOpen(false)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white bg-dark-850 hover:bg-dark-800 transition-colors">Cancel</button>
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
