import type { Invoice, PaginatedResponse, FinancialReport } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function apiFetch<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getInvoices(
  token: string,
  page = 1,
  limit = 20,
  status?: string,
  search?: string,
): Promise<PaginatedResponse<Invoice>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  return apiFetch(`/invoices?${params}`, token);
}

export async function getInvoice(token: string, id: string): Promise<Invoice> {
  return apiFetch(`/invoices/${id}`, token);
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
  return apiFetch("/invoices", token, { method: "POST", body: JSON.stringify(data) });
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
  return apiFetch(`/invoices/${id}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function getFinancialStats(token: string): Promise<FinancialReport> {
  return apiFetch("/invoices/stats", token);
}
