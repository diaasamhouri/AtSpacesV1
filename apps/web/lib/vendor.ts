import type {
    VendorStats,
    BranchListItem,
    BranchDetail,
    VendorBooking,
    BookingStatus,
    VendorProfile,
    VendorEarnings,
    VendorAnalytics,
    VendorNotification,
    VendorCalendarEvent,
    VendorBranchDetail,
    PromoCode,
    Review,
    PaginatedResponse,
    ServiceItem,
    CustomerSearchResult,
    Booking,
    PaymentLogEntry,
    VendorAddOn,
    AuthorizedSignatory,
    CompanyContact,
    DepartmentContact,
    BankingInfo,
} from './types';
import { apiFetch } from './api';

// ==================== DASHBOARD ====================

export async function getVendorStats(token: string): Promise<VendorStats> {
    return apiFetch<VendorStats>('/vendor/stats', { token });
}

// ==================== PROFILE ====================

export async function getVendorProfile(token: string): Promise<VendorProfile> {
    return apiFetch<VendorProfile>('/vendor/profile', { token });
}

export async function updateVendorProfile(token: string, data: Partial<VendorProfile & { socialLinks: Record<string, string> }>): Promise<VendorProfile> {
    return apiFetch<VendorProfile>('/vendor/profile', { method: 'PATCH', token, body: data });
}

export async function requestVerification(token: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/vendor/request-verification', { method: 'POST', token });
}

// ==================== BRANCHES ====================

export async function getVendorBranches(token: string, params?: { unitType?: string }): Promise<{ data: VendorBranchDetail[] }> {
    return apiFetch<{ data: VendorBranchDetail[] }>('/branches/vendor', {
        token,
        params: { unitType: params?.unitType },
    });
}

export async function getVendorBranchById(token: string, id: string): Promise<VendorBranchDetail> {
    const json = await apiFetch<{ data: VendorBranchDetail[] }>('/branches/vendor', { token });
    const branch = json.data.find((b: VendorBranchDetail) => b.id === id);
    if (!branch) throw new Error('Branch not found or access denied');
    return branch;
}

export async function createBranch(token: string, data: Record<string, unknown>): Promise<BranchDetail> {
    return apiFetch<BranchDetail>('/branches', { method: 'POST', token, body: data });
}

export async function updateBranch(token: string, id: string, data: Record<string, unknown>): Promise<BranchDetail> {
    return apiFetch<BranchDetail>(`/branches/${id}`, { method: 'PATCH', token, body: data });
}

export async function deleteBranch(token: string, id: string): Promise<void> {
    return apiFetch<void>(`/branches/${id}`, { method: 'DELETE', token });
}

// ==================== SERVICES ====================

export async function createService(token: string, data: Record<string, unknown>): Promise<ServiceItem> {
    return apiFetch<ServiceItem>('/services', { method: 'POST', token, body: data });
}

export async function deleteService(token: string, id: string): Promise<void> {
    return apiFetch<void>(`/services/${id}`, { method: 'DELETE', token });
}

export async function updateService(token: string, id: string, data: Record<string, unknown>): Promise<ServiceItem> {
    return apiFetch<ServiceItem>(`/services/${id}`, { method: 'PATCH', token, body: data });
}

// ==================== BOOKINGS ====================

export async function getVendorBookings(token: string, params?: { page?: number; limit?: number; search?: string; status?: string; salesApproved?: boolean; accountantApproved?: boolean }): Promise<PaginatedResponse<VendorBooking>> {
    return apiFetch<PaginatedResponse<VendorBooking>>('/bookings/vendor', {
        token,
        params: {
            page: params?.page,
            limit: params?.limit,
            search: params?.search,
            status: params?.status,
            salesApproved: params?.salesApproved !== undefined ? String(params.salesApproved) : undefined,
            accountantApproved: params?.accountantApproved !== undefined ? String(params.accountantApproved) : undefined,
        },
    });
}

export async function updateBookingStatus(token: string, id: string, status: BookingStatus): Promise<VendorBooking> {
    return apiFetch<VendorBooking>(`/bookings/${id}/status`, { method: 'PATCH', token, body: { status } });
}

export async function getVendorBookingById(
    token: string,
    bookingId: string,
): Promise<VendorBooking> {
    return apiFetch<VendorBooking>(`/vendor/bookings/${bookingId}`, { token });
}

export async function updateVendorBooking(
    token: string,
    bookingId: string,
    data: {
        branchId?: string;
        serviceId?: string;
        startTime?: string;
        endTime?: string;
        numberOfPeople?: number;
        notes?: string;
        requestedSetup?: string;
        pricingMode?: string;
        addOns?: { vendorAddOnId: string; quantity: number; serviceTime?: string; comments?: string }[];
        discountType?: string;
        discountValue?: number;
        subjectToTax?: boolean;
    },
): Promise<VendorBooking> {
    return apiFetch<VendorBooking>(`/vendor/bookings/${bookingId}`, {
        token,
        method: 'PATCH',
        body: data,
    });
}

