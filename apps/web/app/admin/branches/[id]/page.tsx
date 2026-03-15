"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { useToast } from "../../../components/ui/toast-provider";
import { getAdminBranchById, updateBranchStatus } from "../../../../lib/admin";
import { format } from "date-fns";
import { formatCity, formatServiceType, formatPricingMode } from "../../../../lib/format";
import { getAvailablePricingModes } from "../../../../lib/types";
import StatusBadge from "../../../components/ui/status-badge";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { AdminBranchDetail } from "../../../../lib/types";

const MapDisplay = dynamic(() => import("../../../components/map-display"), { ssr: false });

export default function AdminBranchDetailPage() {
    const { id } = useParams() as { id: string };
    const { token } = useAuth();
    const { toast } = useToast();

    const [branch, setBranch] = useState<AdminBranchDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        getAdminBranchById(token, id)
            .then((data) => { setBranch(data); setLoading(false); })
            .catch((err) => { setError(err.message || "Failed to load branch."); setLoading(false); });
    }, [token, id]);

    const handleStatusChange = async (newStatus: string) => {
        if (!token || !branch) return;
        try {
            await updateBranchStatus(token, branch.id, newStatus);
            setBranch({ ...branch, status: newStatus as AdminBranchDetail["status"] });
            toast(`Branch status updated.`, "success");
        } catch { toast("Failed to update branch.", "error"); }
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

    if (error || !branch) {
        return <div className="p-8 text-center text-red-500">{error || "Branch not found."}</div>;
    }

    return (
        <div className="space-y-6">
            <Link href="/admin/branches" className="inline-flex items-center gap-2 text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
                Back to Branches
            </Link>

            {/* Header */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{branch.name}</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{branch.address}, {formatCity(branch.city)}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Vendor: <span className="font-bold text-gray-900 dark:text-white">{branch.vendor.companyName}</span>
                        </p>
                    </div>
                    <StatusBadge status={branch.status} size="md" />
                </div>

                {/* Contact info */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                    {branch.phone && <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> {branch.phone}</span>}
                    {branch.email && <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg> {branch.email}</span>}
                    <span className="text-xs text-slate-500">Auto-accept: {branch.autoAcceptBookings ? "On" : "Off"}</span>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                    {branch.status === "ACTIVE" && (
                        <button onClick={() => { setConfirmAction("SUSPENDED"); setConfirmOpen(true); }} className="rounded-xl bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Suspend</button>
                    )}
                    {branch.status === "SUSPENDED" && (
                        <button onClick={() => { setConfirmAction("ACTIVE"); setConfirmOpen(true); }} className="rounded-xl bg-green-500/10 px-5 py-2.5 text-sm font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Reactivate</button>
                    )}
                    {branch.status === "UNDER_REVIEW" && (
                        <>
                            <button onClick={() => { setConfirmAction("ACTIVE"); setConfirmOpen(true); }} className="rounded-xl bg-green-500/10 px-5 py-2.5 text-sm font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Approve</button>
                            <button onClick={() => { setConfirmAction("SUSPENDED"); setConfirmOpen(true); }} className="rounded-xl bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Suspend</button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map */}
                {branch.latitude && branch.longitude && (
                    <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800 lg:col-span-2">
                        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Location</h2>
                        {branch.googleMapsUrl && (
                            <a href={branch.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-500 hover:text-brand-400 font-bold mb-4 inline-flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> View on Google Maps
                            </a>
                        )}
                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0">
                            <MapDisplay lat={branch.latitude} lng={branch.longitude} name={branch.name} height="240px" />
                        </div>
                    </div>
                )}

                {/* Operating Hours */}
                {branch.operatingHours && Object.keys(branch.operatingHours).length > 0 && (
                    <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Operating Hours</h2>
                        <div className="space-y-2">
                            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                                const h = branch.operatingHours![day];
                                return (
                                    <div key={day} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-dark-850 px-4 py-2.5 border border-slate-200 dark:border-slate-700">
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 capitalize">{day}</span>
                                        <span className="text-sm font-medium text-brand-400">{h ? `${h.open} – ${h.close}` : "Closed"}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Amenities */}
                {branch.amenities && branch.amenities.length > 0 && (
                    <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Amenities</h2>
                        <div className="flex flex-wrap gap-2">
                            {branch.amenities.map((a) => (
                                <span key={a} className="inline-flex rounded-full bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">{a}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Services */}
            {branch.services && branch.services.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Services ({branch.services.length})</h2>
                    <div className="space-y-4">
                        {branch.services.map((svc) => (
                            <div key={svc.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-dark-850">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{svc.name}</span>
                                    <span className="rounded-md bg-brand-500/10 border border-brand-500/20 px-2 py-1 text-[10px] font-bold text-brand-400 tracking-wider">{formatServiceType(svc.type)}</span>
                                    <span className="text-xs text-slate-500 font-medium">Cap: {svc.capacity}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
                                    {getAvailablePricingModes(svc).map(m => (
                                        <span key={m.mode} className="flex items-baseline gap-1">
                                            <span className="text-gray-900 dark:text-white font-bold">{svc.currency || 'JOD'} {m.price.toFixed(2)}</span>
                                            {m.mode !== 'PER_BOOKING' && (
                                                <span className="text-xs text-slate-500">({formatPricingMode(m.mode)})</span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
                onConfirm={() => confirmAction && handleStatusChange(confirmAction)}
                title="Update Branch Status"
                message={`Are you sure you want to ${confirmAction === "SUSPENDED" ? "suspend" : "activate"} this branch?`}
                confirmLabel={confirmAction === "SUSPENDED" ? "Suspend" : "Activate"}
                variant={confirmAction === "SUSPENDED" ? "danger" : "default"}
            />
        </div>
    );
}
