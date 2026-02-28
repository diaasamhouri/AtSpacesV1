"use client";

import { useEffect, useState } from "react";
import { getRevenueAnalytics, getBookingAnalytics, getUserGrowthAnalytics } from "../../../lib/admin";
import { useAuth } from "../../../lib/auth-context";
import StatCard from "../../components/ui/stat-card";
import SidebarIcon from "../../components/ui/sidebar-icon";
import { BarChart, DonutChart } from "../../components/ui/dashboard-chart";

const BOOKING_STATUS_COLORS: Record<string, string> = {
    PENDING: "#eab308",
    CONFIRMED: "#3b82f6",
    COMPLETED: "#22c55e",
    CANCELLED: "#ef4444",
    NO_SHOW: "#64748b",
    CHECKED_IN: "#6366f1",
};

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "#a855f7",
    MODERATOR: "#3b82f6",
    ACCOUNTANT: "#14b8a6",
    VENDOR: "#f97316",
    CUSTOMER: "#64748b",
};

export default function AdminAnalyticsPage() {
    const { token } = useAuth();
    const [revenue, setRevenue] = useState<any>(null);
    const [bookings, setBookings] = useState<any>(null);
    const [userGrowth, setUserGrowth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        Promise.all([
            getRevenueAnalytics(token),
            getBookingAnalytics(token),
            getUserGrowthAnalytics(token),
        ]).then(([rev, book, users]) => {
            setRevenue(rev);
            setBookings(book);
            setUserGrowth(users);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Analytics</h1>

            {/* Summary Cards — fixed light mode */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <StatCard
                    label="Total Revenue"
                    value={`JOD ${(revenue?.totalRevenue || 0).toFixed(2)}`}
                    color="emerald"
                    icon={<SidebarIcon name="DollarSign" className="h-6 w-6" />}
                />
                <StatCard
                    label="Total Bookings"
                    value={bookings?.total || 0}
                    color="blue"
                    icon={<SidebarIcon name="Calendar" className="h-6 w-6" />}
                />
                <StatCard
                    label="Total Users"
                    value={userGrowth?.total || 0}
                    color="purple"
                    icon={<SidebarIcon name="Users" className="h-6 w-6" />}
                />
            </div>

            {/* Revenue Chart */}
            <div className="rounded-2xl bg-dark-900 p-6 shadow-float border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-6">Monthly Revenue</h2>
                {revenue?.monthly?.length > 0 ? (
                    <BarChart
                        data={revenue.monthly.map((m: any) => ({ label: m.month, value: m.total }))}
                        colors={["#10b981", "#34d399"]}
                        id="admin-revenue"
                    />
                ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No revenue data yet.</p>
                )}
            </div>

            {/* Booking Status + User Distribution as Donuts */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-dark-900 p-6 shadow-float border border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-6">Booking Status Breakdown</h2>
                    {bookings?.byStatus?.length > 0 ? (
                        <DonutChart
                            data={bookings.byStatus.map((s: any) => ({
                                label: s.status,
                                value: s.count,
                                color: BOOKING_STATUS_COLORS[s.status] || "#64748b",
                            }))}
                            centerValue={bookings.total}
                            centerLabel="Total"
                        />
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-8">No booking data yet.</p>
                    )}
                </div>

                <div className="rounded-2xl bg-dark-900 p-6 shadow-float border border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-6">User Distribution by Role</h2>
                    {userGrowth?.byRole?.length > 0 ? (
                        <DonutChart
                            data={userGrowth.byRole.map((r: any) => ({
                                label: r.role,
                                value: r.count,
                                color: ROLE_COLORS[r.role] || "#64748b",
                            }))}
                            centerValue={userGrowth.total}
                            centerLabel="Users"
                        />
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-8">No user data yet.</p>
                    )}
                </div>
            </div>

            {/* Daily Bookings */}
            <div className="rounded-2xl bg-dark-900 p-6 shadow-float border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-6">Daily Bookings (Last 30)</h2>
                {bookings?.daily?.length > 0 ? (
                    <BarChart
                        data={bookings.daily.map((d: any) => ({ label: d.date.slice(5), value: d.count }))}
                        colors={["#3b82f6", "#60a5fa"]}
                        id="admin-daily-bookings"
                    />
                ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No booking data yet.</p>
                )}
            </div>

            {/* User Growth Chart */}
            <div className="rounded-2xl bg-dark-900 p-6 shadow-float border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-6">Monthly User Growth</h2>
                {userGrowth?.monthly?.length > 0 ? (
                    <BarChart
                        data={userGrowth.monthly.map((m: any) => ({ label: m.month, value: m.count }))}
                        colors={["#a855f7", "#c084fc"]}
                        id="admin-user-growth"
                    />
                ) : (
                    <p className="text-sm text-slate-500 text-center py-8">No user growth data yet.</p>
                )}
            </div>
        </div>
    );
}