export async function approveSales(token: string, bookingId: string): Promise<VendorBooking> {
    return apiFetch<VendorBooking>(`/bookings/${bookingId}/approve-sales`, { method: 'PATCH', token });
}

export async function approveAccountant(token: string, bookingId: string): Promise<VendorBooking> {
    return apiFetch<VendorBooking>(`/bookings/${bookingId}/approve-accountant`, { method: 'PATCH', token });
}

export async function getVendorCalendar(token: string, searchParams?: URLSearchParams): Promise<VendorCalendarEvent[]> {
    const params: Record<string, string> = {};
    if (searchParams) {
        searchParams.forEach((value, key) => { params[key] = value; });
    }
    return apiFetch<VendorCalendarEvent[]>('/vendor/calendar', { token, params });
}

// ==================== EARNINGS ====================

export async function getVendorEarnings(token: string): Promise<VendorEarnings> {
    return apiFetch<VendorEarnings>('/vendor/earnings', { token });
}

// ==================== ANALYTICS ====================

export async function getVendorAnalytics(token: string): Promise<VendorAnalytics> {
    return apiFetch<VendorAnalytics>('/vendor/analytics', { token });
}

// ==================== NOTIFICATIONS ====================

export async function getVendorNotifications(token: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<VendorNotification>> {
    return apiFetch<PaginatedResponse<VendorNotification>>('/vendor/notifications', {
        token,
        params: { page: params?.page, limit: params?.limit },
    });
}

export async function markNotificationRead(token: string, id: string): Promise<VendorNotification> {
    return apiFetch<VendorNotification>(`/vendor/notifications/${id}/read`, { method: 'PATCH', token });
}

// ==================== REVIEWS ====================

export async function getVendorReviews(token: string): Promise<Review[]> {
    return apiFetch<Review[]>('/vendor/reviews', { token });
}

export async function replyToReview(token: string, reviewId: string, vendorReply: string): Promise<Review> {
    return apiFetch<Review>(`/vendor/reviews/${reviewId}/reply`, { method: 'PATCH', token, body: { vendorReply } });
}

export async function deleteReviewReply(token: string, reviewId: string): Promise<void> {
    return apiFetch<void>(`/vendor/reviews/${reviewId}/reply`, { method: 'DELETE', token });
}

// ==================== PROMOTIONS ====================

export async function getVendorPromoCodes(token: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<PromoCode>> {
    return apiFetch<PaginatedResponse<PromoCode>>('/vendor/promotions', {
        token,
        params: { page: params?.page, limit: params?.limit },
    });
}

export async function createPromoCode(token: string, data: Record<string, unknown>): Promise<PromoCode> {
    return apiFetch<PromoCode>('/vendor/promotions', { method: 'POST', token, body: data });
}

export async function updatePromoCode(token: string, promoId: string, data: Record<string, unknown>): Promise<PromoCode> {
    return apiFetch<PromoCode>(`/vendor/promotions/${promoId}`, { method: 'PATCH', token, body: data });
}

export async function deletePromoCode(token: string, promoId: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/vendor/promotions/${promoId}`, { method: 'DELETE', token });
}

// ==================== PAYMENTS ====================

export async function collectVendorPayment(token: string, bookingId: string, options?: { receiptNumber?: string; notes?: string }): Promise<{ id: string; method: string; status: string; amount: number; currency: string; paidAt: string | null }> {
    return apiFetch(`/vendor/payments/${bookingId}/collect`, { method: 'PATCH', token, body: options || {} });
}

export async function bulkCollectVendorPayments(token: string, bookingIds: string[], options?: { receiptNumber?: string; notes?: string }): Promise<{ collected: number; bookingIds: string[] }> {
    return apiFetch('/vendor/payments/bulk-collect', { method: 'POST', token, body: { bookingIds, ...options } });
}

export async function getVendorPaymentLogs(token: string, bookingId: string): Promise<PaymentLogEntry[]> {
    return apiFetch<PaymentLogEntry[]>(`/vendor/payments/${bookingId}/logs`, { token });
}

// ==================== CUSTOMER SEARCH ====================

export async function searchVendorCustomers(token: string, search: string, limit = 10): Promise<{ data: CustomerSearchResult[] }> {
    return apiFetch<{ data: CustomerSearchResult[] }>('/vendor/customers', {
        token,
        params: { search, limit },
    });
}

// ==================== SIGNATORY CRUD ====================

export async function addSignatory(token: string, data: Record<string, unknown>): Promise<AuthorizedSignatory> {
    return apiFetch<AuthorizedSignatory>('/vendor/profile/signatories', { method: 'POST', token, body: data });
}

export async function updateSignatory(token: string, id: string, data: Record<string, unknown>): Promise<AuthorizedSignatory> {
    return apiFetch<AuthorizedSignatory>(`/vendor/profile/signatories/${id}`, { method: 'PATCH', token, body: data });
}

export async function deleteSignatory(token: string, id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/vendor/profile/signatories/${id}`, { method: 'DELETE', token });
}

// ==================== COMPANY CONTACT CRUD ====================

export async function addCompanyContact(token: string, data: Record<string, unknown>): Promise<CompanyContact> {
    return apiFetch<CompanyContact>('/vendor/profile/company-contacts', { method: 'POST', token, body: data });
}

export async function updateCompanyContact(token: string, id: string, data: Record<string, unknown>): Promise<CompanyContact> {
    return apiFetch<CompanyContact>(`/vendor/profile/company-contacts/${id}`, { method: 'PATCH', token, body: data });
}

export async function deleteCompanyContact(token: string, id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/vendor/profile/company-contacts/${id}`, { method: 'DELETE', token });
}

// ==================== DEPARTMENT CONTACT CRUD ====================

export async function addDepartmentContact(token: string, data: Record<string, unknown>): Promise<DepartmentContact> {
    return apiFetch<DepartmentContact>('/vendor/profile/department-contacts', { method: 'POST', token, body: data });
}

export async function updateDepartmentContact(token: string, id: string, data: Record<string, unknown>): Promise<DepartmentContact> {
    return apiFetch<DepartmentContact>(`/vendor/profile/department-contacts/${id}`, { method: 'PATCH', token, body: data });
}

export async function deleteDepartmentContact(token: string, id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/vendor/profile/department-contacts/${id}`, { method: 'DELETE', token });
}

