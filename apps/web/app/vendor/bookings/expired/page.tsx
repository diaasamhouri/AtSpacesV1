"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../../lib/auth-context";
import { getVendorBookings } from "../../../../lib/vendor";
import DataTable from "../../../components/ui/data-table";
import type { Column } from "../../../components/ui/data-table";
import type { VendorBooking } from "../../../../lib/types";
import { formatSetupType } from "../../../../lib/types";
import { format } from "date-fns";

export default function ExpiredBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getVendorBookings(token, { page, limit: 20, status: "EXPIRED", search: search || undefined });
      setBookings(res.data);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<VendorBooking>[] = [
    {
      header: "Ref #",
      accessor: (row) => <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{row.id.slice(0, 8)}</span>,
      sortable: true,
      sortKey: "id",
      exportAccessor: (row) => row.id.slice(0, 8),
    },
    {
      header: "Customer",
      accessor: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{row.customer?.name || "N/A"}</p>
          <p className="text-xs text-slate-500">{row.customer?.email || ""}</p>
        </div>
      ),
      sortable: true,
      sortKey: "customer",
      exportAccessor: (row) => row.customer?.name || "N/A",
    },
    {
      header: "Branch",
      accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.branch.name}</span>,
      sortable: true,
      sortKey: "branch",
      exportAccessor: (row) => row.branch.name,
    },
    {
      header: "Service",
      accessor: (row) => (
        <div>
          <span className="text-sm text-slate-600 dark:text-slate-300">{row.service.name}</span>
          {row.requestedSetup && (
            <span className="ml-2 inline-block rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-xs font-medium">
              {formatSetupType(row.requestedSetup)}
            </span>
          )}
        </div>
      ),
      exportAccessor: (row) => row.requestedSetup ? `${row.service.name} (${formatSetupType(row.requestedSetup)})` : row.service.name,
    },
    {
      header: "Date",
      accessor: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {format(new Date(row.startTime), "MMM d, yyyy")}
        </span>
      ),
      sortable: true,
      sortKey: "startTime",
      exportAccessor: (row) => format(new Date(row.startTime), "MMM d, yyyy"),
    },
    {
      header: "Time",
      accessor: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {format(new Date(row.startTime), "HH:mm")} - {format(new Date(row.endTime), "HH:mm")}
        </span>
      ),
      exportAccessor: (row) => `${format(new Date(row.startTime), "HH:mm")} - ${format(new Date(row.endTime), "HH:mm")}`,
    },
    {
      header: "Total",
      accessor: (row) => <span className="text-sm font-medium text-gray-900 dark:text-white">{row.totalPrice} {row.currency}</span>,
      align: "right",
      sortable: true,
      sortKey: "totalPrice",
      exportAccessor: (row) => `${row.totalPrice} ${row.currency}`,
    },
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expired Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">{bookings.length} booking(s) found</p>
      </div>
      <DataTable
        columns={columns}
        data={bookings}
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by customer name or email..."
        exportable
        exportFilename="EXPIRED-bookings"
        exportTitle="Expired Bookings"
        columnVisibility
        emptyMessage="No expired bookings"
      />
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-dark-850">Previous</button>
          <span className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-dark-850">Next</button>
        </div>
      )}
    </div>
  );
}
