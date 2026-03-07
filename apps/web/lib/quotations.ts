import type { Quotation, PaginatedResponse } from "./types";

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

export async function getQuotations(
  token: string,
  page = 1,
  limit = 20,
  status?: string,
  search?: string,
  branchId?: string,
): Promise<PaginatedResponse<Quotation>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (branchId) params.set("branchId", branchId);
  return apiFetch(`/quotations?${params}`, token);
}

export async function getQuotation(token: string, id: string): Promise<Quotation> {
  return apiFetch(`/quotations/${id}`, token);
}

export async function createQuotation(
  token: string,
  data: {
    customerId: string;
    branchId: string;
    serviceId: string;
    startTime: string;
    endTime: string;
    numberOfPeople: number;
    totalAmount: number;
    notes?: string;
    subtotal?: number;
    discountType?: string;
    discountValue?: number;
    discountAmount?: number;
    taxRate?: number;
    taxAmount?: number;
    lineItems?: { description: string; unitPrice: number; quantity: number; totalPrice: number; sortOrder?: number }[];
  },
): Promise<Quotation> {
  return apiFetch("/quotations", token, { method: "POST", body: JSON.stringify(data) });
}

export async function updateQuotation(
  token: string,
  id: string,
  data: Partial<{
    startTime: string;
    endTime: string;
    numberOfPeople: number;
    totalAmount: number;
    notes: string;
    status: string;
    subtotal: number;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    lineItems: { description: string; unitPrice: number; quantity: number; totalPrice: number; sortOrder?: number }[];
  }>,
): Promise<Quotation> {
  return apiFetch(`/quotations/${id}`, token, { method: "PATCH", body: JSON.stringify(data) });
}

export async function sendQuotation(token: string, id: string): Promise<Quotation> {
  return apiFetch(`/quotations/${id}/send`, token, { method: "POST" });
}

export async function acceptQuotation(token: string, id: string): Promise<Quotation> {
  return apiFetch(`/quotations/${id}/accept`, token, { method: "POST" });
}

export async function rejectQuotation(token: string, id: string): Promise<Quotation> {
  return apiFetch(`/quotations/${id}/reject`, token, { method: "POST" });
}

export async function convertQuotationToBooking(token: string, id: string): Promise<any> {
  return apiFetch(`/quotations/${id}/convert`, token, { method: "POST" });
}
