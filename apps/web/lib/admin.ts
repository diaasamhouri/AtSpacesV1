import { apiFetch } from './api';
import type {
    AdminStats,
    AdminVendor,
    AdminUser,
    AdminBooking,
    AdminPayment,
    AdminBranch,
    AdminApproval,
    AdminNotification,
    RevenueAnalytics,
    BookingAnalytics,
    UserGrowthAnalytics,
    SystemSetting,
    PaginatedResponse,
    AdminVendorDetail,
    AdminBookingDetail,
    AdminBranchDetail,
    AdminService,
    AdminServiceDetail,
    PaymentLogEntry,
    PendingVerification,
} from './types';

// ==================== DASHBOARD ====================

export async function getAdminStats(token: string): Promise<AdminStats> {
    return apiFetch<AdminStats>('/admin/stats', { token });
}

// ==================== VENDORS ====================

export async function getAdminVendors(token: string, params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<AdminVendor>> {
    return apiFetch<PaginatedResponse<AdminVendor>>('/admin/vendors', {
        token, params: { page: params?.page, limit: params?.limit, search: params?.search },
    });
}

export async function getAdminVendorById(token: string, id: string): Promise<AdminVendorDetail> {
    return apiFetch<AdminVendorDetail>(`/admin/vendors/${id}`, { token });
}

export async function updateVendorStatus(
    token: string, id: string, status: string, reason?: string
): Promise<AdminVendor> {
    return apiFetch<AdminVendor>(`/admin/vendors/${id}/status`, {
        method: 'PATCH', token, body: { status, ...(reason ? { reason } : {}) },
    });
}

export async function getPendingVerifications(token: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<PendingVerification>> {
    return apiFetch<PaginatedResponse<PendingVerification>>('/admin/vendors/verification-queue', {
        token, params: { page: params?.page, limit: params?.limit },
    });
}

export async function verifyVendor(
    token: string, id: string, verified: boolean, note?: string
): Promise<AdminVendor> {
    return apiFetch<AdminVendor>(`/admin/vendors/${id}/verify`, {
        method: 'PATCH', token, body: { verified, ...(note ? { note } : {}) },
    });
}

// ==================== USERS ====================

export async function getAdminUsers(token: string, params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<AdminUser>> {
    return apiFetch<PaginatedResponse<AdminUser>>('/admin/users', {
        token, params: { page: params?.page, limit: params?.limit, search: params?.search },
    });
}

export async function createTeamUser(
    token: string, data: { name: string; email: string; password: string; role: string }
): Promise<AdminUser> {
    return apiFetch<AdminUser>('/admin/users', { method: 'POST', token, body: data });
}

export async function toggleUserActive(token: string, id: string): Promise<AdminUser> {
    return apiFetch<AdminUser>(`/admin/users/${id}/toggle-active`, { method: 'PATCH', token });
}

// ==================== ADMIN SERVICES ====================

export async function getAdminServices(token: string, params?: { page?: number; limit?: number; search?: string; branchId?: string; type?: string; floor?: string }): Promise<PaginatedResponse<AdminService>> {
    return apiFetch<PaginatedResponse<AdminService>>('/admin/services', {
        token, params: { page: params?.page, limit: params?.limit, search: params?.search, branchId: params?.branchId, type: params?.type, floor: params?.floor },
    });
}

export async function getAdminServiceById(token: string, id: string): Promise<AdminServiceDetail> {
    return apiFetch<AdminServiceDetail>(`/admin/services/${id}`, { token });
}

export async function createAdminService(token: string, data: Record<string, unknown>): Promise<AdminServiceDetail> {
    return apiFetch<AdminServiceDetail>('/admin/services', { method: 'POST', token, body: data });
}

export async function updateAdminService(token: string, id: string, data: Record<string, unknown>): Promise<AdminServiceDetail> {
    return apiFetch<AdminServiceDetail>(`/admin/services/${id}`, { method: 'PATCH', token, body: data });
}

export async function deleteAdminService(token: string, id: string): Promise<void> {
    await apiFetch(`/admin/services/${id}`, { method: 'DELETE', token });
}

// ==================== BOOKINGS ====================

export async function getAdminBookings(token: string, params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<PaginatedResponse<AdminBooking>> {
    return apiFetch<PaginatedResponse<AdminBooking>>('/admin/bookings', {
        token, params: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status },
    });
}

export async function getAdminBookingById(token: string, id: string): Promise<AdminBookingDetail> {
    return apiFetch<AdminBookingDetail>(`/admin/bookings/${id}`, { token });
}

export async function updateBookingStatus(token: string, id: string, status: string): Promise<AdminBooking> {
    return apiFetch<AdminBooking>(`/admin/bookings/${id}/status`, { method: 'PATCH', token, body: { status } });
}

// ==================== PAYMENTS ====================

export async function getAdminPayments(token: string, params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<PaginatedResponse<AdminPayment>> {
    return apiFetch<PaginatedResponse<AdminPayment>>('/admin/payments', {
        token, params: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status },
    });
}

export async function refundPayment(token: string, id: string): Promise<AdminPayment> {
    return apiFetch<AdminPayment>(`/admin/payments/${id}/refund`, { method: 'PATCH', token });
}

export async function getAdminPaymentLogs(token: string, paymentId: string): Promise<PaymentLogEntry[]> {
    return apiFetch<PaymentLogEntry[]>(`/admin/payments/${paymentId}/logs`, { token });
}

// ==================== BRANCHES ====================

export async function getAdminBranches(token: string, params?: { page?: number; limit?: number; search?: string; status?: string; city?: string }): Promise<PaginatedResponse<AdminBranch>> {
    return apiFetch<PaginatedResponse<AdminBranch>>('/admin/branches', {
        token, params: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status, city: params?.city },
    });
}

export async function getAdminBranchById(token: string, id: string): Promise<AdminBranchDetail> {
    return apiFetch<AdminBranchDetail>(`/admin/branches/${id}`, { token });
}

export async function updateBranchStatus(token: string, id: string, status: string): Promise<AdminBranch> {
    return apiFetch<AdminBranch>(`/admin/branches/${id}/status`, { method: 'PATCH', token, body: { status } });
}

// ==================== APPROVALS ====================

export async function getAdminApprovals(token: string, params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<PaginatedResponse<AdminApproval>> {
    return apiFetch<PaginatedResponse<AdminApproval>>('/admin/approvals', {
        token, params: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status },
    });
}

export async function processApproval(token: string, id: string, status: string, reason?: string): Promise<AdminApproval> {
    return apiFetch<AdminApproval>(`/admin/approvals/${id}`, {
        method: 'PATCH', token, body: { status, ...(reason ? { reason } : {}) },
    });
}

// ==================== NOTIFICATIONS ====================

export async function getAdminNotifications(token: string): Promise<AdminNotification[]> {
    return apiFetch<AdminNotification[]>('/admin/notifications', { token });
}

export async function sendNotification(
    token: string, data: { userId?: string; title: string; message: string }
): Promise<AdminNotification> {
    return apiFetch<AdminNotification>('/admin/notifications/send', { method: 'POST', token, body: data });
}

export async function markAdminNotificationRead(token: string, id: string): Promise<AdminNotification> {
    return apiFetch<AdminNotification>(`/auth/notifications/${id}/read`, { method: 'PATCH', token });
}

export async function markAllAdminNotificationsRead(token: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/notifications/read-all', { method: 'PATCH', token });
}

// ==================== ANALYTICS ====================

export async function getRevenueAnalytics(token: string): Promise<RevenueAnalytics> {
    return apiFetch<RevenueAnalytics>('/admin/analytics/revenue', { token });
}

export async function getBookingAnalytics(token: string): Promise<BookingAnalytics> {
    return apiFetch<BookingAnalytics>('/admin/analytics/bookings', { token });
}

export async function getUserGrowthAnalytics(token: string): Promise<UserGrowthAnalytics> {
    return apiFetch<UserGrowthAnalytics>('/admin/analytics/users', { token });
}

// ==================== SYSTEM SETTINGS ====================

export async function getSystemSettings(token: string): Promise<SystemSetting[]> {
    return apiFetch<SystemSetting[]>('/admin/settings', { token });
}

export async function updateSystemSettings(token: string, settings: { key: string; value: string }[]): Promise<SystemSetting[]> {
    return apiFetch<SystemSetting[]>('/admin/settings', { method: 'PATCH', token, body: { settings } });
}

// ==================== VENDOR COMMISSIONS ====================

export async function updateVendorCommission(token: string, id: string, commissionRate: number | null): Promise<AdminVendor> {
    return apiFetch<AdminVendor>(`/admin/vendors/${id}/commission`, {
        method: 'PATCH', token, body: { commissionRate },
    });
}

// ==================== EXPORTS ====================

export async function exportRevenueCSV(token: string): Promise<string> {
    const data = await apiFetch<{ data: string }>('/admin/export/revenue', { token });
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
