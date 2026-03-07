import { apiFetch } from './api';
import type { PaginatedResponse } from './types';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export function getNotificationLink(
  notification: { type: string; data: Record<string, unknown> | null },
  userRole: string,
): string | null {
  const d = notification.data;
  if (!d) return null;

  const bookingId = d.bookingId as string | undefined;
  const vendorProfileId = d.vendorProfileId as string | undefined;
  const branchId = d.branchId as string | undefined;
  const reviewId = d.reviewId as string | undefined;

  switch (notification.type) {
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_CANCELLED':
      if (bookingId) {
        if (userRole === 'VENDOR') return '/vendor/bookings/overview';
        if (userRole === 'ADMIN' || userRole === 'MODERATOR') return '/admin/bookings/overview';
        return `/bookings/${bookingId}`;
      }
      return null;

    case 'VENDOR_APPROVED':
    case 'VENDOR_REJECTED':
      return '/vendor/profile';

    case 'APPROVAL_REQUEST':
      if (vendorProfileId) return `/admin/vendors/${vendorProfileId}`;
      return null;

    case 'PAYMENT_SUCCESS':
      if (bookingId) return `/bookings/${bookingId}`;
      return null;

    case 'GENERAL':
    default:
      if (reviewId && branchId) return `/spaces/${branchId}`;
      if (bookingId) {
        if (userRole === 'VENDOR') return '/vendor/bookings/overview';
        if (userRole === 'ADMIN' || userRole === 'MODERATOR') return '/admin/bookings/overview';
        return `/bookings/${bookingId}`;
      }
      if (vendorProfileId) {
        if (userRole === 'VENDOR') return '/vendor/profile';
        if (userRole === 'ADMIN' || userRole === 'MODERATOR') return `/admin/vendors/${vendorProfileId}`;
      }
      return null;
  }
}

export async function getNotifications(
  token: string,
  params?: { page?: number; limit?: number },
): Promise<PaginatedResponse<Notification>> {
  return apiFetch<PaginatedResponse<Notification>>('/auth/notifications', {
    token,
    params: { page: params?.page, limit: params?.limit },
  });
}

export async function markNotificationRead(
  token: string,
  id: string,
): Promise<Notification> {
  return apiFetch<Notification>(`/auth/notifications/${id}/read`, {
    method: 'PATCH',
    token,
  });
}

export async function markAllNotificationsRead(
  token: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/notifications/read-all', {
    method: 'PATCH',
    token,
  });
}
