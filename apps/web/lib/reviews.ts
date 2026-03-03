import { apiFetch } from './api';

// ==================== REVIEWS ====================

export async function getBranchReviews(branchId: string) {
    return apiFetch<any>(`/reviews/branch/${branchId}`, { cache: 'no-store' } as any);
}

export async function createReview(token: string, data: {
    branchId: string; rating: number; comment?: string; bookingId?: string;
}) {
    return apiFetch<any>('/reviews', { method: 'POST', token, body: data });
}

export async function deleteReview(token: string, id: string) {
    return apiFetch<any>(`/reviews/${id}`, { method: 'DELETE', token });
}

// ==================== FAVORITES ====================

export async function getUserFavorites(token: string) {
    return apiFetch<any>('/favorites', { token });
}

export async function toggleFavorite(token: string, branchId: string) {
    return apiFetch<any>('/favorites/toggle', { method: 'POST', token, body: { branchId } });
}

export async function checkFavorite(token: string, branchId: string) {
    return apiFetch<any>(`/favorites/check/${branchId}`, { token });
}
