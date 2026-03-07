"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAdminBranches, updateBranchStatus } from "../../../lib/admin";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { formatCity, formatBranchStatus } from "../../../lib/format";
import DataTable from "../../components/ui/data-table";
import type { Column, ActionItem } from "../../components/ui/data-table";
import { Pagination } from "../../components/pagination";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { PaginationMeta, AdminBranch } from "../../../lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminBranchesPage() {
    const router = useRouter();
    const { token } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [branches, setBranches] = useState<AdminBranch[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchParams.get("search") || "");

    // Filters
    const [statusFilter, setStatusFilter] = useState("");
    const [cityFilter, setCityFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // Confirm dialog
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ id: string; status: string } | null>(null);

    const page = Number(searchParams.get("page")) || 1;

    const loadBranches = useCallback(() => {
        if (!token) return;
        setLoading(true);
        getAdminBranches(token, {
            page,
            search: search || undefined,
            status: statusFilter || undefined,
            city: cityFilter || undefined,
        })
            .then((res) => { setBranches(res.data); setMeta(res.meta); setLoading(false); })
            .catch(() => setLoading(false));
    }, [token, page, search, statusFilter, cityFilter]);

    useEffect(() => { loadBranches(); }, [loadBranches]);

    const handleStatusClick = (id: string, status: string) => {
        setConfirmAction({ id, status });
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (!confirmAction) return;
        try {
            await updateBranchStatus(token!, confirmAction.id, confirmAction.status);
            setBranches((prev) => prev.map((b) => (b.id === confirmAction.id ? { ...b, status: confirmAction.status as AdminBranch["status"] } : b)));
            toast("Branch status updated.", "success");
        } catch { toast("Failed to update branch.", "error"); }
        setConfirmOpen(false);
        setConfirmAction(null);
    };

    const STATUS_COLORS: Record<string, string> = {
        ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
        SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",
        UNDER_REVIEW: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };

    const columns: Column<AdminBranch>[] = [
        {
            header: "#ID",
            accessor: (row) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{row.id.slice(0, 8)}</span>,
            exportAccessor: (row) => row.id.slice(0, 8),
        },
        {
            header: "Property Name",
            accessor: (row) => (
                <button onClick={() => router.push(`/admin/branches/${row.id}`)} className="text-sm font-medium text-gray-900 dark:text-white hover:text-brand-500 transition-colors text-left">
                    {row.name}
                </button>
            ),
            sortable: true,
            sortKey: "name",
            exportAccessor: (row) => row.name,
        },
        {
            header: "Vendor",
            accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.vendor}</span>,
            sortable: true,
            sortKey: "vendor",
            exportAccessor: (row) => row.vendor,
        },
        {
            header: "City",
            accessor: (row) => <span className="text-xs rounded-full bg-brand-500/10 text-brand-500 px-2 py-0.5 border border-brand-500/20">{formatCity(row.city)}</span>,
            exportAccessor: (row) => formatCity(row.city),
        },
        {
            header: "Units",
            accessor: (row) => (
                <button onClick={() => router.push(`/admin/services?branchId=${row.id}`)} className="text-sm text-brand-500 hover:text-brand-400 underline">
                    {row.servicesCount}
                </button>
            ),
            align: "right" as const,
            exportAccessor: (row) => String(row.servicesCount),
        },
        {
            header: "Bookings",
            accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.bookingsCount}</span>,
            align: "right" as const,
            exportAccessor: (row) => String(row.bookingsCount),
        },
        {
            header: "Status",
            accessor: (row) => (
                <span className={`text-xs font-medium rounded-full px-2 py-0.5 border ${STATUS_COLORS[row.status] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                    {formatBranchStatus(row.status)}
                </span>
            ),
            exportAccessor: (row) => formatBranchStatus(row.status),
        },
        {
            header: "Created",
            accessor: (row) => <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(row.createdAt).toLocaleDateString()}</span>,
            sortable: true,
            sortKey: "created",
            exportAccessor: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
    ];

    const actions: ActionItem<AdminBranch>[] = [
        {
            label: "View Details",
            onClick: (row) => router.push(`/admin/branches/${row.id}`),
        },
        {
            label: "Suspend",
            onClick: (row) => handleStatusClick(row.id, "SUSPENDED"),
            hidden: (row) => row.status !== "ACTIVE",
        },
        {
            label: "Reactivate",
            onClick: (row) => handleStatusClick(row.id, "ACTIVE"),
            hidden: (row) => row.status !== "SUSPENDED",
        },
        {
            label: "Approve",
            onClick: (row) => handleStatusClick(row.id, "ACTIVE"),
            hidden: (row) => row.status !== "UNDER_REVIEW",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties Overview</h1>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors flex items-center gap-2"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                    </svg>
                    Filters
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="SUSPENDED">Suspended</option>
                                <option value="UNDER_REVIEW">Under Review</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">City</label>
                            <select
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            >
                                <option value="">All Cities</option>
                                <option value="AMMAN">Amman</option>
                                <option value="IRBID">Irbid</option>
                                <option value="AQABA">Aqaba</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => { setStatusFilter(""); setCityFilter(""); }}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={branches}
                    actions={actions}
                    searchable
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search branches..."
                    exportable
                    exportFilename="properties"
                    exportTitle="Properties Overview"
                    columnVisibility
                    emptyMessage="No branches found."
                />
            )}

            {meta && <Pagination meta={meta} />}

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
                onConfirm={handleConfirm}
                title="Update Branch Status"
                message={`Are you sure you want to set this branch to ${formatBranchStatus(confirmAction?.status || "")}?`}
                confirmLabel={confirmAction?.status === "SUSPENDED" ? "Suspend" : confirmAction?.status === "ACTIVE" ? "Approve" : "Confirm"}
                variant={confirmAction?.status === "SUSPENDED" ? "danger" : "default"}
            />
        </div>
    );
}
