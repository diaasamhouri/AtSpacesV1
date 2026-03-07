"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../../lib/auth-context";
import { getAdminBookings } from "../../../../lib/admin";
import DataTable from "../../../components/ui/data-table";
import type { Column } from "../../../components/ui/data-table";
import type { AdminBooking } from "../../../../lib/types";
import { formatSetupType } from "../../../../lib/types";
import { format } from "date-fns";

export default function AdminNoShowPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getAdminBookings(token, { page, limit: 20, status: "NO_SHOW", search: search || undefined });
      setBookings(res.data);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<AdminBooking>[] = [
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
      exportAccessor: (row) => row.customer?.name || "N/A",
    },
    {
      header: "Branch",
      accessor: (row) => (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{row.branch?.name || "N/A"}</p>
          <p className="text-xs text-slate-500">{row.branch?.vendor || ""}</p>
        </div>
      ),
      exportAccessor: (row) => row.branch?.name || "N/A",
    },
    {
      header: "Service",
      accessor: (row) => (
        <div>
          <span className="text-sm text-slate-600 dark:text-slate-300">{row.service?.name || "N/A"}</span>
          {row.requestedSetup && (
            <span className="ml-2 inline-block rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-xs font-medium">
              {formatSetupType(row.requestedSetup)}
            </span>
          )}
        </div>
      ),
      exportAccessor: (row) => row.requestedSetup ? `${row.service?.name || "N/A"} (${formatSetupType(row.requestedSetup)})` : (row.service?.name || "N/A"),
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
      header: "Total",
      accessor: (row) => <span className="text-sm font-medium text-gray-900 dark:text-white">{row.totalPrice} {row.currency}</span>,
      align: "right",
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">No Show Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">{bookings.length} booking(s) found</p>
      </div>
      <DataTable
        columns={columns}
        data={bookings}
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by customer..."
        exportable
        exportFilename="admin-NO_SHOW-bookings"
        exportTitle="No Show Bookings"
        columnVisibility
        emptyMessage="No no-show bookings found."
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
