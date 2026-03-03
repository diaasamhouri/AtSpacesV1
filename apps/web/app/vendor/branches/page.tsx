"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVendorBranches } from "../../../lib/vendor";
import { useAuth } from "../../../lib/auth-context";
import { formatServiceType } from "../../../lib/format";
import StatusBadge from "../../components/ui/status-badge";

export default function VendorBranches() {
    const { token } = useAuth();
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) return;
        getVendorBranches(token)
            .then((res) => { setBranches(res.data); setLoading(false); })
            .catch(() => { setError("Failed to load branches."); setLoading(false); });
    }, [token]);

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-medium text-red-400 mb-6">
                    {error}
                </div>
            )}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branches & Services</h1>
                <Link href="/vendor/branches/new" className="rounded-xl bg-brand-500 active:scale-95 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(255,91,4,0.3)] transition-all">
                    Add New Branch
                </Link>
            </div>

            <div className="overflow-hidden rounded-2xl bg-dark-900 shadow-float border border-slate-200 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-dark-850">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Branch Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">City / Address</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Services</th>
                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {branches.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-500">
                                        You haven't added any branches yet. Click "Add New Branch" to get started.
                                    </td>
                                </tr>
                            ) : (
                                branches.map((branch) => (
                                    <tr key={branch.id} className="even:bg-dark-850/30 hover:bg-gray-50 dark:hover:bg-dark-850/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{branch.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-0.5">{branch.city}</div>
                                            <div className="text-xs text-slate-500">{branch.address}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {branch.services?.length > 0 ? (
                                                    branch.services.map((s: any) => (
                                                        <span key={s.id} className="inline-flex rounded-md tracking-wider bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 text-[10px] font-bold text-brand-400">
                                                            {formatServiceType(s.type)}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs font-medium text-slate-500">No services</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={branch.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/vendor/branches/${branch.id}`} className="text-sm font-bold text-brand-500 hover:text-brand-400 transition-colors">
                                                Manage
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
