import { apiFetch } from './api';
import { Review } from './types';

// ==================== REVIEWS ====================

export interface BranchReviewsResponse {
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
}

export async function getBranchReviews(branchId: string): Promise<BranchReviewsResponse> {
    return apiFetch<BranchReviewsResponse>(`/reviews/branch/${branchId}`, { cache: 'no-store' });
}

export async function createReview(token: string, data: {
    branchId: string; rating: number; comment?: string; bookingId?: string;
}): Promise<Review> {
    return apiFetch<Review>('/reviews', { method: 'POST', token, body: data });
}

export async function deleteReview(token: string, id: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(`/reviews/${id}`, { method: 'DELETE', token });
}

// ==================== FAVORITES ====================

export interface Favorite {
    id: string;
    userId: string;
    branchId: string;
    createdAt: string;
    branch: {
        id: string;
        name: string;
        city: string;
        address: string;
        images: string[];
        amenities: string[];
        vendor: { companyName: string };
        services: {
            type: string;
            price: number;
            pricingMode: string;
            currency?: string;
        }[];
    };
}

export async function getUserFavorites(token: string): Promise<Favorite[]> {
    return apiFetch<Favorite[]>('/favorites', { token });
}

export async function toggleFavorite(token: string, branchId: string): Promise<{ favorited: boolean }> {
    return apiFetch<{ favorited: boolean }>('/favorites/toggle', { method: 'POST', token, body: { branchId } });
}

export async function checkFavorite(token: string, branchId: string): Promise<{ favorited: boolean }> {
    return apiFetch<{ favorited: boolean }>(`/favorites/check/${branchId}`, { token });
}
