import type {
  Booking,
  BookingListResponse,
  AvailabilityResponse,
  PaymentMethod,
} from './types';
import { apiFetch } from './api';

export interface CreateBookingData {
  serviceId: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  paymentMethod: PaymentMethod;
  pricingMode?: string;
  notes?: string;
  promoCode?: string;
  requestedSetup?: string;
}

export async function createBooking(
  token: string,
  data: CreateBookingData,
): Promise<Booking> {
  return apiFetch<Booking>('/bookings', {
    method: 'POST',
    token,
    body: data,
  });
}

export async function getMyBookings(
  token: string,
): Promise<BookingListResponse> {
  return apiFetch<BookingListResponse>('/bookings', { token });
}

export async function getBooking(
  token: string,
  id: string,
): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}`, { token });
}

export async function cancelBooking(
  token: string,
  id: string,
): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}/cancel`, {
    method: 'PATCH',
    token,
  });
}

export async function checkAvailability(
  serviceId: string,
  startTime: string,
  endTime: string,
  numberOfPeople?: number,
): Promise<AvailabilityResponse> {
  const params: Record<string, string> = { serviceId, startTime, endTime };
  if (numberOfPeople !== undefined) {
    params.numberOfPeople = String(numberOfPeople);
  }
  return apiFetch<AvailabilityResponse>('/bookings/check-availability', {
    params,
  });
}

export interface PromoVerifyResponse {
  valid: boolean;
  code: string;
  discountPercent: number;
}

export async function verifyPromoCode(
  code: string,
  serviceId: string,
): Promise<PromoVerifyResponse> {
  return apiFetch<PromoVerifyResponse>('/bookings/verify-promo', {
    params: { code, serviceId },
  });
}
