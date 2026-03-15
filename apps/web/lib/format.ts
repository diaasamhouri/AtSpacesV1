export function formatCity(city: string): string {
  const map: Record<string, string> = {
    AMMAN: 'Amman',
    IRBID: 'Irbid',
    AQABA: 'Aqaba',
  };
  return map[city] || city;
}

export function formatServiceType(type: string): string {
  const map: Record<string, string> = {
    HOT_DESK: 'Hot Desk',
    PRIVATE_OFFICE: 'Private Office',
    MEETING_ROOM: 'Meeting Room',
    EVENT_SPACE: 'Event Space',
  };
  return map[type] || type;
}

export function formatServiceTypeSlug(type: string): string {
  return type.toLowerCase().replace(/_/g, '-');
}

export function parseServiceTypeSlug(slug: string): string {
  return slug.toUpperCase().replace(/-/g, '_');
}

export function formatPrice(price: number, currency: string = 'JOD'): string {
  return `${price.toFixed(currency === 'JOD' ? 3 : 2)} ${currency}`;
}

export function formatPricingMode(mode: string): string {
  const map: Record<string, string> = {
    PER_BOOKING: 'Flat rate',
    PER_PERSON: 'Per person',
    PER_HOUR: 'Per hour',
  };
  return map[mode] || mode;
}

export function formatBookingStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    PENDING_APPROVAL: 'Pending Approval',
    CONFIRMED: 'Confirmed',
    CHECKED_IN: 'Checked In',
    COMPLETED: 'Completed',
    NO_SHOW: 'No Show',
    CANCELLED: 'Cancelled',
    REJECTED: 'Rejected',
    EXPIRED: 'Expired',
  };
  return map[status] || status;
}

export function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    VISA: 'Visa',
    MASTERCARD: 'Mastercard',
    APPLE_PAY: 'Apple Pay',
    CASH: 'Cash',
  };
  return map[method] || method;
}

export function formatVendorStatus(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    SUSPENDED: 'Suspended',
  };
  return map[status] || formatEnumLabel(status);
}

export function formatPaymentStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  };
  return map[status] || formatEnumLabel(status);
}

export function formatBranchStatus(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'Active',
    UNDER_REVIEW: 'Under Review',
    SUSPENDED: 'Suspended',
  };
  return map[status] || formatEnumLabel(status);
}

export function formatUserRole(role: string): string {
  const map: Record<string, string> = {
    ADMIN: 'Admin',
    MODERATOR: 'Moderator',
    ACCOUNTANT: 'Accountant',
    VENDOR: 'Vendor',
    CUSTOMER: 'Customer',
  };
  return map[role] || formatEnumLabel(role);
}

export function formatRoomShape(shape: string): string {
  const map: Record<string, string> = {
    L_SHAPE: 'L-Shape',
    U_SHAPE: 'U-Shape',
    RECTANGLE: 'Rectangle',
    SQUARE: 'Square',
    OVAL: 'Oval',
    CUSTOM: 'Custom',
  };
  return map[shape] || shape;
}

export function formatSetupType(setupType: string): string {
  const map: Record<string, string> = {
    CLASSROOM: 'Classroom',
    THEATER: 'Theater',
    BOARDROOM: 'Boardroom',
    U_SHAPE_SEATING: 'U-Shape Seating',
    HOLLOW_SQUARE: 'Hollow Square',
    BANQUET: 'Banquet',
  };
  return map[setupType] || setupType.replace(/_/g, ' ');
}

export function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function bookingStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    PENDING_APPROVAL: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CHECKED_IN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    NO_SHOW: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    EXPIRED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}
