/** Allowed booking status transitions (state machine) */
export const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  PENDING_APPROVAL: ['CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['COMPLETED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: [],
  NO_SHOW: [],
};

/** Service types that support setup configurations (room arrangements) */
export const SETUP_ELIGIBLE_TYPES: readonly string[] = ['MEETING_ROOM', 'EVENT_SPACE'];

/** Service types that use simple min/max capacity */
export const SIMPLE_CAPACITY_TYPES: readonly string[] = ['HOT_DESK', 'PRIVATE_OFFICE'];
