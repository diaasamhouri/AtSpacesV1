"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getAdminVendors, updateVendorStatus, verifyVendor } from "../../../lib/admin";
import { VerifiedBadge } from "../../components/verified-badge";
import { useAuth } from "../../../lib/auth-context";
import { format } from "date-fns";
import ImageLightbox from "../../components/ui/image-lightbox";
import StatusBadge from "../../components/ui/status-badge";
import { Pagination } from "../../components/pagination";
import { SearchBar } from "../../components/search-bar";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { PaginationMeta } from "../../../lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminVendorsReview() {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<any[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  const handleStatusChange = async (id: string, newStatus: "APPROVED" | "REJECTED" | "SUSPENDED", reason?: string) => {
    if (!token) return;
    try {
      await updateVendorStatus(token, id, newStatus, reason);
      setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, status: newStatus, rejectionReason: reason || null } : v)));
    } catch { alert("Failed to update status."); }
  };

  const handleVerify = async (id: string, currentlyVerified: boolean) => {
    if (!token) return;
    try {
      await verifyVendor(token, id, !currentlyVerified);
      setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, isVerified: !currentlyVerified } : v)));
    } catch { alert("Failed to update verification status."); }
  };

  const confirmReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    handleStatusChange(rejectTarget, "REJECTED", rejectReason.trim());
    setRejectTarget(null);
    setRejectReason("");
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
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
        <h1 className="text-3xl font-bold text-white">Vendors Review</h1>
      </div>

      <SearchBar defaultValue={search} placeholder="Search by company, owner name or email..." />

      <div className="overflow-hidden rounded-2xl bg-dark-900 shadow-float border border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-dark-850">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Company</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Owner</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm font-medium text-slate-500">No vendor profiles found.</td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <React.Fragment key={vendor.id}>
                    <tr
                      className="even:bg-dark-850/30 hover:bg-dark-850/60 cursor-pointer transition-colors"
                      onClick={() => setExpandedId((prev) => (prev === vendor.id ? null : vendor.id))}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${expandedId === vendor.id ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              {vendor.companyName}
                              {vendor.isVerified && <VerifiedBadge size="xs" />}
                            </div>
                            <div className="text-xs font-medium text-slate-400 mt-0.5 truncate max-w-xs">{vendor.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">{vendor.owner?.name}</div>
                        <div className="text-xs font-medium text-slate-400 mt-0.5">{vendor.owner?.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-slate-300">{format(new Date(vendor.createdAt), "MMM d, yyyy")}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold" onClick={(e) => e.stopPropagation()}>
                        {vendor.status === "PENDING_APPROVAL" && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setConfirmAction({ id: vendor.id, action: "approve" }); setConfirmOpen(true); }} className="rounded-lg bg-green-500/10 px-4 py-2 text-xs font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Approve</button>
                            <button onClick={() => { setRejectTarget(vendor.id); setRejectReason(""); }} className="rounded-lg bg-red-500/10 px-4 py-2 text-xs font-bold text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors">Reject</button>
                          </div>
                        )}
                        {vendor.status === "APPROVED" && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVerify(vendor.id, vendor.isVerified); }}
                              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${vendor.isVerified ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20'}`}
                            >
                              {vendor.isVerified ? 'Remove Verify' : 'Verify'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: vendor.id, action: "suspend" }); setConfirmOpen(true); }} className="rounded-lg bg-slate-500/10 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-colors ml-2">Suspend</button>
                          </>
                        )}
                        {(vendor.status === "SUSPENDED" || vendor.status === "REJECTED") && (
                          <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: vendor.id, action: "reactivate" }); setConfirmOpen(true); }} className="rounded-lg bg-green-500/10 px-4 py-2 text-xs font-bold text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors">Reactivate</button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable detail panel */}
                    {expandedId === vendor.id && (
                      <tr>
                        <td colSpan={5} className="bg-dark-850 px-6 py-6 border-t border-slate-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Details */}
                            <div className="space-y-6">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">Application Details</h4>
                              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                {vendor.phone && (<><dt className="text-slate-500 font-medium">Phone</dt><dd className="text-white font-medium">{vendor.phone}</dd></>)}
                                {vendor.website && (<><dt className="text-slate-500 font-medium">Website</dt><dd className="text-brand-500 truncate font-medium hover:text-brand-400 transition-colors"><a href={vendor.website} target="_blank" rel="noopener noreferrer">{vendor.website}</a></dd></>)}
                                <dt className="text-slate-500 font-medium">Branches</dt><dd className="text-white font-medium">{vendor.branchesCount}</dd>
                              </dl>

                              {vendor.description && (
                                <div>
                                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h5>
                                  <p className="text-sm font-medium text-slate-300 whitespace-pre-wrap">{vendor.description}</p>
                                </div>
                              )}

                              {vendor.amenities && vendor.amenities.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Amenities ({vendor.amenities.length})</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {vendor.amenities.map((a: string) => (
                                      <span key={a} className="inline-flex rounded-md bg-brand-500/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-500 border border-brand-500/20">{a}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {vendor.rejectionReason && (
                                <div className="rounded-2xl bg-red-500/10 p-5 border border-red-500/20">
                                  <h5 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2">Rejection Reason</h5>
                                  <p className="text-sm font-medium text-red-400">{vendor.rejectionReason}</p>
                                </div>
                              )}

                              {user?.role === "ADMIN" && (
                                <div className="rounded-2xl bg-orange-500/10 p-5 border border-orange-500/20">
                                  <h5 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Platform Commission Rate</h5>
                                  <div className="flex items-center gap-4">
                                    <div className="relative w-40">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="Default"
                                        defaultValue={vendor.commissionRate ?? ""}
                                        onBlur={(e) => {
                                          const val = e.target.value;
                                          const rate = val === "" ? null : parseFloat(val);
                                          if (rate !== null && (rate < 0 || rate > 100)) {
                                            alert("Rate must be between 0 and 100");
                                            e.target.value = vendor.commissionRate ?? "";
                                            return;
                                          }
                                          import("../../../lib/admin").then(({ updateVendorCommission }) => {
                                            updateVendorCommission(token!, vendor.id, rate)
                                              .then(() => alert(`Commission rate updated to ${rate === null ? 'System Default' : rate + '%'}`))
                                              .catch(() => alert('Failed to update commission rate'));
                                          });
                                        }}
                                        className="block w-full rounded-xl border border-orange-500/30 bg-dark-900 pl-4 pr-10 py-2.5 text-sm font-bold text-white focus:bg-dark-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                                      />
                                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                        <span className="text-slate-500 sm:text-sm font-bold">%</span>
                                      </div>
                                    </div>
                                    <span className="text-xs font-medium text-orange-400">
                                      Leave empty to use the global default rate.
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Images */}
                            <div>
                              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Space Photos</h4>
                              {vendor.images && vendor.images.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                  {vendor.images.map((img: string, i: number) => (
                                    <img
                                      key={i}
                                      src={img.startsWith("/") ? `${API}${img}` : img}
                                      alt={`Space photo ${i + 1}`}
                                      className="rounded-2xl h-36 w-full object-cover border border-slate-700 cursor-pointer hover:opacity-80 hover:border-brand-500/50 transition-all shadow-sm"
                                      onClick={() => openLightbox(vendor.images, i)}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm font-medium text-slate-500 italic">No images uploaded.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {meta && <Pagination meta={meta} />}

      {/* Rejection Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRejectTarget(null)}>
          <div className="w-full max-w-md rounded-3xl bg-dark-900 p-8 shadow-2xl border border-slate-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-2">Reject Vendor</h3>
            <p className="text-sm font-medium text-slate-400 mb-6">Please provide a reason for rejecting this application. The vendor will see this.</p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="block w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm font-medium text-white bg-dark-850 focus:bg-dark-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none mb-2"
              placeholder="e.g. Photos do not meet landscape requirements..."
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-4">
              <button onClick={() => setRejectTarget(null)} className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-bold text-white bg-dark-850 hover:bg-dark-800 hover:border-slate-600 transition-colors">Cancel</button>
              <button onClick={confirmReject} disabled={!rejectReason.trim()} className="rounded-xl px-6 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">Reject Vendor</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
        onConfirm={handleConfirmAction}
        title={currentConfirm?.title || "Confirm"}
        message={currentConfirm?.message || "Are you sure?"}
        confirmLabel={currentConfirm?.label || "Confirm"}
        variant={currentConfirm?.variant || "default"}
      />

      {/* Image Lightbox */}
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
