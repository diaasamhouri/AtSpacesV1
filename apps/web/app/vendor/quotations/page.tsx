"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { getQuotations, sendQuotation } from "../../../lib/quotations";
import DataTable from "../../components/ui/data-table";
import type { Column, ActionItem } from "../../components/ui/data-table";
import type { Quotation } from "../../../lib/types";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  NOT_SENT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  SENT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ACCEPTED: "bg-green-500/10 text-green-400 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function QuotationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getQuotations(token, page, 20, statusFilter || undefined, search || undefined);
      setQuotations(res.data);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch {
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSend = async (q: Quotation) => {
    if (!token) return;
    try {
      await sendQuotation(token, q.id);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send");
    }
  };

  const columns: Column<Quotation>[] = [
    {
      header: "Reference #",
      accessor: (row) => <span className="font-mono text-xs text-brand-500">{row.referenceNumber}</span>,
      sortable: true,
      sortKey: "referenceNumber",
      exportAccessor: (row) => row.referenceNumber,
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
      accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.branch?.name}</span>,
      exportAccessor: (row) => row.branch?.name || "",
    },
    {
      header: "Room",
      accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{row.service?.name}</span>,
      exportAccessor: (row) => row.service?.name || "",
    },
    {
      header: "Date",
      accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">{format(new Date(row.createdAt), "MMM d, yyyy")}</span>,
      sortable: true,
      sortKey: "createdAt",
      exportAccessor: (row) => format(new Date(row.createdAt), "MMM d, yyyy"),
    },
    {
      header: "Total",
      accessor: (row) => <span className="text-sm font-medium text-gray-900 dark:text-white">{row.totalAmount} JOD</span>,
      align: "right",
      sortable: true,
      sortKey: "totalAmount",
      exportAccessor: (row) => `${row.totalAmount} JOD`,
    },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status] || ""}`}>
          {row.status.replace("_", " ")}
        </span>
      ),
      exportAccessor: (row) => row.status,
    },
  ];

  const actions: ActionItem<Quotation>[] = [
    {
      label: "View Details",
      onClick: (row) => router.push(`/vendor/quotations/${row.id}`),
    },
    {
      label: "Send Quotation",
      onClick: handleSend,
      hidden: (row) => row.status !== "NOT_SENT",
    },
    {
      label: "Edit",
      onClick: (row) => router.push(`/vendor/quotations/${row.id}`),
      hidden: (row) => row.status === "ACCEPTED" || row.status === "REJECTED",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quotations</h1>
          <p className="text-sm text-slate-500 mt-1">{quotations.length} quotation(s)</p>
        </div>
        <button
          onClick={() => router.push("/vendor/quotations/new")}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          + New Quotation
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["", "NOT_SENT", "SENT", "ACCEPTED", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-dark-850 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-800"}`}
          >
            {s ? s.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={quotations}
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by reference, customer..."
        exportable
        exportFilename="quotations"
        exportTitle="Quotations"
        columnVisibility
        actions={actions}
        emptyMessage="No quotations found."
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
