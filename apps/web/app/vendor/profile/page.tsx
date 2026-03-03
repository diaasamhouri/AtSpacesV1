"use client";

import { useEffect, useState } from "react";
import { getVendorProfile, updateVendorProfile, requestVerification } from "../../../lib/vendor";
import { VerifiedBadge } from "../../components/verified-badge";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import StatusBadge from "../../components/ui/status-badge";
import type { VendorProfile } from "../../../lib/types";

const SOCIAL_PLATFORMS = [
    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
    { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
    { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/..." },
    { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
];

export default function VendorProfilePage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState<VendorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({ companyName: "", description: "", phone: "", website: "" });
    const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

    useEffect(() => { if (token) loadProfile(); }, [token]);

    const loadProfile = () => {
        setLoading(true);
        getVendorProfile(token!)
            .then((data) => {
                setProfile(data);
                setForm({ companyName: data.companyName || "", description: data.description || "", phone: data.phone || "", website: data.website || "" });
                setSocialLinks(data.socialLinks || {});
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            const updated = await updateVendorProfile(token!, { ...form, socialLinks });
            setProfile(updated);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch { toast("Failed to update profile.", "error"); }
        setSaving(false);
    };

    const [verifyConfirmOpen, setVerifyConfirmOpen] = useState(false);

    const handleRequestVerification = async () => {
        try {
            await requestVerification(token!);
            toast("Verification request submitted! Admin will notify you once reviewed.", "success");
        } catch { toast("Failed to submit request.", "error"); }
        setVerifyConfirmOpen(false);
    };

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Company Profile</h1>
                    {profile?.isVerified ? (
                        <div className="flex items-center gap-1 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 text-sm font-bold text-brand-400 shadow-sm">
                            <VerifiedBadge size="sm" /> Verified
                        </div>
                    ) : (
                        <button onClick={() => setVerifyConfirmOpen(true)} className="rounded-full bg-dark-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700">
                            Request Verification
                        </button>
                    )}
                </div>
                <StatusBadge status={profile?.status || ""} size="md" />
            </div>

            {success && <div className="rounded-2xl bg-green-500/10 p-4 text-sm font-bold text-green-400 border border-green-500/20">✓ Profile updated successfully!</div>}

            <div className="rounded-2xl bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company Details</h2>
                <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Company Name</label>
                    <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Description</label>
                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Phone</label>
                        <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Website</label>
                        <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500" />
                    </div>
                </div>
            </div>

            {/* Social Media */}
            <div className="rounded-2xl bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Social Media</h2>
                {SOCIAL_PLATFORMS.map((p) => (
                    <div key={p.key} className="flex items-center gap-4">
                        <span className="w-32 text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</span>
                        <input type="url" placeholder={p.placeholder}
                            value={socialLinks[p.key] || ""}
                            onChange={(e) => setSocialLinks({ ...socialLinks, [p.key]: e.target.value })}
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-600" />
                    </div>
                ))}
            </div>

            <div className="rounded-2xl bg-brand-500/10 border border-brand-500/20 p-5 text-sm text-brand-400 font-medium">
                <span className="mr-2">💡</span> <strong>Amenities</strong> are now managed per branch. Go to each branch detail page to set the facilities for that specific location.
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={handleSave} disabled={saving}
                    className="rounded-xl bg-brand-500 active:scale-95 px-8 py-3.5 text-sm font-bold text-white hover:bg-brand-600 hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(255,91,4,0.3)] transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <ConfirmDialog
                isOpen={verifyConfirmOpen}
                onClose={() => setVerifyConfirmOpen(false)}
                onConfirm={handleRequestVerification}
                title="Request Verification"
                message="Request a verification badge? Admin will review your profile."
                confirmLabel="Request Verification"
                variant="default"
            />
        </div>
    );
}
