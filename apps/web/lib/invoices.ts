import type { Invoice, PaginatedResponse, FinancialReport } from "./types";
import { apiFetch } from "./api";

export async function getInvoices(
  token: string,
  page = 1,
  limit = 20,
  status?: string,
  search?: string,
): Promise<PaginatedResponse<Invoice>> {
  return apiFetch("/invoices", {
    token,
    params: {
      page,
      limit,
      status,
      search,
    },
  });
}

export async function getInvoice(token: string, id: string): Promise<Invoice> {
  return apiFetch(`/invoices/${id}`, { token });
}

export async function createInvoice(
  token: string,
  data: {
    bookingId: string;
    customerId: string;
    amount: number;
    taxAmount?: number;
    totalAmount: number;
    dueDate?: string;
  },
): Promise<Invoice> {
  return apiFetch("/invoices", { token, method: "POST", body: data });
}

export async function updateInvoice(
  token: string,
  id: string,
  data: Partial<{
    amount: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    dueDate: string;
  }>,
): Promise<Invoice> {
  return apiFetch(`/invoices/${id}`, { token, method: "PATCH", body: data });
}

export async function getFinancialStats(token: string): Promise<FinancialReport> {
  return apiFetch("/invoices/stats", { token });
}
