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
