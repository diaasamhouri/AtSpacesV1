"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVendorStats, getVendorBookings } from "../../lib/vendor";
import { useAuth } from "../../lib/auth-context";
import { formatVendorStatus } from "../../lib/format";
import { format } from "date-fns";
import type { VendorStats, VendorBooking } from "../../lib/types";
import StatusBadge from "../components/ui/status-badge";
import StatCard from "../components/ui/stat-card";
import SidebarIcon from "../components/ui/sidebar-icon";

export default function VendorDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState<VendorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [recentBookings, setRecentBookings] = useState<VendorBooking[]>([]);

    useEffect(() => {
        if (!token) return;
        getVendorStats(token)
            .then((data) => {
                setStats(data);
                setLoading(false);
                // Fetch recent bookings after stats load
                getVendorBookings(token, { page: 1, limit: 5 })
                    .then((res) => setRecentBookings(res.data))
                    .catch(() => {});
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome, {stats.companyName}
                </h1>
                <StatusBadge status={stats.status} size="md" />
            </div>

            {/* Empty-state CTA for new vendors */}
            {stats.stats.branches === 0 && (
                <div className="rounded-3xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-10 text-center shadow-float">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 mb-6 border border-brand-500/20">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Create Your First Space</h2>
                    <p className="text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
                        Your application has been approved! Start by creating a branch — this represents your physical location where you'll offer meeting rooms, offices, or event spaces.
                    </p>
                    <Link
                        href="/vendor/branches"
                        className="rounded-xl bg-brand-500 active:scale-95 px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.4)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.6)] hover:-translate-y-0.5 transition-all duration-300 inline-block"
                    >
                        + Create Branch
                    </Link>
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
                    label="Net Earnings"
                    value={`JOD ${stats.stats.netRevenue.toFixed(2)}`}
                    color="emerald"
                    icon={<SidebarIcon name="DollarSign" className="h-6 w-6" />}
                />
            </div>

            {stats.stats.grossRevenue > 0 && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 -mt-4">
                    Gross: JOD {stats.stats.grossRevenue.toFixed(2)} &middot; Commission: {stats.stats.commissionRate}% (JOD {stats.stats.commissionAmount.toFixed(2)})
                </p>
            )}

            {/* Quick actions */}
            {stats.stats.branches > 0 && (
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/vendor/branches/new"
                        className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 px-5 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-850 hover:border-slate-700 transition-all"
                    >
                        <SidebarIcon name="MapPin" className="h-4 w-4 text-brand-500" />
                        Add Branch
                    </Link>
                    <Link
                        href="/vendor/calendar"
                        className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 px-5 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-850 hover:border-slate-700 transition-all"
                    >
                        <SidebarIcon name="CalendarClock" className="h-4 w-4 text-brand-500" />
                        View Calendar
                    </Link>
                    <Link
                        href="/vendor/analytics"
                        className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-900 px-5 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-850 hover:border-slate-700 transition-all"
                    >
                        <SidebarIcon name="TrendingUp" className="h-4 w-4 text-brand-500" />
                        View Analytics
                    </Link>
                </div>
            )}

            {/* Recent Bookings */}
            {stats.stats.branches > 0 && (
                <div className="rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Recent Bookings</h2>
                    {recentBookings.length === 0 ? (
                        <p className="text-sm font-medium text-slate-500 py-4">No recent bookings yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentBookings.map((b) => (
                                <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800/50 px-4 py-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{b.customer?.name || "Anonymous"}</div>
                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{b.branch.name} &middot; {format(new Date(b.startTime), "MMM d")}</div>
                                    </div>
                                    <StatusBadge status={b.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
