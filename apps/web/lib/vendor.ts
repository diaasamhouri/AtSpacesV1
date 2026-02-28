import type {
    VendorStats,
    BranchListItem,
    BranchDetail,
    VendorBooking,
    BookingStatus,
} from './types';
import { API_BASE_URL } from './api';

function authHeaders(token: string): HeadersInit {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

// ==================== DASHBOARD ====================

export async function getVendorStats(token: string): Promise<VendorStats> {
    const res = await fetch(`${API_BASE_URL}/vendor/stats`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

// ==================== PROFILE ====================

export async function getVendorProfile(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/vendor/profile`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
}

export async function updateVendorProfile(token: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/vendor/profile`, {
        method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
}

export async function requestVerification(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/vendor/request-verification`, {
        method: 'POST', headers: authHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to request verification');
    return res.json();
}

// ==================== BRANCHES ====================

export async function getVendorBranches(token: string): Promise<{ data: any[] }> {
    const res = await fetch(`${API_BASE_URL}/branches/vendor`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch vendor branches');
    return res.json();
}

export async function getVendorBranchById(token: string, id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/branches/vendor`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch vendor branches');
    const json = await res.json();
    const branch = json.data.find((b: any) => b.id === id);
    if (!branch) throw new Error('Branch not found or access denied');
    return branch;
}

export async function createBranch(token: string, data: any): Promise<BranchDetail> {
    const res = await fetch(`${API_BASE_URL}/branches`, {
        method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create branch');
    return res.json();
}

export async function updateBranch(token: string, id: string, data: any): Promise<BranchDetail> {
    const res = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update branch');
    return res.json();
}

export async function deleteBranch(token: string, id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/branches/${id}`, {
        method: 'DELETE', headers: authHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete branch');
}

// ==================== SERVICES ====================

export async function createService(token: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create service');
    return res.json();
}

export async function deleteService(token: string, id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'DELETE', headers: authHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete service');
}

export async function updateService(token: string, id: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update service');
    return res.json();
}

// ==================== BOOKINGS ====================

export async function getVendorBookings(token: string, params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    const res = await fetch(`${API_BASE_URL}/bookings/vendor${query ? `?${query}` : ''}`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
}

export async function updateBookingStatus(token: string, id: string, status: BookingStatus): Promise<VendorBooking> {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
        method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update booking status');
    return res.json();
}

export async function getVendorCalendar(token: string, searchParams?: URLSearchParams): Promise<any[]> {
    const qs = searchParams ? `?${searchParams.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/vendor/calendar${qs}`, {
        headers: authHeaders(token)
    });
    if (!res.ok) throw new Error('Failed to fetch calendar events');
    return res.json();
}

// ==================== EARNINGS ====================

export async function getVendorEarnings(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/vendor/earnings`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch earnings');
    return res.json();
}

// ==================== ANALYTICS ====================

export async function getVendorAnalytics(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/vendor/analytics`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
}

// ==================== NOTIFICATIONS ====================

export async function getVendorNotifications(token: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/vendor/notifications`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
}

export async function markNotificationRead(token: string, id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/vendor/notifications/${id}/read`, {
        method: 'PATCH', headers: authHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
}

// ==================== REVIEWS ====================

export async function replyToReview(token: string, reviewId: string, vendorReply: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/vendor/reviews/${reviewId}/reply`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ vendorReply }),
    });
    if (!res.ok) throw new Error('Failed to reply to review');
    return res.json();
}

// ==================== PROMOTIONS ====================

export async function getVendorPromoCodes(token: string, params?: { page?: number; limit?: number }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    const res = await fetch(`${API_BASE_URL}/vendor/promotions${query ? `?${query}` : ''}`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch promo codes');
    return res.json();
}

export async function createPromoCode(token: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/vendor/promotions`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create promo code');
    }
    return res.json();
}

export async function updatePromoCode(token: string, promoId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/vendor/promotions/${promoId}`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update promo code');
    }
    return res.json();
}

export async function deletePromoCode(token: string, promoId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/vendor/promotions/${promoId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to delete promo code');
    return res.json();
}
