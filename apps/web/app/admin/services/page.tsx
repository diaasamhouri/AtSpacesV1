"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { getAdminServices, getAdminBranches, deleteAdminService } from "../../../lib/admin";
import { formatRoomShape, formatSetupType, formatServiceType } from "../../../lib/format";
import { SERVICE_TYPE_OPTIONS } from "../../../lib/types";
import DataTable from "../../components/ui/data-table";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import type { Column } from "../../components/ui/data-table";
import type { AdminService, AdminBranch } from "../../../lib/types";

const SERVICE_TYPES = [
  { value: "", label: "All Types" },
  ...SERVICE_TYPE_OPTIONS,
];

export default function AdminServicesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<AdminService[]>([]);
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [branchFilter, setBranchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20, search: search || undefined };
      if (branchFilter) params.branchId = branchFilter;
      if (typeFilter) params.type = typeFilter;
      if (floorFilter) params.floor = floorFilter;
      const res = await getAdminServices(token, params as any);
      setServices(res.data);
      setTotalPages(res.meta.totalPages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [token, page, search, branchFilter, typeFilter, floorFilter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (!token) return;
    getAdminBranches(token, { limit: 200 }).then((res) => setBranches(res.data)).catch(() => {});
  }, [token]);

  const handleDelete = async () => {
    if (!token || !deleteTarget) return;
    try {
      await deleteAdminService(token, deleteTarget);
      fetchServices();
    } catch {
      // ignore
    }
    setConfirmDeleteOpen(false);
    setDeleteTarget(null);
  };

  const columns: Column<AdminService>[] = [
    { header: "ID", accessor: (row) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{row.id.slice(0, 8)}</span>, exportAccessor: (row) => row.id.slice(0, 8) },
    { header: "Branch", accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.branch.name}</span>, sortable: true, sortKey: "branch", exportAccessor: (row) => row.branch.name },
    { header: "Name", accessor: (row) => <span className="text-sm font-medium text-gray-900 dark:text-white">{row.name}</span>, sortable: true, sortKey: "name", exportAccessor: (row) => row.name },
    { header: "Type", accessor: (row) => <span className="text-xs rounded-full bg-brand-500/10 text-brand-500 px-2 py-0.5">{formatServiceType(row.type)}</span>, exportAccessor: (row) => row.type },
    { header: "Capacity", accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.capacity ?? "-"}</span>, align: "right" as const, exportAccessor: (row) => row.capacity != null ? String(row.capacity) : "-" },
    { header: "Floor", accessor: (row) => <span className="text-sm text-slate-500 dark:text-slate-400">{row.floor || "-"}</span>, exportAccessor: (row) => row.floor || "-" },
    { header: "Shape", accessor: (row) => <span className="text-sm text-slate-500 dark:text-slate-400">{row.shape ? formatRoomShape(row.shape) : "-"}</span>, exportAccessor: (row) => row.shape || "-" },
    { header: "Setup Types", accessor: (row) => <span className="text-sm text-slate-500 dark:text-slate-400">{row.setupConfigs && row.setupConfigs.length > 0 ? row.setupConfigs.map((sc) => formatSetupType(sc.setupType)).join(", ") : "-"}</span>, exportAccessor: (row) => row.setupConfigs && row.setupConfigs.length > 0 ? row.setupConfigs.map((sc) => formatSetupType(sc.setupType)).join(", ") : "-" },
    { header: "Pricing", accessor: (row) => {
      const parts: string[] = [];
      if (row.pricePerBooking != null) parts.push(`${Number(row.pricePerBooking).toFixed(3)}/booking`);
      if (row.pricePerPerson != null) parts.push(`${Number(row.pricePerPerson).toFixed(3)}/person`);
      if (row.pricePerHour != null) parts.push(`${Number(row.pricePerHour).toFixed(3)}/hr`);
      return <span className="text-sm text-slate-600 dark:text-slate-300">{parts.length > 0 ? parts.join(", ") : "\u2014"}</span>;
    }, exportAccessor: (row) => {
      const parts: string[] = [];
      if (row.pricePerBooking != null) parts.push(`${Number(row.pricePerBooking).toFixed(3)}/booking`);
      if (row.pricePerPerson != null) parts.push(`${Number(row.pricePerPerson).toFixed(3)}/person`);
      if (row.pricePerHour != null) parts.push(`${Number(row.pricePerHour).toFixed(3)}/hr`);
      return parts.length > 0 ? parts.join(", ") : "-";
    }},
    { header: "Active", accessor: (row) => row.isActive ? <span className="text-green-400 text-xs font-bold">Active</span> : <span className="text-red-400 text-xs font-bold">Inactive</span>, exportAccessor: (row) => row.isActive ? "Active" : "Inactive" },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex gap-2">
          <button onClick={() => router.push(`/admin/services/${row.id}`)} className="text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">Edit</button>
          <button onClick={() => { setDeleteTarget(row.id); setConfirmDeleteOpen(true); }} className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services (Units)</h1>
        <button
          onClick={() => router.push("/admin/services/new")}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors shadow-[0_4px_12px_rgba(255,91,4,0.4)]"
        >
          + Create Service
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
          <option value="">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
          {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input type="text" placeholder="Filter by floor..." value={floorFilter} onChange={(e) => { setFloorFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 w-40" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={services}
            searchable
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search by name..."
            exportable
            exportFilename="admin-services"
            exportTitle="All Services"
            columnVisibility
            emptyMessage="No services found."
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 disabled:opacity-30">Prev</button>
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 disabled:opacity-30">Next</button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => { setConfirmDeleteOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
