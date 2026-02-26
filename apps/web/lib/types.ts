export type City = 'AMMAN' | 'IRBID' | 'AQABA';
export type ServiceType = 'HOT_DESK' | 'PRIVATE_OFFICE' | 'MEETING_ROOM';
export type PricingInterval =
  | 'HOURLY'
  | 'HALF_DAY'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY';

export interface VendorSummary {
  id: string;
  companyName: string;
  logo: string | null;
}

export interface PricingItem {
  id: string;
  interval: PricingInterval;
  price: number;
  currency: string;
}

export interface ServiceItem {
  id: string;
  type: ServiceType;
  name: string;
  description: string | null;
  capacity: number;
  pricing: PricingItem[];
}

export interface BranchListItem {
  id: string;
  name: string;
  city: City;
  address: string;
  description: string | null;
  images: string[];
  vendor: VendorSummary;
  serviceTypes: ServiceType[];
  startingPrice: number | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BranchListResponse {
  data: BranchListItem[];
  meta: PaginationMeta;
}

export interface BranchDetail {
  id: string;
  name: string;
  city: City;
  address: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  vendor: VendorSummary;
  services: ServiceItem[];
}

// ==================== BOOKINGS ====================

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export type PaymentMethod = 'VISA' | 'MASTERCARD' | 'APPLE_PAY' | 'CASH';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface BookingBranch {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface BookingService {
  id: string;
  type: ServiceType;
  name: string;
}

export interface BookingPayment {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt: string | null;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  totalPrice: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  branch: BookingBranch;
  service: BookingService;
  payment: BookingPayment | null;
}

export interface BookingListResponse {
  data: Booking[];
}

export interface AvailabilityResponse {
  available: boolean;
  currentBookings: number;
  capacity: number;
}
