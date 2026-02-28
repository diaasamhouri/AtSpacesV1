"use client";

import { useEffect, useState } from "react";
import { getVendorStats } from "../../lib/vendor";
import { useAuth } from "../../lib/auth-context";
import type { VendorStats } from "../../lib/types";
import StatCard from "../components/ui/stat-card";
import SidebarIcon from "../components/ui/sidebar-icon";

export default function VendorDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState<VendorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) return;
        getVendorStats(token)
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to load vendor statistics.");
                setLoading(false);
            });
    }, [token]);

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    if (error || !stats) {
        return <div className="text-red-500 p-4 bg-red-500/10 border border-red-500/20 rounded-xl font-medium">{error}</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">
                    Welcome, {stats.companyName}
                </h1>
                <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-500">
                    Status: {stats.status}
                </span>
            </div>

            {/* Empty-state CTA for new vendors */}
            {stats.stats.branches === 0 && (
                <div className="rounded-3xl bg-dark-900 border border-slate-800 p-10 text-center shadow-float">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 mb-6 border border-brand-500/20">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Create Your First Space</h2>
                    <p className="text-base text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
                        Your application has been approved! Start by creating a branch — this represents your physical location where you'll offer meeting rooms, offices, or event spaces.
                    </p>
                    <button
                        onClick={() => window.location.href = "/vendor/branches"}
                        className="rounded-xl bg-brand-500 active:scale-95 px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.4)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.6)] hover:-translate-y-0.5 transition-all duration-300"
                    >
                        + Create Branch
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total Branches"
                    value={stats.stats.branches}
                    color="blue"
                    icon={<SidebarIcon name="MapPin" className="h-6 w-6" />}
                />
                <StatCard
                    label="Total Services"
                    value={stats.stats.services}
                    color="purple"
                    icon={<SidebarIcon name="Briefcase" className="h-6 w-6" />}
                />
                <StatCard
                    label="Active Bookings"
                    value={stats.stats.activeBookings}
                    color="brand"
                    icon={<SidebarIcon name="Calendar" className="h-6 w-6" />}
                />
                <StatCard
                    label="Total Revenue"
                    value={`JOD ${stats.stats.totalRevenue.toFixed(2)}`}
                    color="emerald"
                    icon={<SidebarIcon name="DollarSign" className="h-6 w-6" />}
                />
            </div>

            {/* Quick actions */}
            {stats.stats.branches > 0 && (
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => window.location.href = "/vendor/branches/new"}
                        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-dark-900 px-5 py-3 text-sm font-bold text-white hover:bg-dark-850 hover:border-slate-700 transition-all"
                    >
                        <SidebarIcon name="MapPin" className="h-4 w-4 text-brand-500" />
                        Add Branch
                    </button>
                    <button
                        onClick={() => window.location.href = "/vendor/calendar"}
                        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-dark-900 px-5 py-3 text-sm font-bold text-white hover:bg-dark-850 hover:border-slate-700 transition-all"
                    >
                        <SidebarIcon name="CalendarClock" className="h-4 w-4 text-brand-500" />
                        View Calendar
                    </button>
                    <button
                        onClick={() => window.location.href = "/vendor/analytics"}
                        className="flex items-center gap-2 rounded-xl border border-slate-800 bg-dark-900 px-5 py-3 text-sm font-bold text-white hover:bg-dark-850 hover:border-slate-700 transition-all"
                    >
                        <SidebarIcon name="TrendingUp" className="h-4 w-4 text-brand-500" />
                        View Analytics
                    </button>
                </div>
            )}
        </div>
    );
}
