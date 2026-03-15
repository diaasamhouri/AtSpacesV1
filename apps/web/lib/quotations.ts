import type { Quotation, PaginatedResponse } from "./types";
import { apiFetch } from "./api";

export async function getQuotations(
  token: string,
  page = 1,
  limit = 20,
  status?: string,
  search?: string,
  branchId?: string,
): Promise<PaginatedResponse<Quotation>> {
  return apiFetch("/quotations", {
    token,
    params: {
      page,
      limit,
      status,
      search,
      branchId,
    },
  });
}

export async function getQuotation(token: string, id: string): Promise<Quotation> {
  return apiFetch(`/quotations/${id}`, { token });
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
    pricingMode?: string;
    lineItems?: { description: string; unitPrice: number; quantity: number; totalPrice: number; sortOrder?: number }[];
    addOns?: { vendorAddOnId: string; quantity: number; serviceTime?: string; comments?: string }[];
  },
): Promise<Quotation> {
  return apiFetch("/quotations", { token, method: "POST", body: data });
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
    pricingMode: string;
    lineItems: { description: string; unitPrice: number; quantity: number; totalPrice: number; sortOrder?: number }[];
    addOns: { vendorAddOnId: string; quantity: number; serviceTime?: string; comments?: string }[];
  }>,
): Promise<Quotation> {
  return apiFetch(`/quotations/${id}`, { token, method: "PATCH", body: data });
}

export async function sendQuotation(token: string, id: string): Promise<Quotation> {
  return apiFetch(`/quotations/${id}/send`, { token, method: "POST" });
}

export async function acceptQuotation(token: string, id: string): Promise<Quotation> {
  return apiFetch(`/quotations/${id}/accept`, { token, method: "POST" });
}

export async function rejectQuotation(token: string, id: string): Promise<Quotation> {
  return apiFetch(`/quotations/${id}/reject`, { token, method: "POST" });
}

export async function convertQuotationToBooking(token: string, id: string): Promise<any> {
  return apiFetch(`/quotations/${id}/convert`, { token, method: "POST" });
}

export async function deleteQuotation(token: string, id: string) {
  return apiFetch(`/quotations/${id}`, { method: 'DELETE', token });
}
