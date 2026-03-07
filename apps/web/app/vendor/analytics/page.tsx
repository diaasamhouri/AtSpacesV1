"use client";

import { useEffect, useState } from "react";
import { getVendorAnalytics } from "../../../lib/vendor";
import { useAuth } from "../../../lib/auth-context";
import StatCard from "../../components/ui/stat-card";
import SidebarIcon from "../../components/ui/sidebar-icon";
import { BarChart, DonutChart, ProgressBar } from "../../components/ui/dashboard-chart";

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#eab308",
    CONFIRMED: "#3b82f6",
    COMPLETED: "#22c55e",
    CANCELLED: "#ef4444",
    NO_SHOW: "#64748b",
    CHECKED_IN: "#6366f1",
};

const SERVICE_COLORS = ["#14b8a6", "#f97316", "#6366f1", "#eab308", "#ec4899", "#3b82f6"];

export default function VendorAnalyticsPage() {
    const { token } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (token) load(); }, [token]);

    const load = () => {
        setLoading(true);
        getVendorAnalytics(token!)
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    };

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>

            {/* Summary */}
            <StatCard
                label="Total Bookings"
                value={data?.totalBookings || 0}
                color="blue"
                icon={<SidebarIcon name="Calendar" className="h-6 w-6" />}
            />

            {/* Booking Status Breakdown + Popular Services */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Booking Status</h2>
                    {data?.byStatus?.length > 0 ? (
                        <DonutChart
                            data={data.byStatus.map((s: any) => ({
                                label: s.status,
                                value: s.count,
                                color: STATUS_COLORS[s.status] || "#64748b",
                            }))}
                            centerValue={data.totalBookings}
                            centerLabel="Total"
                        />
                    ) : <p className="text-sm text-slate-500 text-center py-8">No data yet.</p>}
                </div>

                {/* Popular Services */}
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Popular Services</h2>
                    {data?.popularServices?.length > 0 ? (
                        <div className="space-y-4">
                            {data.popularServices.slice(0, 8).map((s: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-800 transition-colors hover:border-brand-500/30">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-500 shrink-0">{i + 1}</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{s.name}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-dark-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">{s.type}</span>
                                    </div>
                                    <span className="text-sm font-bold text-brand-500 shrink-0 ml-2">{s.bookings} <span className="text-xs font-medium text-slate-500">bookings</span></span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-slate-500 text-center py-8">No services yet.</p>}
                </div>
            </div>

            {/* Daily Bookings */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-float border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Daily Bookings (Recent)</h2>
                {data?.daily?.length > 0 ? (
                    <BarChart
                        data={data.daily.map((d: any) => ({ label: d.date.slice(5), value: d.count }))}
                        colors={["#14b8a6", "#f97316"]}
                        id="vendor-daily"
                    />
                ) : <p className="text-sm text-slate-500 text-center py-8">No booking data yet.</p>}
            </div>

            {/* Service Type Distribution */}
            {data?.popularServices?.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-float border border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Service Type Distribution</h2>
                    <DonutChart
                        data={(() => {
                            const typeMap: Record<string, number> = {};
                            data.popularServices.forEach((s: any) => {
                                typeMap[s.type] = (typeMap[s.type] || 0) + s.bookings;
                            });
                            return Object.entries(typeMap).map(([label, value], i) => ({
                                label,
                                value,
                                color: SERVICE_COLORS[i % SERVICE_COLORS.length]!,
                            }));
                        })()}
                        centerValue={data.totalBookings}
                        centerLabel="Bookings"
                    />
                </div>
            )}

            {/* Peak Hours */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-float border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Peak Hours</h2>
                {data?.peakHours?.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {data.peakHours.slice(0, 10).map((h: any) => (
                            <div key={h.hour} className="rounded-xl bg-indigo-500/10 px-5 py-3 text-center border border-indigo-500/20 transition-transform hover:-translate-y-1">
                                <div className="text-xl font-bold text-indigo-400">{h.hour}:00</div>
                                <div className="text-[11px] font-bold tracking-wider uppercase mt-1 text-indigo-500">{h.count} <span className="opacity-70">bookings</span></div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-slate-500 text-center py-8">No data yet.</p>}
            </div>
        </div>
    );
}
