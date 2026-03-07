"use client";

import { useEffect, useState } from "react";
import { getVendorEarnings } from "../../../lib/vendor";
import { useAuth } from "../../../lib/auth-context";
import { format } from "date-fns";
import StatCard from "../../components/ui/stat-card";
import SidebarIcon from "../../components/ui/sidebar-icon";
import { BarChart } from "../../components/ui/dashboard-chart";
import DataTable from "../../components/ui/data-table";
import type { Column } from "../../components/ui/data-table";

export default function VendorEarningsPage() {
    const { token } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (token) loadEarnings(); }, [token]);

    const loadEarnings = () => {
        setLoading(true);
        getVendorEarnings(token!)
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

    const paymentColumns: Column<any>[] = [
        {
            header: "Date",
            accessor: (p) => <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{format(new Date(p.paidAt || p.createdAt), "MMM d, yyyy")}</span>,
        },
        {
            header: "Customer",
            accessor: (p) => <span className="text-sm text-slate-500 dark:text-slate-400">{p.customer}</span>,
        },
        {
            header: "Service",
            accessor: (p) => <span className="text-sm text-slate-500 dark:text-slate-400">{p.service} ({p.serviceType})</span>,
        },
        {
            header: "Branch",
            accessor: (p) => <span className="text-sm text-slate-500 dark:text-slate-400">{p.branch}</span>,
        },
        {
            header: "Method",
            accessor: (p) => <span className="text-sm text-slate-500 dark:text-slate-400">{p.method}</span>,
        },
        {
            header: "Gross",
            align: "right" as const,
            accessor: (p) => <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">JOD {p.grossAmount.toFixed(2)}</span>,
        },
        {
            header: "Commission",
            align: "right" as const,
            accessor: (p) => <span className="text-sm text-brand-500 whitespace-nowrap">-JOD {p.commissionAmount.toFixed(2)}</span>,
        },
        {
            header: "Net",
            align: "right" as const,
            accessor: (p) => <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">JOD {p.netAmount.toFixed(2)}</span>,
        },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Earnings</h1>

            {data?.commissionRate != null && (
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                    Platform commission rate: {data.commissionRate}%
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <StatCard
                    label="Gross Revenue"
                    value={`JOD ${(data?.totalGross || 0).toFixed(2)}`}
                    color="blue"
                    icon={<SidebarIcon name="DollarSign" className="h-6 w-6" />}
                />
                <StatCard
                    label="Commission"
                    value={`JOD ${(data?.totalCommission || 0).toFixed(2)}`}
                    color="brand"
                    icon={<SidebarIcon name="Percent" className="h-6 w-6" />}
                />
                <StatCard
                    label="Net Earnings"
                    value={`JOD ${(data?.totalNet || 0).toFixed(2)}`}
                    color="emerald"
                    icon={<SidebarIcon name="DollarSign" className="h-6 w-6" />}
                />
            </div>

            {/* Monthly Chart */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-6 shadow-float border border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Monthly Net Earnings</h2>
                {data?.monthly?.length > 0 ? (
                    <BarChart
                        data={data.monthly.map((m: any) => ({ label: m.month, value: m.net }))}
                        colors={["#10b981", "#34d399"]}
                        id="earnings-monthly"
                    />
                ) : <p className="text-sm text-slate-500 text-center py-8">No revenue data yet.</p>}
            </div>

            {/* Payment History */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Payment History</h2>
                <DataTable
                    columns={paymentColumns}
                    data={data?.payments || []}
                    emptyMessage="No payments yet."
                />
            </div>
        </div>
    );
}
