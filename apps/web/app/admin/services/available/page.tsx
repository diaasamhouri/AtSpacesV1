"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../../lib/auth-context";
import DataTable from "../../../components/ui/data-table";
import type { Column } from "../../../components/ui/data-table";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AvailableServiceItem {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  netSize: number | null;
  weight: number | null;
  branchName: string;
  availableSince: string;
}

export default function AvailableServicesPage() {
  const { token } = useAuth();
  const [services, setServices] = useState<AvailableServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/branches`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(async (data) => {
        const allServices: AvailableServiceItem[] = [];
        const branches = data.data || [];
        for (const branch of branches) {
          try {
            const detail = await fetch(`${API}/admin/branches/${branch.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then((r) => r.json());
            if (detail.services) {
              for (const s of detail.services) {
                if (s.isActive !== false) {
                  allServices.push({
                    id: s.id,
                    name: s.name,
                    type: s.type,
                    capacity: s.capacity,
                    netSize: s.netSize ?? null,
                    weight: s.weight ?? null,
                    branchName: branch.name,
                    availableSince: s.createdAt || new Date().toISOString(),
                  });
                }
              }
            }
          } catch {}
        }
        setServices(allServices);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const filtered = search
    ? services.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.branchName.toLowerCase().includes(search.toLowerCase())
      )
    : services;

  const columns: Column<AvailableServiceItem>[] = [
    { header: "ID", accessor: (row) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{row.id.slice(0, 8)}</span>, exportAccessor: (row) => row.id.slice(0, 8) },
    { header: "Branch", accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.branchName}</span>, sortable: true, sortKey: "branch", exportAccessor: (row) => row.branchName },
    { header: "Name", accessor: (row) => <span className="text-sm font-medium text-gray-900 dark:text-white">{row.name}</span>, sortable: true, sortKey: "name", exportAccessor: (row) => row.name },
    { header: "Type", accessor: (row) => <span className="text-xs rounded-full bg-brand-500/10 text-brand-500 px-2 py-0.5">{row.type.replace("_", " ")}</span>, exportAccessor: (row) => row.type },
    { header: "Capacity", accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.capacity ?? "-"}</span>, align: "right" as const, exportAccessor: (row) => row.capacity != null ? String(row.capacity) : "-" },
    { header: "Net Size", accessor: (row) => <span className="text-sm text-slate-500 dark:text-slate-400">{row.netSize ?? "-"}</span>, exportAccessor: (row) => row.netSize ? String(row.netSize) : "-" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Available Services</h1>
      <DataTable
        columns={columns}
        data={filtered}
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or branch..."
        exportable
        exportFilename="available-services"
        exportTitle="Available Services"
        columnVisibility
        emptyMessage="No available services found."
      />
    </div>
  );
}
