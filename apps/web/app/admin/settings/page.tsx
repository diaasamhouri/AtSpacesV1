"use client";

import { useEffect, useState } from "react";
import { getSystemSettings, updateSystemSettings } from "../../../lib/admin";
import { useAuth } from "../../../lib/auth-context";

export default function AdminSettingsPage() {
    const { user, token } = useAuth();
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState({ type: "", message: "" });

    // Form state
    const [defaultCommission, setDefaultCommission] = useState("");

    useEffect(() => {
        if (token) loadSettings();
    }, [token]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await getSystemSettings(token!);
            setSettings(data);
            const commSetting = data.find((s: any) => s.key === "DEFAULT_COMMISSION_RATE");
            if (commSetting) {
                setDefaultCommission(commSetting.value);
            } else {
                setDefaultCommission("10");
            }
        } catch (err) {
            console.error("Failed to load settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setFeedback({ type: "", message: "" });
        try {
            if (isNaN(parseFloat(defaultCommission)) || parseFloat(defaultCommission) < 0 || parseFloat(defaultCommission) > 100) {
                throw new Error("Invalid commission rate. Must be a percentage between 0 and 100.");
            }

            await updateSystemSettings(token!, [
                { key: "DEFAULT_COMMISSION_RATE", value: defaultCommission }
            ]);

            setFeedback({ type: "success", message: "Settings saved successfully." });
        } catch (err: any) {
            setFeedback({ type: "error", message: err.message || "Failed to save settings." });
        } finally {
            setSaving(false);
        }
    };

    const isSuperAdmin = user?.role === "ADMIN";

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-xl font-bold text-white">Access Denied</h2>
                <p className="text-slate-400 mt-2">Only Super Admins can manage system settings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">System Settings</h1>
            </div>

            {loading ? (
                <div className="flex h-32 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
            ) : (
                <div className="bg-dark-900 rounded-2xl shadow-float border border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-800">
                        <h2 className="text-lg font-bold text-white">Platform Configuration</h2>
                        <p className="text-sm text-slate-400 mt-1">Manage global rates and overrides for the application.</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {feedback.message && (
                            <div className={`p-4 rounded-xl text-sm font-bold ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {feedback.message}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3 col-span-1">
                                <label className="block text-sm font-bold text-white">
                                    Default Platform Commission Rate (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        className="block w-full rounded-xl border border-slate-700 pl-4 pr-12 text-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500 bg-dark-850 py-3 transition-colors"
                                        placeholder="10"
                                        value={defaultCommission}
                                        onChange={(e) => setDefaultCommission(e.target.value)}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                                        <span className="text-slate-500 sm:text-sm font-bold">%</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    This flat percentage is deducted from all vendor payouts unless a custom rate is set on their specific profile.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-dark-850 px-6 py-4 flex justify-end border-t border-slate-800">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.3)] hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 transition-all"
                        >
                            {saving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
