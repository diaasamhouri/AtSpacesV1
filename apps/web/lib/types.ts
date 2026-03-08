export type City = 'AMMAN' | 'IRBID' | 'AQABA';
export type ServiceType = 'HOT_DESK' | 'PRIVATE_OFFICE' | 'MEETING_ROOM' | 'EVENT_SPACE';
export type RoomShape = 'L_SHAPE' | 'U_SHAPE' | 'RECTANGLE' | 'SQUARE' | 'OVAL' | 'CUSTOM';
export type SetupType = 'CLASSROOM' | 'THEATER' | 'BOARDROOM' | 'U_SHAPE_SEATING' | 'HOLLOW_SQUARE' | 'BANQUET';
export type PricingInterval =
  | 'HOURLY'
  | 'HALF_DAY'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY';
export type PricingMode = 'PER_BOOKING' | 'PER_PERSON' | 'PER_HOUR';

export interface VendorSummary {
  id: string;
  companyName: string;
  logo: string | null;
  isVerified?: boolean;
  socialLinks?: Record<string, string>;
}

export interface PricingItem {
  id: string;
  interval: PricingInterval;
  pricingMode?: PricingMode;
  price: number;
  currency: string;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface SetupConfig {
  setupType: SetupType;
  minPeople: number;
  maxPeople: number;
}

export interface ServiceItem {
  id: string;
  type: ServiceType;
  name: string;
  unitNumber: string | null;
  description: string | null;
  capacity: number | null;
  floor: string | null;
  profileNameEn: string | null;
  profileNameAr: string | null;
  weight: number | null;
  netSize: number | null;
  shape: RoomShape | null;
  features: string[];
  minCapacity?: number;
  isActive?: boolean;
  isPublic?: boolean;
  pricing: PricingItem[];
  setupConfigs: SetupConfig[];
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
  startingPricingMode?: PricingMode | null;
  startingPricingInterval?: PricingInterval | null;
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
  amenities: string[];
  googleMapsUrl: string | null;
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
  | 'REJECTED'
  | 'EXPIRED';

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
  requestedSetup?: string | null;
  pricingInterval?: PricingInterval | null;
  pricingMode?: PricingMode | null;
  unitPrice?: number | null;
  subtotal?: number | null;
  discountType?: DiscountType;
  discountValue?: number | null;
  discountAmount?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  bookingGroupId?: string | null;
  addOns?: BookingAddOnItem[];
  createdAt: string;
  branch: BookingBranch;
  service: BookingService;
  payment: BookingPayment | null;
}

/** Service types that use setup configurations (room arrangements) */
export const SETUP_ELIGIBLE_TYPES: ServiceType[] = ['MEETING_ROOM', 'EVENT_SPACE'];
/** Service types that use simple min/max capacity */
export const SIMPLE_CAPACITY_TYPES: ServiceType[] = ['HOT_DESK', 'PRIVATE_OFFICE'];

export const SERVICE_TYPE_OPTIONS = [
  { value: 'HOT_DESK', label: 'Hot Desk' },
  { value: 'PRIVATE_OFFICE', label: 'Private Office' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'EVENT_SPACE', label: 'Event Space' },
] as const;

export const ROOM_SHAPE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'L_SHAPE', label: 'L-Shape' },
  { value: 'U_SHAPE', label: 'U-Shape' },
  { value: 'RECTANGLE', label: 'Rectangle' },
  { value: 'SQUARE', label: 'Square' },
  { value: 'OVAL', label: 'Oval' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

export const SETUP_TYPES = [
  { value: 'CLASSROOM', label: 'Classroom' },
  { value: 'THEATER', label: 'Theater' },
  { value: 'BOARDROOM', label: 'Boardroom' },
  { value: 'U_SHAPE_SEATING', label: 'U-Shape Seating' },
  { value: 'HOLLOW_SQUARE', label: 'Hollow Square' },
  { value: 'BANQUET', label: 'Banquet' },
] as const;

export function isSetupEligible(type: string): boolean {
  return SETUP_ELIGIBLE_TYPES.includes(type as ServiceType);
}

export function isSimpleCapacity(type: string): boolean {
  return SIMPLE_CAPACITY_TYPES.includes(type as ServiceType);
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

// ==================== CUSTOMER SEARCH ====================

export interface CustomerSearchResult {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  entityType?: EntityType | null;
  customerClassification?: CustomerClassification | null;
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
  entityType: EntityType | null;
  gender: Gender | null;
  nationality: string | null;
  customerClassification: CustomerClassification | null;
  preferredLanguage: string | null;
}

export interface AdminBooking {
  id: string;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  totalPrice: number;
  currency: string;
  requestedSetup?: string | null;
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
  data: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string | null; email: string | null; } | null;
}

export interface AdminStats {
  users: number;
  vendors: number;
  pendingVendors: number;
  branches: number;
  bookings: number;
  activeBookings: number;
  revenue: number;
  platformRevenue: number;
  vendorPayouts: number;
  pendingApprovals: number;
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
  logo?: string | null;
  status: VendorStatus;
  isVerified: boolean;
  verifiedAt?: string | null;
  verificationRequestedAt: string | null;
  createdAt?: string;
  companyLegalName: string | null;
  companyShortName: string | null;
  companyTradeName: string | null;
  companyNationalId: string | null;
  companyRegistrationNumber: string | null;
  companyRegistrationDate: string | null;
  companySalesTaxNumber: string | null;
  registeredInCountry: string | null;
  hasTaxExemption: boolean;
  companyDescription: string | null;
  authorizedSignatories: AuthorizedSignatory[];
  companyContacts: CompanyContact[];
  departmentContacts: DepartmentContact[];
  bankingInfo: BankingInfo[];
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
  data: Record<string, unknown> | null;
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

// ==================== VENDOR ADD-ONS ====================

export type DiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED' | 'PROMO_CODE';

export interface VendorAddOn {
  id: string;
  name: string;
  nameAr?: string | null;
  unitPrice: number;
  currency: string;
  isActive: boolean;
  createdAt?: string;
}

export interface BookingAddOnItem {
  id: string;
  vendorAddOnId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  serviceTime: string | null;
  comments: string | null;
}

export interface QuotationLineItem {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  sortOrder: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  vendorReply: string | null;
  replyCreatedAt: string | null;
  createdAt: string;
  branchName?: string;
  user: { id: string; name: string | null; image: string | null } | null;
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
  logo: string | null;
  socialLinks: Record<string, string> | null;
  companyLegalName: string | null;
  companyShortName: string | null;
  companyTradeName: string | null;
  companyNationalId: string | null;
  companyRegistrationNumber: string | null;
  companyRegistrationDate: string | null;
  companySalesTaxNumber: string | null;
  registeredInCountry: string | null;
  hasTaxExemption: boolean;
  companyDescription: string | null;
  status: VendorStatus;
  isVerified: boolean;
  verificationRequestedAt: string | null;
  verifiedAt: string | null;
  verificationNote: string | null;
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
  authorizedSignatories: AuthorizedSignatory[];
  companyContacts: CompanyContact[];
  departmentContacts: DepartmentContact[];
  bankingInfo: BankingInfo[];
}

export interface PendingVerification {
  id: string;
  companyName: string;
  logo: string | null;
  status: VendorStatus;
  verificationRequestedAt: string | null;
  owner: { name: string | null; email: string } | null;
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
  requestedSetup?: string | null;
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
    unitNumber?: string | null;
    type: ServiceType;
    capacity: number | null;
    pricing: { interval: string; price: number; currency: string }[];
    setupConfigs?: SetupConfig[];
  }[];
}

// ==================== QUOTATIONS ====================

export type QuotationStatus = 'NOT_SENT' | 'SENT' | 'ACCEPTED' | 'REJECTED';

export interface Quotation {
  id: string;
  referenceNumber: string;
  customerId: string;
  customer: { name: string | null; email: string | null };
  branchId: string;
  branch: { name: string };
  serviceId: string;
  service: { name: string; type: ServiceType };
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  totalAmount: number;
  status: QuotationStatus;
  notes: string | null;
  sentAt: string | null;
  createdBy: { name: string | null };
  bookingId: string | null;
  subtotal?: number | null;
  discountType?: DiscountType;
  discountValue?: number | null;
  discountAmount?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  pricingInterval?: PricingInterval | null;
  pricingMode?: PricingMode | null;
  lineItems?: QuotationLineItem[];
  createdAt: string;
  updatedAt: string;
}

// ==================== INVOICES ====================

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  booking: {
    id: string;
    startTime: string;
    endTime: string;
    branch: { name: string };
    service: { name: string };
  };
  customerId: string;
  customer: { name: string | null; email: string | null };
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== FINANCIAL DASHBOARD ====================

export interface FinancialReport {
  todayPayments: number;
  weekForecast: number;
  monthForecast: number;
  yearForecast: number;
  duePayments: number;
  stumblingAccounts: number;
  invoicesTotal: number;
  receiptsTotal: number;
}

export interface PropertiesOverview {
  allProperties: number;
  offices: number;
  meetingRooms: number;
  availableUnits: number;
}

export interface BookingOverview {
  activeBookings: number;
  expiringSoon: number;
  expired: number;
  pendingApproval: number;
}

// ==================== ENTITY MANAGEMENT ====================

export type EntityType = 'COMPANY' | 'INDIVIDUAL';
export type Gender = 'MALE' | 'FEMALE';
export type LegalDocType = 'NATIONAL_ID' | 'PASSPORT';
export type CustomerClassification = 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | 'LEVEL_5' | 'LEVEL_6';
export type EntityRoleName = 'OPERATOR' | 'LESSOR' | 'OWNER' | 'EMPLOYEE' | 'MAINTENANCE' | 'RECEPTION' | 'TENANT' | 'LEGAL' | 'BOOKING' | 'CUSTOMER_CARE';
export type DepartmentType = 'FINANCE' | 'LEGAL' | 'OPERATIONS' | 'MARKETING' | 'HR' | 'IT' | 'SALES' | 'CUSTOMER_SERVICE';

export interface Entity {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  entityType: EntityType | null;
  nationality: string | null;
  gender: Gender | null;
  customerClassification: CustomerClassification | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  entityRoles: { name: EntityRoleName }[];
  vendorProfile?: {
    companyName: string;
    companyLegalName: string | null;
  } | null;
}

export interface AuthorizedSignatory {
  id: string;
  fullName: string;
  nationality: string | null;
  legalDocType: LegalDocType | null;
  legalDocNumber: string | null;
  mobile: string | null;
  email: string | null;
  gender: Gender | null;
  idFileUrl: string | null;
}

export interface CompanyContact {
  id: string;
  contactPersonName: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  phone: string | null;
  fax: string | null;
  logoUrl: string | null;
  profileFileUrl: string | null;
}

export interface DepartmentContact {
  id: string;
  department: DepartmentType;
  contactName: string | null;
  mobile: string | null;
  phone: string | null;
  email: string | null;
  fax: string | null;
}

export interface BankingInfo {
  id: string;
  bankName: string | null;
  bankBranch: string | null;
  accountNumber: string | null;
  iban: string | null;
  swiftCode: string | null;
  accountantManagerName: string | null;
  cliq: string | null;
  signatureUrl: string | null;
}

// ==================== ADMIN SERVICES (UNITS) ====================

export interface AdminService {
  id: string;
  name: string;
  unitNumber: string | null;
  type: ServiceType;
  capacity: number | null;
  isActive: boolean;
  isPublic: boolean;
  description: string | null;
  profileNameEn: string | null;
  profileNameAr: string | null;
  weight: number | null;
  netSize: number | null;
  floor: string | null;
  shape: RoomShape | null;
  features: string[];
  createdAt: string;
  branch: { id: string; name: string; vendor?: string };
  pricing: { id: string; interval: PricingInterval; price: number; currency: string; isActive?: boolean; isPublic?: boolean }[];
  setupConfigs: SetupConfig[];
}

export interface AdminServiceDetail extends AdminService {
  branch: { id: string; name: string; vendor: string };
}

// ==================== PAYMENT LOGS ====================

export interface PaymentLogEntry {
  id: string;
  paymentId: string;
  action: string;
  performedBy: { name: string | null; role: string };
  receiptNumber: string | null;
  notes: string | null;
  details: string | null;
  createdAt: string;
}

// ==================== DAY VIEW ====================

export interface DayViewRoom {
  id: string;
  name: string;
  branch: string;
  bookings: {
    id: string;
    ref: string;
    startTime: string;
    endTime: string;
    customer: string | null;
    status: BookingStatus;
  }[];
}

export interface DayViewResponse {
  rooms: DayViewRoom[];
}

