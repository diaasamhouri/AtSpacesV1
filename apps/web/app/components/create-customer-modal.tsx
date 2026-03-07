"use client";

import { useState } from "react";
import { createCustomerInline } from "../../lib/vendor";
import type { CustomerSearchResult } from "../../lib/types";

interface CreateCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (customer: CustomerSearchResult & { isNew: boolean }) => void;
    token: string;
}

export function CreateCustomerModal({ isOpen, onClose, onCreated, token }: CreateCustomerModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [entityType, setEntityType] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Full name is required.");
            return;
        }
        if (!email.trim() && !phone.trim()) {
            setError("At least one of email or phone is required.");
            return;
        }

        setSubmitting(true);
        try {
            const result = await createCustomerInline(token, {
                name: name.trim(),
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                entityType,
            });
            onCreated(result);
            setName("");
            setEmail("");
            setPhone("");
        } catch (err: any) {
            setError(err.message || "Failed to create customer.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Client</h2>
                    <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-850 transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl bg-red-500/10 text-red-400 p-3 text-sm font-medium border border-red-500/20">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Client Type</label>
                        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-fit">
                            <button type="button" onClick={() => setEntityType("INDIVIDUAL")}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${entityType === "INDIVIDUAL" ? "bg-brand-500 text-white" : "bg-white dark:bg-dark-850 text-gray-700 dark:text-slate-300"}`}>
                                Individual
                            </button>
                            <button type="button" onClick={() => setEntityType("COMPANY")}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${entityType === "COMPANY" ? "bg-brand-500 text-white" : "bg-white dark:bg-dark-850 text-gray-700 dark:text-slate-300"}`}>
                                Company
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Full Name *</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter customer name"
                            className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder-slate-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@example.com"
                            className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder-slate-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Phone</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+962..."
                            className="w-full px-4 py-2.5 bg-white dark:bg-dark-850 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder-slate-500" />
                    </div>
                    <p className="text-xs text-slate-500">At least one of email or phone is required.</p>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}
                            className="rounded-xl bg-brand-500 active:scale-95 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm">
                            {submitting ? "Creating..." : "Create Client"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
