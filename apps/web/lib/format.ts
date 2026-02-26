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

export function formatPricingInterval(interval: string): string {
  const map: Record<string, string> = {
    HOURLY: 'hour',
    HALF_DAY: 'half day',
    DAILY: 'day',
    WEEKLY: 'week',
    MONTHLY: 'month',
  };
  return map[interval] || interval;
}

export function formatBookingStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    CHECKED_IN: 'Checked In',
    COMPLETED: 'Completed',
    NO_SHOW: 'No Show',
    CANCELLED: 'Cancelled',
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

export function bookingStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CHECKED_IN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    NO_SHOW: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}
