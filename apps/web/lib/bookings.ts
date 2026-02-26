import type {
  Booking,
  BookingListResponse,
  AvailabilityResponse,
  PricingInterval,
  PaymentMethod,
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export interface CreateBookingData {
  serviceId: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  pricingInterval: PricingInterval;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export async function createBooking(
  token: string,
  data: CreateBookingData,
): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || 'Failed to create booking');
  }

  return res.json();
}

export async function getMyBookings(
  token: string,
): Promise<BookingListResponse> {
  const res = await fetch(`${API_BASE_URL}/bookings`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch bookings');
  }

  return res.json();
}

export async function getBooking(
  token: string,
  id: string,
): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch booking');
  }

  return res.json();
}

export async function cancelBooking(
  token: string,
  id: string,
): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || 'Failed to cancel booking');
  }

  return res.json();
}

export async function checkAvailability(
  serviceId: string,
  startTime: string,
  endTime: string,
): Promise<AvailabilityResponse> {
  const params = new URLSearchParams({ serviceId, startTime, endTime });
  const res = await fetch(
    `${API_BASE_URL}/bookings/check-availability?${params}`,
  );

  if (!res.ok) {
    throw new Error('Failed to check availability');
  }

  return res.json();
}
