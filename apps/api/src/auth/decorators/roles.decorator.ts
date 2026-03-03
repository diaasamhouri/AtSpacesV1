import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict endpoint access to specific roles.
 * ADMIN always has full access (handled in the guard).
 * Usage: @Roles(Role.ADMIN, Role.MODERATOR)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Permission sections for the admin panel.
 * Maps each admin-tier role to the feature sections they can access.
 */
export enum AdminSection {
    DASHBOARD = 'DASHBOARD',
    VENDORS = 'VENDORS',
    BOOKINGS = 'BOOKINGS',
    PAYMENTS = 'PAYMENTS',
    BRANCHES = 'BRANCHES',
    USERS = 'USERS',
    APPROVALS = 'APPROVALS',
    NOTIFICATIONS = 'NOTIFICATIONS',
    ANALYTICS = 'ANALYTICS',
}

export const ROLE_PERMISSIONS: Record<string, AdminSection[]> = {
    ADMIN: Object.values(AdminSection), // full access
    MODERATOR: [
        AdminSection.DASHBOARD,
        AdminSection.VENDORS,
        AdminSection.BOOKINGS,
        AdminSection.BRANCHES,
        AdminSection.APPROVALS,
        AdminSection.NOTIFICATIONS,
        AdminSection.ANALYTICS,
    ],
    ACCOUNTANT: [
        AdminSection.DASHBOARD,
        AdminSection.PAYMENTS,
        AdminSection.ANALYTICS,
    ],
};

/**
 * Decorator to restrict an endpoint to a specific admin section.
 * Usage: @RequireSection(AdminSection.PAYMENTS)
 */
export const SECTION_KEY = 'admin_section';
export const RequireSection = (section: AdminSection) =>
    SetMetadata(SECTION_KEY, section);
