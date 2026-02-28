import { API_BASE_URL } from './api';

function authHeaders(token: string): HeadersInit {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

// ==================== DASHBOARD ====================

export async function getAdminStats(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
}

// ==================== VENDORS ====================

export async function getAdminVendors(token: string, params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    const res = await fetch(`${API_BASE_URL}/admin/vendors${query ? `?${query}` : ''}`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch vendors');
    return res.json();
}

export async function updateVendorStatus(
    token: string, id: string, status: string, reason?: string
): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/vendors/${id}/status`, {
        method: 'PATCH', headers: authHeaders(token),
        body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
    });
    if (!res.ok) throw new Error('Failed to update vendor status');
    return res.json();
}

export async function verifyVendor(
    token: string, id: string, verified: boolean, note?: string
): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/vendors/${id}/verify`, {
        method: 'PATCH', headers: authHeaders(token),
        body: JSON.stringify({ verified, ...(note ? { note } : {}) }),
    });
    if (!res.ok) throw new Error('Failed to verify vendor');
    return res.json();
}

// ==================== USERS ====================

export async function getAdminUsers(token: string, params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    const res = await fetch(`${API_BASE_URL}/admin/users${query ? `?${query}` : ''}`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

export async function createTeamUser(
    token: string, data: { name: string; email: string; password: string; role: string }
): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json().catch(() => null); throw new Error(err?.message || 'Failed to create user'); }
    return res.json();
}

export async function toggleUserActive(token: string, id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/toggle-active`, {
        method: 'PATCH', headers: authHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to toggle user status');
    return res.json();
}

// ==================== BOOKINGS ====================

export async function getAdminBookings(token: string, params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    const res = await fetch(`${API_BASE_URL}/admin/bookings${query ? `?${query}` : ''}`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
}

export async function updateBookingStatus(token: string, id: string, status: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}/status`, {
        method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update booking');
    return res.json();
}

// ==================== PAYMENTS ====================

export async function getAdminPayments(token: string, params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    const res = await fetch(`${API_BASE_URL}/admin/payments${query ? `?${query}` : ''}`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
}

export async function refundPayment(token: string, id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/payments/${id}/refund`, {
        method: 'PATCH', headers: authHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to refund payment');
    return res.json();
}

// ==================== BRANCHES ====================

export async function getAdminBranches(token: string, params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    const res = await fetch(`${API_BASE_URL}/admin/branches${query ? `?${query}` : ''}`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch branches');
    return res.json();
}

export async function updateBranchStatus(token: string, id: string, status: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/branches/${id}/status`, {
        method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update branch status');
    return res.json();
}

// ==================== APPROVALS ====================

export async function getAdminApprovals(token: string, params?: { page?: number; limit?: number }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    const res = await fetch(`${API_BASE_URL}/admin/approvals${query ? `?${query}` : ''}`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch approvals');
    return res.json();
}

export async function processApproval(token: string, id: string, status: string, reason?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/approvals/${id}`, {
        method: 'PATCH', headers: authHeaders(token),
        body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
    });
    if (!res.ok) throw new Error('Failed to process approval');
    return res.json();
}

// ==================== NOTIFICATIONS ====================

export async function getAdminNotifications(token: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/admin/notifications`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
}

export async function sendNotification(
    token: string, data: { userId?: string; title: string; message: string }
): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/notifications/send`, {
        method: 'POST', headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send notification');
    return res.json();
}

// ==================== ANALYTICS ====================

export async function getRevenueAnalytics(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/revenue`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch revenue analytics');
    return res.json();
}

export async function getBookingAnalytics(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/bookings`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch booking analytics');
    return res.json();
}

export async function getUserGrowthAnalytics(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/analytics/users`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch user analytics');
    return res.json();
}

// ==================== SYSTEM SETTINGS ====================

export async function getSystemSettings(token: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/settings`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to fetch system settings');
    return res.json();
}

export async function updateSystemSettings(token: string, settings: { key: string; value: string }[]): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ settings }),
    });
    if (!res.ok) throw new Error('Failed to update system settings');
    return res.json();
}

// ==================== VENDOR COMMISSIONS ====================

export async function updateVendorCommission(token: string, id: string, commissionRate: number | null): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/vendors/${id}/commission`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ commissionRate }),
    });
    if (!res.ok) throw new Error('Failed to update vendor commission');
    return res.json();
}

// ==================== EXPORTS ====================

export async function exportRevenueCSV(token: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/admin/export/revenue`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to export revenue');
    const data = await res.json();
    return data.data;
}

// ==================== PERMISSIONS (Frontend) ====================

export const ADMIN_SECTIONS = {
    DASHBOARD: 'DASHBOARD',
    VENDORS: 'VENDORS',
    BOOKINGS: 'BOOKINGS',
    PAYMENTS: 'PAYMENTS',
    BRANCHES: 'BRANCHES',
    USERS: 'USERS',
    APPROVALS: 'APPROVALS',
    NOTIFICATIONS: 'NOTIFICATIONS',
    ANALYTICS: 'ANALYTICS',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
    ADMIN: Object.values(ADMIN_SECTIONS),
    MODERATOR: ['DASHBOARD', 'VENDORS', 'BOOKINGS', 'BRANCHES', 'APPROVALS', 'NOTIFICATIONS', 'ANALYTICS'],
    ACCOUNTANT: ['DASHBOARD', 'PAYMENTS', 'ANALYTICS'],
};

export function hasAccess(role: string, section: string): boolean {
    return (ROLE_PERMISSIONS[role] || []).includes(section);
}
