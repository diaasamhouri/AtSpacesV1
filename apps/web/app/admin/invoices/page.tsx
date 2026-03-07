"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { getInvoices, updateInvoice } from "../../../lib/invoices";
import DataTable from "../../components/ui/data-table";
import type { Column, ActionItem } from "../../components/ui/data-table";
import type { Invoice } from "../../../lib/types";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  ISSUED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PAID: "bg-green-500/10 text-green-400 border-green-500/20",
  OVERDUE: "bg-red-500/10 text-red-400 border-red-500/20",
  CANCELLED: "bg-red-500/10 text-red-300 border-red-500/20",
};

export default function InvoicesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getInvoices(token, page, 20, statusFilter || undefined, search || undefined);
      setInvoices(res.data);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    if (!token) return;
    try {
      await updateInvoice(token, invoice.id, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const columns: Column<Invoice>[] = [
    {
      header: "Invoice #",
      accessor: (row) => <span className="font-mono text-xs text-brand-500">{row.invoiceNumber}</span>,
      sortable: true,
      sortKey: "invoiceNumber",
      exportAccessor: (row) => row.invoiceNumber,
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
      header: "Booking",
      accessor: (row) => (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{row.booking?.branch?.name || "N/A"}</p>
          <p className="text-xs text-slate-500">{row.booking?.service?.name || ""}</p>
        </div>
      ),
      exportAccessor: (row) => row.booking?.branch?.name || "N/A",
    },
    {
      header: "Amount",
      accessor: (row) => <span className="text-sm text-slate-600 dark:text-slate-300">JOD {row.amount}</span>,
      exportAccessor: (row) => `JOD ${row.amount}`,
    },
    {
      header: "Tax",
      accessor: (row) => <span className="text-sm text-slate-500 dark:text-slate-400">JOD {row.taxAmount}</span>,
      exportAccessor: (row) => `JOD ${row.taxAmount}`,
    },
    {
      header: "Total",
      accessor: (row) => <span className="text-sm font-medium text-gray-900 dark:text-white">JOD {row.totalAmount}</span>,
      align: "right",
      sortable: true,
      sortKey: "totalAmount",
      exportAccessor: (row) => `JOD ${row.totalAmount}`,
    },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status] || ""}`}>
          {row.status}
        </span>
      ),
      exportAccessor: (row) => row.status,
    },
    {
      header: "Due Date",
      accessor: (row) => (
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {row.dueDate ? format(new Date(row.dueDate), "MMM d, yyyy") : "-"}
        </span>
      ),
      exportAccessor: (row) => row.dueDate ? format(new Date(row.dueDate), "MMM d, yyyy") : "-",
    },
  ];

  const actions: ActionItem<Invoice>[] = [
    { label: "View Details", onClick: (row) => router.push(`/admin/invoices/${row.id}`) },
    { label: "Mark as Issued", onClick: (row) => handleStatusChange(row, "ISSUED"), hidden: (row) => row.status !== "DRAFT" },
    { label: "Mark as Paid", onClick: (row) => handleStatusChange(row, "PAID"), hidden: (row) => row.status !== "ISSUED" && row.status !== "OVERDUE" },
    { label: "Cancel", onClick: (row) => handleStatusChange(row, "CANCELLED"), hidden: (row) => row.status === "PAID" || row.status === "CANCELLED" },
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["", "DRAFT", "ISSUED", "PAID", "OVERDUE", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? "bg-brand-500 text-white" : "bg-white dark:bg-dark-850 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        searchable
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by invoice number, customer..."
        exportable
        exportFilename="invoices"
        exportTitle="Invoices"
        columnVisibility
        actions={actions}
        emptyMessage="No invoices found."
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
