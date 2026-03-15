"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { getAdminServiceById, updateAdminService, deleteAdminService, getAdminBranches } from "../../../../lib/admin";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";
import Link from "next/link";
import { SERVICE_TYPE_OPTIONS, ROOM_SHAPE_OPTIONS, SETUP_TYPES as SETUP_TYPE_OPTIONS, isSetupEligible } from "../../../../lib/types";
import type { AdminServiceDetail, AdminBranch } from "../../../../lib/types";

const INPUT_CLASS =
  "block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors";
const LABEL_CLASS = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5";
const SELECT_CLASS =
  "block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors";

const SERVICE_TYPES = SERVICE_TYPE_OPTIONS;
const ROOM_SHAPES = ROOM_SHAPE_OPTIONS;
const SETUP_TYPES = SETUP_TYPE_OPTIONS;

export default function AdminServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [service, setService] = useState<AdminServiceDetail | null>(null);
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "", type: "HOT_DESK", branchId: "", description: "",
    floor: "", profileNameEn: "", profileNameAr: "", weight: "", netSize: "",
    shape: "", unitNumber: "", isActive: true, isPublic: true,
    features: [] as string[],
    pricePerBooking: "", pricePerPerson: "", pricePerHour: "",
    setupConfigs: [] as { setupType: string; minPeople: number; maxPeople: number }[],
  });
  const [featureInput, setFeatureInput] = useState("");

  const fetchService = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const data = await getAdminServiceById(token, id);
      setService(data);
      setForm({
        name: data.name,
        type: data.type,
        branchId: data.branch.id,
        description: data.description || "",
        floor: data.floor || "",
        profileNameEn: data.profileNameEn || "",
        profileNameAr: data.profileNameAr || "",
        weight: data.weight != null ? String(data.weight) : "",
        netSize: data.netSize != null ? String(data.netSize) : "",
        shape: data.shape || "",
        unitNumber: data.unitNumber || "",
        isActive: data.isActive,
        isPublic: data.isPublic !== false,
        features: data.features || [],
        pricePerBooking: data.pricePerBooking != null ? String(data.pricePerBooking) : "",
        pricePerPerson: data.pricePerPerson != null ? String(data.pricePerPerson) : "",
        pricePerHour: data.pricePerHour != null ? String(data.pricePerHour) : "",
        setupConfigs: (data.setupConfigs || []).map((sc) => ({ setupType: sc.setupType, minPeople: sc.minPeople, maxPeople: sc.maxPeople })),
      });
    } catch {
      setError("Failed to load service.");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => { fetchService(); }, [fetchService]);

  useEffect(() => {
    if (!token) return;
    getAdminBranches(token, { limit: 200 }).then((res) => setBranches(res.data)).catch(() => {});
  }, [token]);

  const handleSave = async () => {
    if (!token || !id) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        description: form.description || undefined,
        floor: form.floor || undefined,
        profileNameEn: form.profileNameEn || undefined,
        profileNameAr: form.profileNameAr || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        netSize: form.netSize ? Number(form.netSize) : undefined,
        shape: form.shape || undefined,
        unitNumber: form.unitNumber || undefined,
        isActive: form.isActive,
        isPublic: form.isPublic,
        features: form.features,
        pricePerBooking: form.pricePerBooking ? Number(form.pricePerBooking) : null,
        pricePerPerson: form.pricePerPerson ? Number(form.pricePerPerson) : null,
        pricePerHour: form.pricePerHour ? Number(form.pricePerHour) : null,
        setupConfigs: form.setupConfigs.filter((sc) => sc.setupType).map((sc) => ({ setupType: sc.setupType, minPeople: Number(sc.minPeople), maxPeople: Number(sc.maxPeople) })),
      };
      const updated = await updateAdminService(token, id, body);
      setService(updated);
      setSaveMsg("Changes saved successfully.");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err: unknown) {
      setSaveMsg(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !id) return;
    try {
      await deleteAdminService(token, id);
      router.push("/admin/services");
    } catch {
      setSaveMsg("Failed to delete service.");
    }
    setConfirmDeleteOpen(false);
  };

  const addFeature = () => {
    if (featureInput.trim() && !form.features.includes(featureInput.trim())) {
      setForm({ ...form, features: [...form.features, featureInput.trim()] });
      setFeatureInput("");
    }
  };

  const removeFeature = (f: string) => {
    setForm({ ...form, features: form.features.filter((x) => x !== f) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || "Service not found."}</p>
        <button onClick={() => router.back()} className="mt-4 text-brand-500 hover:underline text-sm">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/services" className="inline-flex items-center gap-2 text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        Back to Services
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Service</h1>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-all shadow-[0_4px_12px_rgba(255,91,4,0.4)] disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={() => setConfirmDeleteOpen(true)}
            className="rounded-xl bg-red-500/10 border border-red-500/20 px-6 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/20 transition-colors">
            Delete
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className={`rounded-xl p-3 text-sm font-medium ${saveMsg.includes("success") ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
          {saveMsg}
        </div>
      )}

      {/* Basic Info */}
      <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className={LABEL_CLASS}>Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Type *</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={SELECT_CLASS}>
              {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Branch</label>
            <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className={SELECT_CLASS} disabled>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-500">Branch cannot be changed after creation.</p>
          </div>
          <div>
            <label className={LABEL_CLASS}>Effective Capacity</label>
            <div className={`${INPUT_CLASS} bg-slate-50 dark:bg-dark-800 cursor-not-allowed`}>
              {form.setupConfigs.length > 0 ? Math.max(...form.setupConfigs.map((sc) => sc.maxPeople)) : "-"}
            </div>
            <p className="mt-1 text-xs text-slate-500">Auto-computed from setup configurations.</p>
          </div>
          <div>
            <label className={LABEL_CLASS}>Unit Number</label>
            <input type="text" value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} placeholder="e.g. A-101" className={INPUT_CLASS} />
          </div>
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${INPUT_CLASS} resize-none`} />
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-500 peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Active</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-blue-500 peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Public</span>
          </div>
        </div>
      </div>

      {/* Room Details */}
      <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Room Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {isSetupEligible(form.type) && (
          <div>
            <label className={LABEL_CLASS}>Shape</label>
            <select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })} className={SELECT_CLASS}>
              {ROOM_SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          )}
          <div>
            <label className={LABEL_CLASS}>Floor</label>
            <input type="text" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="e.g. Ground Floor" className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Profile Name (EN)</label>
            <input type="text" value={form.profileNameEn} onChange={(e) => setForm({ ...form, profileNameEn: e.target.value })} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Profile Name (AR)</label>
            <input type="text" value={form.profileNameAr} onChange={(e) => setForm({ ...form, profileNameAr: e.target.value })} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Weight</label>
            <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Net Size (sqm)</label>
            <input type="number" step="0.01" value={form.netSize} onChange={(e) => setForm({ ...form, netSize: e.target.value })} className={INPUT_CLASS} />
          </div>
        </div>
      </div>

      {/* Setup Configurations */}
      <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Setup Configurations</h2>
          <button type="button" onClick={() => setForm({ ...form, setupConfigs: [...form.setupConfigs, { setupType: "", minPeople: 1, maxPeople: 1 }] })}
            className="text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">+ Add Setup</button>
        </div>
        <div className="space-y-3">
          {form.setupConfigs.map((sc, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <select value={sc.setupType} onChange={(e) => { const updated = [...form.setupConfigs]; updated[idx] = { ...updated[idx]!, setupType: e.target.value }; setForm({ ...form, setupConfigs: updated }); }} className={`!w-48 shrink-0 ${SELECT_CLASS}`}>
                <option value="">Select Setup</option>
                {SETUP_TYPES.filter((s) => s.value).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 shrink-0">Min</span>
                <input type="number" min="1" value={sc.minPeople} onChange={(e) => { const updated = [...form.setupConfigs]; updated[idx] = { ...updated[idx]!, minPeople: parseInt(e.target.value) || 1 }; setForm({ ...form, setupConfigs: updated }); }}
                  className={`!w-20 shrink-0 ${INPUT_CLASS}`} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 shrink-0">Max</span>
                <input type="number" min="1" value={sc.maxPeople} onChange={(e) => { const updated = [...form.setupConfigs]; updated[idx] = { ...updated[idx]!, maxPeople: parseInt(e.target.value) || 1 }; setForm({ ...form, setupConfigs: updated }); }}
                  className={`!w-20 shrink-0 ${INPUT_CLASS}`} />
              </div>
              <button type="button" onClick={() => setForm({ ...form, setupConfigs: form.setupConfigs.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-400 text-sm font-bold transition-colors">Remove</button>
            </div>
          ))}
          {form.setupConfigs.length === 0 && <p className="text-sm text-slate-500">No setup configurations. Add at least one.</p>}
        </div>
      </div>

      {/* Features */}
      <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Features</h2>
        <div className="flex flex-wrap gap-2">
          {form.features.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 text-xs font-bold text-brand-400">
              {f}
              <button onClick={() => removeFeature(f)} className="text-brand-500/60 hover:text-brand-400 rounded-full w-4 h-4 flex items-center justify-center">x</button>
            </span>
          ))}
        </div>
        <div className="flex gap-3">
          <input type="text" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
            placeholder="Add feature..." className={`flex-1 ${INPUT_CLASS}`} />
          <button type="button" onClick={addFeature} className="rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors">Add</button>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pricing <span className="normal-case font-normal text-slate-500">(at least one required)</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className={LABEL_CLASS}>Per Booking (JOD)</label>
            <input type="number" step="0.001" min="0" value={form.pricePerBooking} onChange={(e) => setForm({ ...form, pricePerBooking: e.target.value })}
              placeholder="0.000" className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Per Person (JOD)</label>
            <input type="number" step="0.001" min="0" value={form.pricePerPerson} onChange={(e) => setForm({ ...form, pricePerPerson: e.target.value })}
              placeholder="0.000" className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Per Hour (JOD)</label>
            <input type="number" step="0.001" min="0" value={form.pricePerHour} onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
              placeholder="0.000" className={INPUT_CLASS} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Service"
        message="Are you sure you want to delete this service? All associated bookings data will remain but the service itself will be removed."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
