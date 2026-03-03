import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VendorStatus, BookingStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { buildPaginatedResponse } from '../common/helpers/paginate';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    // ==================== HELPERS ====================

    private async getGlobalCommissionRate(): Promise<number> {
        const setting = await this.prisma.systemSettings.findUnique({ where: { key: 'DEFAULT_COMMISSION_RATE' } });
        return setting ? parseFloat(setting.value) : 10;
    }

    // ==================== STATS ====================

    async getSystemStats() {
        const [
            totalUsers,
            totalVendors,
            pendingVendors,
            totalBranches,
            totalBookings,
            activeBookings,
            completedPayments,
            pendingApprovals,
            globalRate,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.vendorProfile.count(),
            this.prisma.vendorProfile.count({ where: { status: 'PENDING_APPROVAL' } }),
            this.prisma.branch.count(),
            this.prisma.booking.count(),
            this.prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
            this.prisma.payment.findMany({
                where: { status: 'COMPLETED' },
                select: { amount: true, booking: { select: { branch: { select: { vendor: { select: { commissionRate: true } } } } } } },
            }),
            this.prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
            this.getGlobalCommissionRate(),
        ]);

        let grossRevenue = 0;
        let totalCommission = 0;
        for (const p of completedPayments) {
            const amount = p.amount.toNumber();
            const rate = p.booking.branch.vendor.commissionRate ?? globalRate;
            grossRevenue += amount;
            totalCommission += (amount * rate) / 100;
        }

        return {
            users: totalUsers,
            vendors: totalVendors,
            pendingVendors,
            branches: totalBranches,
            bookings: totalBookings,
            activeBookings,
            revenue: grossRevenue,
            platformRevenue: totalCommission,
            vendorPayouts: grossRevenue - totalCommission,
            pendingApprovals,
        };
    }

    // ==================== VENDORS ====================

    async listVendors(query: { page?: number; limit?: number; search?: string } = {}) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.search) {
            where.OR = [
                { companyName: { contains: query.search, mode: 'insensitive' } },
                { user: { name: { contains: query.search, mode: 'insensitive' } } },
                { user: { email: { contains: query.search, mode: 'insensitive' } } },
            ];
        }

        const [vendors, total] = await Promise.all([
            this.prisma.vendorProfile.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: { select: { name: true, email: true, phone: true } },
                    _count: { select: { branches: true } },
                },
            }),
            this.prisma.vendorProfile.count({ where }),
        ]);

        return buildPaginatedResponse(
            vendors.map(v => ({
                id: v.id,
                companyName: v.companyName,
                description: v.description,
                phone: v.phone,
                website: v.website,
                images: v.images,
                rejectionReason: v.rejectionReason,
                status: v.status,
                createdAt: v.createdAt,
                owner: v.user,
                branchesCount: v._count.branches,
            })),
            total, page, limit,
        );
    }

    async getVendorById(id: string) {
        const vendor = await this.prisma.vendorProfile.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, email: true, phone: true } },
                branches: {
                    select: {
                        id: true, name: true, city: true, address: true, status: true,
                        _count: { select: { services: true, bookings: true } },
                    },
                },
            },
        });
        if (!vendor) throw new NotFoundException('Vendor not found');

        return {
            id: vendor.id,
            companyName: vendor.companyName,
            description: vendor.description,
            phone: vendor.phone,
            website: vendor.website,
            images: vendor.images,
            status: vendor.status,
            isVerified: vendor.isVerified,
            commissionRate: vendor.commissionRate,
            rejectionReason: vendor.rejectionReason,
            createdAt: vendor.createdAt,
            owner: vendor.user,
            branches: vendor.branches.map(b => ({
                id: b.id, name: b.name, city: b.city, address: b.address, status: b.status,
                servicesCount: b._count.services, bookingsCount: b._count.bookings,
            })),
        };
    }

    async updateVendorStatus(vendorId: string, status: VendorStatus, reason?: string) {
        const vendor = await this.prisma.vendorProfile.findUnique({
            where: { id: vendorId },
        });
        if (!vendor) throw new NotFoundException('Vendor not found');

        return this.prisma.vendorProfile.update({
            where: { id: vendorId },
            data: {
                status,
                ...(status === 'REJECTED' && reason ? { rejectionReason: reason } : {}),
                ...(status === 'APPROVED' ? { rejectionReason: null } : {}),
            },
            include: { user: { select: { name: true, email: true } } },
        });
    }

    async verifyVendor(vendorId: string, verified: boolean, note?: string) {
        const vendor = await this.prisma.vendorProfile.findUnique({ where: { id: vendorId } });
        if (!vendor) throw new NotFoundException('Vendor not found');

        const updated = await this.prisma.vendorProfile.update({
            where: { id: vendorId },
            data: {
                isVerified: verified,
                verifiedAt: verified ? new Date() : null,
                verificationNote: note || null,
            },
            include: { user: { select: { id: true, name: true, email: true } } },
        });

        // Notify the vendor
        await this.prisma.notification.create({
            data: {
                userId: updated.user.id,
                type: 'GENERAL',
                title: verified ? '🔵 Verified!' : 'Verification Removed',
                message: verified
                    ? 'Congratulations! Your business has been verified. A blue badge will now appear next to your name.'
                    : 'Your verified badge has been removed.',
            },
        });

        return updated;
    }

    // ==================== USERS ====================

    async listUsers(query: { page?: number; limit?: number; search?: string } = {}) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return buildPaginatedResponse(users, total, page, limit);
    }

    async createTeamUser(data: { name: string; email: string; password: string; role: Role }) {
        if (data.role !== 'MODERATOR' && data.role !== 'ACCOUNTANT') {
            throw new BadRequestException('Can only create MODERATOR or ACCOUNTANT users');
        }

        const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) throw new ConflictException('A user with this email already exists');

        const passwordHash = await bcrypt.hash(data.password, 10);

        return this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: data.role,
                isActive: true,
            },
            select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        });
    }

    async toggleUserActive(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (user.role === 'ADMIN') throw new BadRequestException('Cannot disable admin users');

        return this.prisma.user.update({
            where: { id: userId },
            data: { isActive: !user.isActive },
            select: { id: true, name: true, email: true, role: true, isActive: true },
        });
    }

    // ==================== BOOKINGS ====================

    async listBookings(query: { page?: number; limit?: number; search?: string; status?: string } = {}) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { user: { name: { contains: query.search, mode: 'insensitive' } } },
                { branch: { name: { contains: query.search, mode: 'insensitive' } } },
            ];
        }

        const [bookings, total] = await Promise.all([
            this.prisma.booking.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: { select: { name: true, email: true } },
                    branch: { select: { name: true, city: true, vendor: { select: { companyName: true } } } },
                    service: { select: { name: true, type: true } },
                    payment: { select: { status: true, amount: true, method: true } },
                },
            }),
            this.prisma.booking.count({ where }),
        ]);

        return buildPaginatedResponse(
            bookings.map(b => ({
                id: b.id,
                status: b.status,
                startTime: b.startTime,
                endTime: b.endTime,
                numberOfPeople: b.numberOfPeople,
                totalPrice: b.totalPrice.toNumber(),
                currency: b.currency,
                notes: b.notes,
                createdAt: b.createdAt,
                customer: b.user,
                branch: { name: b.branch.name, city: b.branch.city, vendor: b.branch.vendor.companyName },
                service: b.service,
                payment: b.payment ? { status: b.payment.status, amount: b.payment.amount.toNumber(), method: b.payment.method } : null,
            })),
            total, page, limit,
        );
    }

    async getBookingById(id: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                branch: { select: { id: true, name: true, city: true, address: true, vendor: { select: { companyName: true } } } },
                service: { select: { id: true, name: true, type: true } },
                payment: true,
            },
        });
        if (!booking) throw new NotFoundException('Booking not found');

        return {
            id: booking.id,
            status: booking.status,
            startTime: booking.startTime,
            endTime: booking.endTime,
            numberOfPeople: booking.numberOfPeople,
            totalPrice: booking.totalPrice.toNumber(),
            currency: booking.currency,
            notes: booking.notes,
            createdAt: booking.createdAt,
            customer: booking.user,
            branch: booking.branch ? { id: booking.branch.id, name: booking.branch.name, city: booking.branch.city, address: booking.branch.address, vendor: booking.branch.vendor.companyName } : null,
            service: booking.service,
            payment: booking.payment ? {
                id: booking.payment.id,
                method: booking.payment.method,
                status: booking.payment.status,
                amount: booking.payment.amount.toNumber(),
                currency: booking.payment.currency,
                paidAt: booking.payment.paidAt,
                createdAt: booking.payment.createdAt,
            } : null,
        };
    }

    async updateBookingStatus(bookingId: string, status: BookingStatus) {
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) throw new NotFoundException('Booking not found');

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status },
        });
    }

    // ==================== PAYMENTS ====================

    async listPayments(query: { page?: number; limit?: number; search?: string; status?: string } = {}) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.search) {
            where.booking = { user: { name: { contains: query.search, mode: 'insensitive' } } };
        }

        const [payments, total, globalRate] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    booking: {
                        include: {
                            user: { select: { name: true, email: true } },
                            branch: { select: { name: true, vendor: { select: { companyName: true, commissionRate: true } } } },
                        },
                    },
                },
            }),
            this.prisma.payment.count({ where }),
            this.getGlobalCommissionRate(),
        ]);

        return buildPaginatedResponse(
            payments.map(p => {
                const amount = p.amount.toNumber();
                const rate = p.booking.branch.vendor.commissionRate ?? globalRate;
                const commissionAmount = (amount * rate) / 100;
                return {
                    id: p.id,
                    status: p.status,
                    amount,
                    currency: p.currency,
                    method: p.method,
                    transactionId: p.transactionId,
                    paidAt: p.paidAt,
                    createdAt: p.createdAt,
                    commissionRate: rate,
                    commissionAmount,
                    vendorEarnings: amount - commissionAmount,
                    booking: {
                        id: p.booking.id,
                        status: p.booking.status,
                        customer: p.booking.user,
                        branch: p.booking.branch.name,
                        vendor: p.booking.branch.vendor.companyName,
                    },
                };
            }),
            total, page, limit,
        );
    }

    async refundPayment(paymentId: string) {
        const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new NotFoundException('Payment not found');
        if (payment.status !== 'COMPLETED') throw new BadRequestException('Only completed payments can be refunded');

        const result = await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'REFUNDED' },
            }),
            this.prisma.booking.update({
                where: { id: payment.bookingId },
                data: { status: 'CANCELLED' },
            }),
        ]);

        // Notify customer about the refund
        const booking = await this.prisma.booking.findUnique({
            where: { id: payment.bookingId },
            select: { userId: true, branch: { select: { name: true } } },
        });
        if (booking) {
            await this.prisma.notification.create({
                data: {
                    userId: booking.userId,
                    type: 'PAYMENT_SUCCESS',
                    title: 'Payment Refunded',
                    message: `Your payment for the booking at ${booking.branch.name} has been refunded.`,
                },
            });
        }

        return result;
    }

    // ==================== BRANCHES ====================

    async listBranches(query: { page?: number; limit?: number; search?: string } = {}) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { vendor: { companyName: { contains: query.search, mode: 'insensitive' } } },
            ];
        }

        const [branches, total] = await Promise.all([
            this.prisma.branch.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    vendor: { select: { companyName: true, status: true } },
                    _count: { select: { services: true, bookings: true } },
                },
            }),
            this.prisma.branch.count({ where }),
        ]);

        return buildPaginatedResponse(
            branches.map(b => ({
                id: b.id,
                name: b.name,
                city: b.city,
                address: b.address,
                status: b.status,
                createdAt: b.createdAt,
                vendor: b.vendor.companyName,
                vendorStatus: b.vendor.status,
                servicesCount: b._count.services,
                bookingsCount: b._count.bookings,
            })),
            total, page, limit,
        );
    }

    async getBranchById(id: string) {
        const branch = await this.prisma.branch.findUnique({
            where: { id },
            include: {
                vendor: { select: { id: true, companyName: true, status: true } },
                services: {
                    include: { pricing: true },
                },
            },
        });
        if (!branch) throw new NotFoundException('Branch not found');

        return {
            id: branch.id,
            name: branch.name,
            address: branch.address,
            city: branch.city,
            status: branch.status,
            phone: branch.phone,
            email: branch.email,
            latitude: branch.latitude ? Number(branch.latitude) : null,
            longitude: branch.longitude ? Number(branch.longitude) : null,
            images: branch.images,
            amenities: branch.amenities,
            operatingHours: branch.operatingHours,
            googleMapsUrl: branch.googleMapsUrl,
            autoAcceptBookings: branch.autoAcceptBookings,
            createdAt: branch.createdAt,
            vendor: branch.vendor,
            services: branch.services.map(s => ({
                id: s.id,
                name: s.name,
                type: s.type,
                capacity: s.capacity,
                pricing: s.pricing.map(p => ({ interval: p.interval, price: p.price.toNumber(), currency: p.currency })),
            })),
        };
    }

    async updateBranchStatus(branchId: string, status: 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW') {
        const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
        if (!branch) throw new NotFoundException('Branch not found');

        return this.prisma.branch.update({
            where: { id: branchId },
            data: { status },
        });
    }

    // ==================== APPROVAL REQUESTS ====================

    async listApprovalRequests(query: { page?: number; limit?: number } = {}) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const [requests, total] = await Promise.all([
            this.prisma.approvalRequest.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    branch: {
                        select: { name: true, vendor: { select: { companyName: true } } },
                    },
                    vendorProfile: {
                        select: { companyName: true, user: { select: { name: true, email: true } } },
                    },
                },
            }),
            this.prisma.approvalRequest.count(),
        ]);

        return buildPaginatedResponse(
            requests.map(r => ({
                id: r.id,
                type: r.type,
                status: r.status,
                description: r.description,
                details: r.details,
                reason: r.reason,
                reviewedAt: r.reviewedAt,
                createdAt: r.createdAt,
                branch: r.branch?.name || null,
                vendor: r.branch?.vendor?.companyName || r.vendorProfile?.companyName || 'Unknown',
            })),
            total, page, limit,
        );
    }

    async processApproval(requestId: string, status: 'APPROVED' | 'REJECTED', reason?: string, adminId?: string) {
        const req = await this.prisma.approvalRequest.findUnique({ where: { id: requestId } });
        if (!req) throw new NotFoundException('Approval request not found');

        const updated = await this.prisma.approvalRequest.update({
            where: { id: requestId },
            data: {
                status,
                reason: reason || null,
                reviewedBy: adminId || null,
                reviewedAt: new Date(),
            },
        });

        // For vendor registration requests, also update the vendor profile status
        if (req.type === 'VENDOR_REGISTRATION' && req.vendorProfileId) {
            const vendorProfile = await this.prisma.vendorProfile.update({
                where: { id: req.vendorProfileId },
                data: {
                    status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
                    ...(status === 'REJECTED' && reason ? { rejectionReason: reason } : {}),
                    ...(status === 'APPROVED' ? { rejectionReason: null } : {}),
                },
                include: { user: { select: { id: true, name: true } } },
            });

            // Notify the vendor about the decision
            await this.prisma.notification.create({
                data: {
                    userId: vendorProfile.user.id,
                    type: status === 'APPROVED' ? 'VENDOR_APPROVED' : 'VENDOR_REJECTED',
                    title: status === 'APPROVED' ? 'Vendor Application Approved' : 'Vendor Application Rejected',
                    message: status === 'APPROVED'
                        ? `Congratulations! Your vendor application for ${vendorProfile.companyName} has been approved. You can now start adding branches.`
                        : `Your vendor application for ${vendorProfile.companyName} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
                },
            });
        }

        return updated;
    }

    // ==================== NOTIFICATIONS ====================

    async sendNotification(data: { userId?: string; title: string; message: string; type?: string }) {
        if (data.userId) {
            // Send to specific user
            return this.prisma.notification.create({
                data: {
                    userId: data.userId,
                    type: (data.type as any) || 'GENERAL',
                    title: data.title,
                    message: data.message,
                },
            });
        } else {
            // Broadcast to all users
            const users = await this.prisma.user.findMany({ select: { id: true } });
            const notifications = users.map(u => ({
                userId: u.id,
                type: 'GENERAL' as any,
                title: data.title,
                message: data.message,
            }));
            return this.prisma.notification.createMany({ data: notifications });
        }
    }

    async listNotifications() {
        return this.prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { user: { select: { name: true, email: true } } },
        });
    }

    // ==================== ANALYTICS ====================

    async getRevenueAnalytics() {
        const [payments, globalRate] = await Promise.all([
            this.prisma.payment.findMany({
                where: { status: 'COMPLETED' },
                orderBy: { paidAt: 'asc' },
                select: { amount: true, paidAt: true, createdAt: true, booking: { select: { branch: { select: { vendor: { select: { commissionRate: true } } } } } } },
            }),
            this.getGlobalCommissionRate(),
        ]);

        const byMonth: Record<string, { gross: number; commission: number; net: number }> = {};
        let totalGross = 0;
        let totalCommission = 0;

        payments.forEach(p => {
            const amount = p.amount.toNumber();
            const rate = p.booking.branch.vendor.commissionRate ?? globalRate;
            const commission = (amount * rate) / 100;
            totalGross += amount;
            totalCommission += commission;

            const date = p.paidAt || p.createdAt;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const entry = byMonth[key] || { gross: 0, commission: 0, net: 0 };
            entry.gross += amount;
            entry.commission += commission;
            entry.net += amount - commission;
            byMonth[key] = entry;
        });

        return {
            monthly: Object.entries(byMonth).map(([month, v]) => ({ month, total: v.gross, gross: v.gross, commission: v.commission, net: v.net })),
            totalRevenue: totalGross,
            totalGross,
            totalCommission,
            totalNet: totalGross - totalCommission,
        };
    }

    async getBookingAnalytics() {
        const [total, byStatus, recent] = await Promise.all([
            this.prisma.booking.count(),
            this.prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
            this.prisma.booking.findMany({
                orderBy: { createdAt: 'desc' },
                take: 30,
                select: { createdAt: true, status: true },
            }),
        ]);

        const byDay: Record<string, number> = {};
        recent.forEach(b => {
            const key = b.createdAt.toISOString().split('T')[0]!;
            byDay[key] = (byDay[key] || 0) + 1;
        });

        return {
            total,
            byStatus: byStatus.map(s => ({ status: s.status, count: s._count.status })),
            daily: Object.entries(byDay).map(([date, count]) => ({ date, count })),
        };
    }

    async getUserGrowthAnalytics() {
        // ... (existing analytics method)
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true, role: true },
        });

        const byMonth: Record<string, number> = {};
        const byRole: Record<string, number> = {};
        users.forEach(u => {
            const key = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, '0')}`;
            byMonth[key] = (byMonth[key] || 0) + 1;
            byRole[u.role] = (byRole[u.role] || 0) + 1;
        });

        return {
            total: users.length,
            monthly: Object.entries(byMonth).map(([month, count]) => ({ month, count })),
            byRole: Object.entries(byRole).map(([role, count]) => ({ role, count })),
        };
    }

    // ==================== SYSTEM SETTINGS ====================

    async getSystemSettings() {
        return this.prisma.systemSettings.findMany();
    }

    async updateSystemSettings(adminId: string, settings: { key: string; value: string }[]) {
        const results = await Promise.all(
            settings.map(async (setting) => {
                const updated = await this.prisma.systemSettings.upsert({
                    where: { key: setting.key },
                    update: { value: setting.value },
                    create: { key: setting.key, value: setting.value },
                });
                return updated;
            })
        );

        await this.prisma.adminAuditLog.create({
            data: {
                adminId,
                action: 'UPDATED_SYSTEM_SETTINGS',
                details: `Updated keys: ${settings.map(s => s.key).join(', ')}`,
            }
        });

        return results;
    }

    // ==================== VENDOR COMMISSIONS ====================

    async updateVendorCommission(adminId: string, vendorId: string, commissionRate: number | null) {
        const vendor = await this.prisma.vendorProfile.findUnique({ where: { id: vendorId } });
        if (!vendor) throw new NotFoundException('Vendor not found');

        const updated = await this.prisma.vendorProfile.update({
            where: { id: vendorId },
            data: { commissionRate },
            include: { user: { select: { name: true, email: true } } },
        });

        await this.prisma.adminAuditLog.create({
            data: {
                adminId,
                action: 'UPDATED_VENDOR_COMMISSION',
                details: `Updated commission rate for vendor ${vendor.companyName} to ${commissionRate === null ? 'DEFAULT' : commissionRate + '%'}`,
            }
        });

        return updated;
    }

    // ==================== EXPORTS ====================

    async exportRevenueCSV(): Promise<string> {
        const payments = await this.prisma.payment.findMany({
            where: { status: 'COMPLETED' },
            include: {
                booking: {
                    include: {
                        branch: {
                            include: { vendor: true }
                        }
                    }
                }
            },
            orderBy: { paidAt: 'desc' }
        });

        const globalRate = await this.getGlobalCommissionRate();

        let csv = 'Payment ID,Date,Vendor,Branch,Total Amount,Commission Rate (%),Commission Amount,Vendor Earnings\n';

        for (const p of payments) {
            const vendor = (p as any).booking.branch.vendor as any;
            const rate = vendor.commissionRate !== null ? vendor.commissionRate : globalRate;
            const total = p.amount.toNumber();
            const commissionAmount = (total * rate) / 100;
            const vendorEarnings = total - commissionAmount;

            csv += `${p.id},${p.paidAt?.toISOString() || p.createdAt.toISOString()},"${vendor.companyName}","${(p as any).booking.branch.name}",${total},${rate},${commissionAmount.toFixed(2)},${vendorEarnings.toFixed(2)}\n`;
        }

        return csv;
    }
}
