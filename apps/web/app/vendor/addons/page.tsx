"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { getVendorAddOns, createVendorAddOn, updateVendorAddOn, deleteVendorAddOn } from "../../../lib/vendor";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { VendorAddOn } from "../../../lib/types";

export default function VendorAddOnsPage() {
    const { token } = useAuth();
    const { toast } = useToast();

    const [addOns, setAddOns] = useState<VendorAddOn[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formNameAr, setFormNameAr] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const loadAddOns = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await getVendorAddOns(token);
            setAddOns(Array.isArray(data) ? data : []);
        } catch {
            toast("Failed to load add-ons.", "error");
        } finally {
            setLoading(false);
        }
    }, [token, toast]);

    useEffect(() => { loadAddOns(); }, [loadAddOns]);

    const openCreate = () => {
        setEditingId(null);
        setFormName("");
        setFormNameAr("");
        setFormPrice("");
        setShowForm(true);
    };

    const openEdit = (a: VendorAddOn) => {
        setEditingId(a.id);
        setFormName(a.name);
        setFormNameAr(a.nameAr || "");
        setFormPrice(String(a.unitPrice));
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!token || !formName.trim() || !formPrice) return;
        setSaving(true);
        try {
            if (editingId) {
                await updateVendorAddOn(token, editingId, { name: formName.trim(), nameAr: formNameAr.trim() || undefined, unitPrice: Number(formPrice) });
                toast("Add-on updated.", "success");
            } else {
                await createVendorAddOn(token, { name: formName.trim(), nameAr: formNameAr.trim() || undefined, unitPrice: Number(formPrice) });
                toast("Add-on created.", "success");
            }
            setShowForm(false);
            loadAddOns();
        } catch (err: any) {
            toast(err.message || "Failed to save add-on.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (a: VendorAddOn) => {
        if (!token) return;
        try {
            await updateVendorAddOn(token, a.id, { isActive: !a.isActive });
            toast(`Add-on ${a.isActive ? "deactivated" : "activated"}.`, "success");
            loadAddOns();
        } catch (err: any) {
            toast(err.message || "Failed to update.", "error");
        }
    };

    const handleDelete = async () => {
        if (!token || !deleteId) return;
        try {
            await deleteVendorAddOn(token, deleteId);
            toast("Add-on deactivated.", "success");
            setDeleteId(null);
            loadAddOns();
        } catch (err: any) {
            toast(err.message || "Failed to delete.", "error");
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add-ons Catalog</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage food, beverages, and other add-on items for bookings.</p>
                </div>
                <button onClick={openCreate} className="rounded-xl bg-brand-500 active:scale-95 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-all shadow-[0_4px_12px_rgba(255,91,4,0.3)]">
                    + Add Item
                </button>
            </div>

            {showForm && (
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">{editingId ? "Edit Add-on" : "New Add-on"}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Name (English) *</label>
                            <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. American Coffee"
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder-slate-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Name (Arabic)</label>
                            <input type="text" value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} placeholder="Optional" dir="rtl"
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder-slate-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Unit Price (JOD) *</label>
                            <input type="number" step="0.001" min="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.000"
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder-slate-500" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-5 py-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={saving || !formName.trim() || !formPrice} className="rounded-xl bg-brand-500 active:scale-95 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all">
                            {saving ? "Saving..." : editingId ? "Update" : "Create"}
                        </button>
                    </div>
                </div>
            )}

            <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                {addOns.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No add-ons yet. Click &quot;+ Add Item&quot; to create your first add-on.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-dark-850 text-left">
                                <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300">Name</th>
                                <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300">Arabic Name</th>
                                <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300 text-right">Unit Price</th>
                                <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300 text-center">Status</th>
                                <th className="px-6 py-3 font-medium text-slate-600 dark:text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {addOns.map((a) => (
                                <tr key={a.id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-dark-850/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{a.name}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400" dir="rtl">{a.nameAr || "-"}</td>
                                    <td className="px-6 py-4 text-gray-900 dark:text-white text-right">{a.unitPrice.toFixed(3)} JOD</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleToggleActive(a)}
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors ${a.isActive ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20" : "bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20"}`}>
                                            {a.isActive ? "Active" : "Inactive"}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEdit(a)} className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors">Edit</button>
                                            <button onClick={() => setDeleteId(a.id)} className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
                title="Deactivate Add-on" message="This will deactivate the add-on. It will no longer appear in new bookings." confirmLabel="Deactivate" variant="danger" />
        </div>
    );
}
