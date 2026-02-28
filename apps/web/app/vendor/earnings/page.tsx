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
            accessor: (p) => <span className="text-sm font-bold text-white whitespace-nowrap">{format(new Date(p.paidAt || p.createdAt), "MMM d, yyyy")}</span>,
        },
        {
            header: "Customer",
            accessor: (p) => <span className="text-sm text-slate-400">{p.customer}</span>,
        },
        {
            header: "Service",
            accessor: (p) => <span className="text-sm text-slate-400">{p.service} ({p.serviceType})</span>,
        },
        {
            header: "Branch",
            accessor: (p) => <span className="text-sm text-slate-400">{p.branch}</span>,
        },
        {
            header: "Method",
            accessor: (p) => <span className="text-sm text-slate-400">{p.method}</span>,
        },
        {
            header: "Amount",
            align: "right" as const,
            accessor: (p) => <span className="text-sm font-bold text-white whitespace-nowrap">JOD {p.amount.toFixed(2)}</span>,
        },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Earnings</h1>

            <StatCard
                label="Total Earnings"
                value={`JOD ${(data?.totalEarnings || 0).toFixed(2)}`}
                color="emerald"
                icon={<SidebarIcon name="DollarSign" className="h-6 w-6" />}
            />

            {/* Monthly Chart */}
            <div className="rounded-2xl bg-dark-900 p-6 shadow-float border border-slate-800">
                <h2 className="text-xl font-bold text-white mb-6">Monthly Revenue</h2>
                {data?.monthly?.length > 0 ? (
                    <BarChart
                        data={data.monthly.map((m: any) => ({ label: m.month, value: m.total }))}
                        colors={["#10b981", "#34d399"]}
                        id="earnings-monthly"
                    />
                ) : <p className="text-sm text-slate-500 text-center py-8">No revenue data yet.</p>}
            </div>

            {/* Payment History */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Payment History</h2>
                <DataTable
                    columns={paymentColumns}
                    data={data?.payments || []}
                    emptyMessage="No payments yet."
                />
            </div>
        </div>
    );
}
