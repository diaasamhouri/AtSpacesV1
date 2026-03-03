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

export async function getVendorBranches(token: string): Promise<{ data: VendorBranchDetail[] }> {
    return apiFetch<{ data: VendorBranchDetail[] }>('/branches/vendor', { token });
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

export async function getVendorBookings(token: string, params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<PaginatedResponse<VendorBooking>> {
    return apiFetch<PaginatedResponse<VendorBooking>>('/bookings/vendor', {
        token,
        params: {
            page: params?.page,
            limit: params?.limit,
            search: params?.search,
            status: params?.status,
        },
    });
}

export async function updateBookingStatus(token: string, id: string, status: BookingStatus): Promise<VendorBooking> {
    return apiFetch<VendorBooking>(`/bookings/${id}/status`, { method: 'PATCH', token, body: { status } });
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