// ==================== BANKING INFO CRUD ====================

export async function addBankingInfo(token: string, data: Record<string, unknown>): Promise<BankingInfo> {
    return apiFetch<BankingInfo>('/vendor/profile/banking-info', { method: 'POST', token, body: data });
}

export async function updateBankingInfo(token: string, id: string, data: Record<string, unknown>): Promise<BankingInfo> {
    return apiFetch<BankingInfo>(`/vendor/profile/banking-info/${id}`, { method: 'PATCH', token, body: data });
}

export async function deleteBankingInfo(token: string, id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/vendor/profile/banking-info/${id}`, { method: 'DELETE', token });
}

// ==================== VENDOR BOOKING CREATION ====================

export async function createVendorBooking(token: string, data: {
    customerId: string;
    branchId: string;
    days: {
        date: string;
        startTime: string;
        endTime: string;
        serviceId: string;
        setupType?: string;
        unitPrice?: number;
        numberOfPeople?: number;
        notes?: string;
        addOns?: { vendorAddOnId: string; quantity: number; serviceTime?: string; comments?: string }[];
    }[];
    subjectToTax?: boolean;
    discountType?: string;
    discountValue?: number;
    promoCode?: string;
    notes?: string;
}): Promise<{ bookingIds: string[]; bookingGroupId: string; financialSummary: { subtotal: number; discount: number; tax: number; total: number } }> {
    return apiFetch('/vendor/bookings/create', { method: 'POST', token, body: data });
}

// ==================== VENDOR ADD-ONS ====================

export async function getVendorAddOns(token: string): Promise<VendorAddOn[]> {
    return apiFetch<VendorAddOn[]>('/vendor/addons', { token });
}

export async function createVendorAddOn(token: string, data: { name: string; nameAr?: string; unitPrice: number }): Promise<VendorAddOn> {
    return apiFetch<VendorAddOn>('/vendor/addons', { method: 'POST', token, body: data });
}

export async function updateVendorAddOn(token: string, id: string, data: Partial<{ name: string; nameAr: string; unitPrice: number; isActive: boolean }>): Promise<VendorAddOn> {
    return apiFetch<VendorAddOn>(`/vendor/addons/${id}`, { method: 'PATCH', token, body: data });
}

export async function deleteVendorAddOn(token: string, id: string): Promise<void> {
    return apiFetch<void>(`/vendor/addons/${id}`, { method: 'DELETE', token });
}

// ==================== CREATE CUSTOMER ====================

export async function createCustomerInline(token: string, data: { name: string; email?: string; phone?: string; entityType?: string }): Promise<CustomerSearchResult & { isNew: boolean }> {
    return apiFetch<CustomerSearchResult & { isNew: boolean }>('/vendor/customers', { method: 'POST', token, body: data });
}

// ==================== PROMO CODE VALIDATION ====================

export async function validatePromoCode(token: string, code: string, branchId?: string): Promise<{ valid: boolean; discountPercent: number; message: string; promoCodeId?: string }> {
    return apiFetch('/vendor/promo-codes/validate', { method: 'POST', token, body: { code, branchId } });
}
