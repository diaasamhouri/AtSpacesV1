"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAdminVendors, updateVendorStatus, getPendingVerifications, verifyVendor } from "../../../lib/admin";
import { VerifiedBadge } from "../../components/verified-badge";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { format } from "date-fns";
import StatusBadge from "../../components/ui/status-badge";
import { Pagination } from "../../components/pagination";
import { SearchBar } from "../../components/search-bar";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { PaginationMeta, AdminVendor, PendingVerification } from "../../../lib/types";

export default function AdminVendorsReview() {
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<"all" | "verifications">("all");
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [verificationsMeta, setVerificationsMeta] = useState<PaginationMeta | null>(null);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verificationCount, setVerificationCount] = useState(0);

  // Verification deny modal
  const [denyTarget, setDenyTarget] = useState<string | null>(null);
  const [denyNote, setDenyNote] = useState("");

  // Rejection modal
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null);

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  const loadVendors = useCallback(() => {
    if (!token) return;
    setLoading(true);
    getAdminVendors(token, { page, search: search || undefined })
      .then((res) => { setVendors(res.data); setMeta(res.meta); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token, page, search]);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  // Load verification count on mount
  useEffect(() => {
    if (!token) return;
    getPendingVerifications(token, { page: 1, limit: 1 })
      .then((res) => setVerificationCount(res.meta.total))
      .catch(() => {});
  }, [token]);

  const loadVerifications = useCallback(() => {
    if (!token) return;
    setVerificationsLoading(true);
    getPendingVerifications(token, { page: 1, limit: 50 })
      .then((res) => { setVerifications(res.data); setVerificationsMeta(res.meta); setVerificationCount(res.meta.total); setVerificationsLoading(false); })
      .catch(() => setVerificationsLoading(false));
  }, [token]);

  useEffect(() => {
    if (activeTab === "verifications") loadVerifications();
  }, [activeTab, loadVerifications]);

  const handleVerify = async (id: string) => {
    if (!token) return;
    try {
      await verifyVendor(token, id, true);
      setVerifications((prev) => prev.filter((v) => v.id !== id));
      setVerificationCount((c) => Math.max(0, c - 1));
      toast("Vendor verified.", "success");
    } catch { toast("Failed to verify vendor.", "error"); }
  };

  const handleDeny = async (id: string, note: string) => {
    if (!token) return;
    try {
      await verifyVendor(token, id, false, note || undefined);
      setVerifications((prev) => prev.filter((v) => v.id !== id));
      setVerificationCount((c) => Math.max(0, c - 1));
      toast("Verification denied.", "success");
    } catch { toast("Failed to deny verification.", "error"); }
  };

  const handleStatusChange = async (id: string, newStatus: "APPROVED" | "REJECTED" | "SUSPENDED", reason?: string) => {
    if (!token) return;
    try {
      await updateVendorStatus(token, id, newStatus, reason);
      setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, status: newStatus, rejectionReason: reason || null } : v)));
    } catch { toast("Failed to update status.", "error"); }
  };

  const confirmReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    handleStatusChange(rejectTarget, "REJECTED", rejectReason.trim());
    setRejectTarget(null);
    setRejectReason("");
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.action === "approve") handleStatusChange(confirmAction.id, "APPROVED");
    else if (confirmAction.action === "suspend") handleStatusChange(confirmAction.id, "SUSPENDED");
    else if (confirmAction.action === "reactivate") handleStatusChange(confirmAction.id, "APPROVED");
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const CONFIRM_LABELS: Record<string, { title: string; message: string; label: string; variant: "danger" | "warning" | "default" }> = {
    approve: { title: "Approve Vendor", message: "Are you sure you want to approve this vendor?", label: "Approve", variant: "default" },
    suspend: { title: "Suspend Vendor", message: "Are you sure you want to suspend this vendor?", label: "Suspend", variant: "danger" },
    reactivate: { title: "Reactivate Vendor", message: "Are you sure you want to reactivate this vendor?", label: "Reactivate", variant: "default" },
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const currentConfirm = confirmAction ? CONFIRM_LABELS[confirmAction.action] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vendors Review</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-dark-850 p-1 border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${activeTab === "all" ? "bg-brand-500 text-white shadow-sm" : "text-slate-400 hover:text-gray-900 dark:hover:text-white"}`}
        >
          All Vendors
        </button>
        <button
          onClick={() => setActiveTab("verifications")}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === "verifications" ? "bg-brand-500 text-white shadow-sm" : "text-slate-400 hover:text-gray-900 dark:hover:text-white"}`}
        >
          Verification Requests
          {verificationCount > 0 && (
            <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold min-w-[20px] ${activeTab === "verifications" ? "bg-white/20 text-white" : "bg-brand-500 text-white"}`}>
              {verificationCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "verifications" ? (
        /* Verification Requests Tab */
        verificationsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : verifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 p-12 text-center">
            <p className="text-sm font-medium text-slate-500">No pending verification requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {verifications.map((v) => (
              <div key={v.id} className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-5 shadow-float">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{v.companyName}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{v.owner?.name} &middot; {v.owner?.email}</p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                {v.verificationRequestedAt && (
                  <p className="text-xs text-slate-500 mb-4">
                    Requested {format(new Date(v.verificationRequestedAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleVerify(v.id)}
                    className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => { setDenyTarget(v.id); setDenyNote(""); }}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => router.push(`/admin/vendors/${v.id}`)}
                    className="rounded-lg bg-slate-500/10 px-3 py-1.5 text-xs font-bold text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-colors ml-auto"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* All Vendors Tab */
        <>
      <SearchBar defaultValue={search} placeholder="Search by company, owner name or email..." />

      {vendors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 p-12 text-center">
          <p className="text-sm font-medium text-slate-500">No vendor profiles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
              className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-5 shadow-float hover:border-brand-500/50 cursor-pointer transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors">{vendor.companyName}</h3>
                    {vendor.isVerified && <VerifiedBadge size="xs" />}
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{vendor.owner?.name} &middot; {vendor.owner?.email}</p>
                </div>
                <StatusBadge status={vendor.status} />
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                <span>{format(new Date(vendor.createdAt), "MMM d, yyyy")}</span>
                <span>{vendor.branchesCount} {vendor.branchesCount === 1 ? "branch" : "branches"}</span>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                {vendor.status === "PENDING_APPROVAL" && (
                  <>
                    <button onClick={() => { setConfirmAction({ id: vendor.id, action: "approve" }); setConfirmOpen(true); }} className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Approve</button>
                    <button onClick={() => { setRejectTarget(vendor.id); setRejectReason(""); }} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Reject</button>
                  </>
                )}
                {vendor.status === "APPROVED" && (
                  <button onClick={() => { setConfirmAction({ id: vendor.id, action: "suspend" }); setConfirmOpen(true); }} className="rounded-lg bg-slate-500/10 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-colors">Suspend</button>
                )}
                {(vendor.status === "SUSPENDED" || vendor.status === "REJECTED") && (
                  <button onClick={() => { setConfirmAction({ id: vendor.id, action: "reactivate" }); setConfirmOpen(true); }} className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Reactivate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && <Pagination meta={meta} />}
        </>
      )}

      {/* Rejection Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRejectTarget(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-dark-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reject Vendor</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">Provide a reason. The vendor will see this.</p>
            <textarea
              rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-dark-850 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none"
              placeholder="e.g. Photos do not meet requirements..." autoFocus
            />
            <div className="mt-6 flex justify-end gap-4">
              <button onClick={() => setRejectTarget(null)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors">Cancel</button>
              <button onClick={confirmReject} disabled={!rejectReason.trim()} className="rounded-xl px-6 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Verification Modal */}
      {denyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDenyTarget(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-dark-900 p-8 shadow-2xl border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Deny Verification</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">Optionally provide a note for the vendor.</p>
            <textarea
              rows={3} value={denyNote} onChange={(e) => setDenyNote(e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-dark-850 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none"
              placeholder="e.g. Documents not clear enough..." autoFocus
            />
            <div className="mt-6 flex justify-end gap-4">
              <button onClick={() => setDenyTarget(null)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-dark-850 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors">Cancel</button>
              <button onClick={() => { handleDeny(denyTarget, denyNote.trim()); setDenyTarget(null); }} className="rounded-xl px-6 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">Deny</button>
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
    </div>
  );
}
