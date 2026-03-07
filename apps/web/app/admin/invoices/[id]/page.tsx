"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { getInvoice, updateInvoice } from "../../../../lib/invoices";
import type { Invoice } from "../../../../lib/types";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  ISSUED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PAID: "bg-green-500/10 text-green-400 border-green-500/20",
  OVERDUE: "bg-red-500/10 text-red-400 border-red-500/20",
  CANCELLED: "bg-red-500/10 text-red-300 border-red-500/20",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    getInvoice(token, id)
      .then(setInvoice)
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!token || !id) return;
    try {
      const updated = await updateInvoice(token, id, { status: newStatus });
      setInvoice(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Invoice not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-brand-500 hover:underline text-sm">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-2">&larr; Back</button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{invoice.invoiceNumber}</h1>
        </div>
        <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${STATUS_COLORS[invoice.status] || ""}`}>
          {invoice.status}
        </span>
      </div>

      {/* Invoice details card */}
      <div className="rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Customer</p>
            <p className="text-gray-900 dark:text-white font-medium">{invoice.customer?.name || "N/A"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.customer?.email || ""}</p>
          </div>
          <div>
            <p className="text-slate-500">Booking</p>
            <p className="text-gray-900 dark:text-white font-medium">{invoice.booking?.branch?.name || "N/A"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.booking?.service?.name || ""}</p>
          </div>
          <div>
            <p className="text-slate-500">Booking Period</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {invoice.booking?.startTime ? format(new Date(invoice.booking.startTime), "MMM d, yyyy HH:mm") : "N/A"}
              {" - "}
              {invoice.booking?.endTime ? format(new Date(invoice.booking.endTime), "HH:mm") : ""}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Due Date</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "Not set"}
            </p>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="text-gray-900 dark:text-white">JOD {invoice.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tax</span>
            <span className="text-gray-900 dark:text-white">JOD {invoice.taxAmount}</span>
          </div>
          <hr className="border-slate-200 dark:border-slate-800" />
          <div className="flex justify-between text-base font-bold">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-brand-500">JOD {invoice.totalAmount}</span>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
          <div>Issued: {invoice.issuedAt ? format(new Date(invoice.issuedAt), "MMM d, yyyy") : "Not issued"}</div>
          <div>Paid: {invoice.paidAt ? format(new Date(invoice.paidAt), "MMM d, yyyy") : "Unpaid"}</div>
          <div>Created: {format(new Date(invoice.createdAt), "MMM d, yyyy HH:mm")}</div>
          <div>Updated: {format(new Date(invoice.updatedAt), "MMM d, yyyy HH:mm")}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {invoice.status === "DRAFT" && (
          <button onClick={() => handleStatusChange("ISSUED")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Issue Invoice
          </button>
        )}
        {(invoice.status === "ISSUED" || invoice.status === "OVERDUE") && (
          <button onClick={() => handleStatusChange("PAID")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors">
            Mark as Paid
          </button>
        )}
        {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
          <button onClick={() => handleStatusChange("CANCELLED")} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            Cancel Invoice
          </button>
        )}
      </div>
    </div>
  );
}
