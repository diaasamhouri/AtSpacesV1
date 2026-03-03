"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { getVendorPromoCodes, createPromoCode, deletePromoCode, getVendorBranches } from "../../../lib/vendor";
import StatusBadge from "../../components/ui/status-badge";
import { Pagination } from "../../components/pagination";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { PaginationMeta, PromoCode, VendorBranchDetail } from "../../../lib/types";

export default function PromotionsPage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [branches, setBranches] = useState<VendorBranchDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [code, setCode] = useState("");
    const [discountPercent, setDiscountPercent] = useState("");
    const [maxUses, setMaxUses] = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [branchId, setBranchId] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Confirm dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const page = Number(searchParams.get("page")) || 1;

    const loadData = useCallback(() => {
        if (!token) return;
        setLoading(true);
        Promise.all([
            getVendorPromoCodes(token, { page }),
            getVendorBranches(token)
        ]).then(([promosData, branchesData]) => {
            setPromos(promosData.data || []);
            setMeta(promosData.meta || null);
            setBranches(branchesData.data || branchesData);
            setLoading(false);
        }).catch(err => {
            setError(err.message);
            setLoading(false);
        });
    }, [token, page]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsCreating(true);

        try {
            const data: any = {
                code,
                discountPercent: parseInt(discountPercent),
            };
            if (maxUses) data.maxUses = parseInt(maxUses);
            if (validUntil) data.validUntil = validUntil;
            if (branchId) data.branchId = branchId;

            const newPromo = await createPromoCode(token!, data);
            setPromos([newPromo, ...promos]);

            setCode("");
            setDiscountPercent("");
            setMaxUses("");
            setValidUntil("");
            setBranchId("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteTarget(id);
        setConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            await deletePromoCode(token!, deleteTarget);
            setPromos(promos.filter(p => p.id !== deleteTarget));
        } catch (err: any) {
            toast(err.message || "Failed to delete promo code.", "error");
        }
        setConfirmOpen(false);
        setDeleteTarget(null);
    };

    const getPromoStatus = (promo: PromoCode) => {
        if (promo.validUntil && new Date(promo.validUntil) < new Date()) return "expired";
        if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) return "expired";
        return "active";
    };

    if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading promotions...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Promotions & Discounts</h1>
                <p className="text-slate-500 dark:text-slate-400">Create and manage promo codes for your spaces.</p>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-medium border border-red-500/20">
                    {error}
                </div>
            )}

            <div className="bg-dark-900 p-6 rounded-2xl shadow-float border border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create New Promo Code</h2>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Code *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            required
                            placeholder="e.g. SUMMER20"
                            className="w-full px-4 py-2.5 bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 uppercase transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Discount % *</label>
                        <input
                            type="number"
                            value={discountPercent}
                            onChange={e => setDiscountPercent(e.target.value)}
                            required
                            min="1"
                            max="100"
                            placeholder="e.g. 15"
                            className="w-full px-4 py-2.5 bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Target Branch</label>
                        <select
                            value={branchId}
                            onChange={e => setBranchId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Max Uses</label>
                        <input
                            type="number"
                            value={maxUses}
                            onChange={e => setMaxUses(e.target.value)}
                            min="0"
                            placeholder="Leave empty for unlimited"
                            className="w-full px-4 py-2.5 bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Valid Until</label>
                        <input
                            type="datetime-local"
                            value={validUntil}
                            onChange={e => setValidUntil(e.target.value)}
                            className="w-full px-4 py-2.5 bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full bg-brand-500 active:scale-95 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-600 transition-colors disabled:opacity-50 shadow-[0_4px_12px_rgba(255,91,4,0.3)]"
                        >
                            {isCreating ? "Creating..." : "Create Promo Code"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-dark-900 rounded-2xl shadow-float border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Promo Codes</h2>
                </div>
                {promos.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No promo codes generated yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-slate-800">
                            <thead className="bg-dark-850">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Discount</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Scope</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Uses</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expires</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {promos.map(promo => (
                                    <tr key={promo.id} className="even:bg-dark-850/30 hover:bg-gray-50 dark:hover:bg-dark-850/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-dark-800 text-gray-900 dark:text-white font-mono border border-slate-200 dark:border-slate-700">
                                                {promo.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-emerald-400 font-bold">{promo.discountPercent}% OFF</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                                                {promo.branch ? promo.branch.name : "All Branches"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                                {promo.currentUses} / {promo.maxUses > 0 ? promo.maxUses : '\u221e'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={getPromoStatus(promo)} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                                {promo.validUntil ? new Date(promo.validUntil).toLocaleDateString() : 'Never'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteClick(promo.id)}
                                                className="text-red-400 hover:text-red-300 font-bold text-sm transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {meta && <Pagination meta={meta} />}

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
                onConfirm={handleDeleteConfirm}
                title="Delete Promo Code"
                message="Are you sure you want to delete this promo code? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
