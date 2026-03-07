"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { createAdminService, getAdminBranches } from "../../../../lib/admin";
import Link from "next/link";
import type { AdminBranch } from "../../../../lib/types";

const INPUT_CLASS =
  "block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors";
const LABEL_CLASS = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5";
const SELECT_CLASS =
  "block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors";

const SERVICE_TYPES = [
  { value: "HOT_DESK", label: "Hot Desk" },
  { value: "PRIVATE_OFFICE", label: "Private Office" },
  { value: "MEETING_ROOM", label: "Meeting Room" },
  { value: "EVENT_SPACE", label: "Event Space" },
];

const ROOM_SHAPES = [
  { value: "", label: "None" },
  { value: "L_SHAPE", label: "L-Shape" },
  { value: "U_SHAPE", label: "U-Shape" },
  { value: "RECTANGLE", label: "Rectangle" },
  { value: "SQUARE", label: "Square" },
  { value: "OVAL", label: "Oval" },
  { value: "CUSTOM", label: "Custom" },
];

const SETUP_TYPES = [
  { value: "", label: "None" },
  { value: "CLASSROOM", label: "Classroom" },
  { value: "THEATER", label: "Theater" },
  { value: "BOARDROOM", label: "Boardroom" },
  { value: "U_SHAPE_SEATING", label: "U-Shape Seating" },
  { value: "HOLLOW_SQUARE", label: "Hollow Square" },
  { value: "BANQUET", label: "Banquet" },
];

const PRICING_INTERVALS = [
  { value: "HOURLY", label: "Hourly" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

export default function AdminCreateServicePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", type: "HOT_DESK", branchId: "", description: "",
    floor: "", profileNameEn: "", profileNameAr: "", weight: "", netSize: "",
    shape: "", unitNumber: "",
    features: [] as string[],
    pricing: [{ interval: "HOURLY", price: "" }] as { interval: string; price: string }[],
    setupConfigs: [] as { setupType: string; minPeople: number; maxPeople: number }[],
  });
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => {
    if (!token) return;
    getAdminBranches(token, { limit: 200 }).then((res) => {
      setBranches(res.data);
      if (res.data.length > 0 && !form.branchId) setForm((f) => ({ ...f, branchId: res.data[0]!.id }));
    }).catch(() => {});
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      const pricing = form.pricing.filter((p) => p.price).map((p) => ({ interval: p.interval, price: Number(p.price) }));
      if (pricing.length === 0) throw new Error("Add at least one pricing interval.");

      const body: Record<string, unknown> = {
        branchId: form.branchId,
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
        features: form.features,
        pricing,
        setupConfigs: form.setupConfigs.filter((sc) => sc.setupType).map((sc) => ({ setupType: sc.setupType, minPeople: Number(sc.minPeople), maxPeople: Number(sc.maxPeople) })),
      };
      await createAdminService(token, body);
      router.push("/admin/services");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create service.");
    } finally {
      setSubmitting(false);
    }
  };

  const addFeature = () => {
    if (featureInput.trim() && !form.features.includes(featureInput.trim())) {
      setForm({ ...form, features: [...form.features, featureInput.trim()] });
      setFeatureInput("");
    }
  };

  const addPricing = () => {
    const usedIntervals = form.pricing.map((p) => p.interval);
    const next = PRICING_INTERVALS.find((i) => !usedIntervals.includes(i.value));
    if (next) setForm({ ...form, pricing: [...form.pricing, { interval: next.value, price: "" }] });
  };

  const removePricing = (idx: number) => {
    setForm({ ...form, pricing: form.pricing.filter((_, i) => i !== idx) });
  };

  const updatePricing = (idx: number, field: "interval" | "price", value: string) => {
    const updated = [...form.pricing];
    updated[idx] = { ...updated[idx]!, [field]: value };
    setForm({ ...form, pricing: updated });
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/services" className="inline-flex items-center gap-2 text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        Back to Services
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Service</h1>

      {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-medium text-red-400">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={LABEL_CLASS}>Branch *</label>
              <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className={SELECT_CLASS} required>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.city})</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Office Room 3" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={SELECT_CLASS}>
                {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
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
          </div>
        </div>

        {/* Room Details */}
        <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Room Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={LABEL_CLASS}>Shape</label>
              <select value={form.shape} onChange={(e) => setForm({ ...form, shape: e.target.value })} className={SELECT_CLASS}>
                {ROOM_SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
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
                {form.setupConfigs.length > 0 && (
                  <button type="button" onClick={() => setForm({ ...form, setupConfigs: form.setupConfigs.filter((_, i) => i !== idx) })} className="text-red-500 hover:text-red-400 text-sm font-bold transition-colors">Remove</button>
                )}
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
                <button type="button" onClick={() => setForm({ ...form, features: form.features.filter((x) => x !== f) })}
                  className="text-brand-500/60 hover:text-brand-400 rounded-full w-4 h-4 flex items-center justify-center">x</button>
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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pricing *</h2>
            <button type="button" onClick={addPricing} disabled={form.pricing.length >= PRICING_INTERVALS.length}
              className="text-xs font-bold text-brand-500 hover:text-brand-400 disabled:opacity-30 transition-colors">+ Add Interval</button>
          </div>
          <div className="space-y-3">
            {form.pricing.map((p, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <select value={p.interval} onChange={(e) => updatePricing(idx, "interval", e.target.value)} className={`!w-40 shrink-0 ${SELECT_CLASS}`}>
                  {PRICING_INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
                <input type="number" step="0.01" value={p.price} onChange={(e) => updatePricing(idx, "price", e.target.value)}
                  placeholder="Price (JOD)" className={`flex-1 ${INPUT_CLASS}`} />
                {form.pricing.length > 1 && (
                  <button type="button" onClick={() => removePricing(idx)} className="text-red-500 hover:text-red-400 text-sm font-bold transition-colors">Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting}
            className="rounded-xl bg-brand-500 px-8 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-all shadow-[0_4px_12px_rgba(255,91,4,0.4)] disabled:opacity-50">
            {submitting ? "Creating..." : "Create Service"}
          </button>
        </div>
      </form>
    </div>
  );
}
