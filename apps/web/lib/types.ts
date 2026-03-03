export type City = 'AMMAN' | 'IRBID' | 'AQABA';
export type ServiceType = 'HOT_DESK' | 'PRIVATE_OFFICE' | 'MEETING_ROOM' | 'EVENT_SPACE';
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
  operatingHours: Record<string, { open: string; close: string } | null> | null;
}

// ==================== BOOKINGS ====================

export type BookingStatus =
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED'
  | 'REJECTED';

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

export interface SuggestedSlot {
  startTime: string;
  endTime: string;
  label: string;
}

export interface AvailabilityResponse {
  available: boolean;
  currentBookings: number;
  capacity: number;
  remainingSpots: number;
  reason?: string;
  operatingHoursForDay?: { open: string; close: string } | null;
  suggestedSlots?: SuggestedSlot[];
}

// ==================== VENDOR ====================

export interface VendorStats {
  companyName: string;
  status: string;
  stats: {
    branches: number;
    services: number;
    activeBookings: number;
    totalRevenue: number;
    grossRevenue: number;
    commissionRate: number;
    commissionAmount: number;
    netRevenue: number;
  };
}

export interface VendorBooking extends Booking {
  customer?: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

// ==================== GENERIC ====================

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ==================== ADMIN ====================

export type VendorStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type BranchStatus = 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW';
export type UserRole = 'ADMIN' | 'MODERATOR' | 'ACCOUNTANT' | 'VENDOR' | 'CUSTOMER';
export type ApprovalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type NotificationType = 'SYSTEM' | 'BOOKING' | 'VENDOR' | 'PAYMENT' | 'ADMIN';

export interface AdminVendor {
  id: string;
  companyName: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  images: string[];
  amenities: string[];
  status: VendorStatus;
  isVerified: boolean;
  commissionRate: number | null;
  rejectionReason: string | null;
  branchesCount: number;
  createdAt: string;
  owner: { name: string | null; email: string; } | null;
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AdminBooking {
  id: string;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  totalPrice: number;
  currency: string;
  customer: { name: string | null; email: string | null; } | null;
  branch: { name: string; vendor: string; } | null;
  service: { name: string; type: ServiceType; } | null;
}

export interface AdminPayment {
  id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  commissionRate: number;
  commissionAmount: number;
  vendorEarnings: number;
  booking: {
    customer: { name: string | null; email: string | null; } | null;
    vendor: string;
    branch: string;
  } | null;
}

export interface AdminBranch {
  id: string;
  name: string;
  address: string;
  city: City;
  status: BranchStatus;
  vendor: string;
  servicesCount: number;
  bookingsCount: number;
  createdAt: string;
}

export interface AdminApproval {
  id: string;
  type: string;
  status: ApprovalRequestStatus;
  description: string | null;
  reason: string | null;
  vendor: string;
  branch: string;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  user: { name: string | null; email: string | null; } | null;
}

export interface AdminStats {
  totalVendors: number;
  totalBranches: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeUsers: number;
  platformRevenue: number;
  vendorPayouts: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  monthlyRevenue: { month: string; revenue: number }[];
  monthly: { month: string; total: number; gross: number; commission: number; net: number }[];
  topVendors: { vendor: string; revenue: number }[];
}

export interface BookingAnalytics {
  totalBookings: number;
  monthlyBookings: { month: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byServiceType: { type: string; count: number }[];
}

export interface UserGrowthAnalytics {
  totalUsers: number;
  monthlySignups: { month: string; count: number }[];
  byRole: { role: string; count: number }[];
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

// ==================== VENDOR DASHBOARD ====================

export interface VendorProfile {
  id: string;
  companyName: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  images: string[];
  socialLinks: Record<string, string> | null;
  status: VendorStatus;
  isVerified: boolean;
}

export interface VendorEarnings {
  totalEarnings: number;
  monthlyEarnings: { month: string; amount: number }[];
  byBranch: { branch: string; amount: number }[];
}

export interface VendorAnalytics {
  totalBookings: number;
  totalRevenue: number;
  monthlyBookings: { month: string; count: number }[];
  popularServices: { service: string; count: number }[];
}

export interface VendorNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  validUntil: string | null;
  branch: { id: string; name: string } | null;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  vendorReply: string | null;
  replyCreatedAt: string | null;
  createdAt: string;
  branchName?: string;
  user: { name: string | null; image: string | null } | null;
}

export interface VendorBranchDetail {
  id: string;
  name: string;
  address: string;
  city: City;
  phone: string | null;
  email: string | null;
  status: BranchStatus;
  autoAcceptBookings: boolean;
  amenities: string[];
  operatingHours: Record<string, { open: string; close: string } | null> | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  images: string[];
  services: ServiceItem[];
}

export interface VendorCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  branchName: string;
  serviceName: string;
  status: BookingStatus;
  extendedProps?: {
    status: BookingStatus;
    branchName: string;
    customerEmail: string | null;
    numberOfPeople: number;
    totalPrice: number;
    notes: string | null;
  };
}

// ==================== ADMIN DETAIL TYPES ====================

export interface AdminVendorDetail {
  id: string;
  companyName: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  images: string[];
  status: VendorStatus;
  isVerified: boolean;
  commissionRate: number | null;
  rejectionReason: string | null;
  createdAt: string;
  owner: { name: string | null; email: string; phone: string | null } | null;
  branches: {
    id: string;
    name: string;
    city: City;
    address: string;
    status: BranchStatus;
    servicesCount: number;
    bookingsCount: number;
  }[];
}

export interface AdminBookingDetail {
  id: string;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  totalPrice: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  customer: { id: string; name: string | null; email: string | null; phone: string | null } | null;
  branch: { id: string; name: string; city: City; address: string; vendor: string } | null;
  service: { id: string; name: string; type: ServiceType } | null;
  payment: {
    id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: number;
    currency: string;
    paidAt: string | null;
    createdAt: string;
  } | null;
}

export interface AdminBranchDetail {
  id: string;
  name: string;
  address: string;
  city: City;
  status: BranchStatus;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  amenities: string[];
  operatingHours: Record<string, { open: string; close: string } | null> | null;
  googleMapsUrl: string | null;
  autoAcceptBookings: boolean;
  createdAt: string;
  vendor: { id: string; companyName: string; status: VendorStatus };
  services: {
    id: string;
    name: string;
    type: ServiceType;
    capacity: number;
    pricing: { interval: string; price: number; currency: string }[];
  }[];
}

