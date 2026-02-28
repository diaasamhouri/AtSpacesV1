import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginatedResponse } from '../common/helpers/paginate';

@Injectable()
export class VendorService {
    constructor(private prisma: PrismaService) { }

    // ==================== HELPERS ====================

    private async getVendorProfile(userId: string) {
        const vp = await this.prisma.vendorProfile.findUnique({ where: { userId } });
        if (!vp) throw new NotFoundException('Vendor profile not found');
        return vp;
    }

    private async getApprovedVendorProfile(userId: string) {
        const vp = await this.getVendorProfile(userId);
        if (vp.status !== 'APPROVED') throw new ForbiddenException('Vendor account is not approved yet.');
        return vp;
    }

    // ==================== DASHBOARD ====================

    async getVendorStats(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);

        const [branchesCount, servicesCount, activeBookingsCount, revenueQuery] = await Promise.all([
            this.prisma.branch.count({ where: { vendorProfileId: vp.id, status: { not: 'SUSPENDED' } } }),
            this.prisma.service.count({ where: { branch: { vendorProfileId: vp.id }, isActive: true } }),
            this.prisma.booking.count({ where: { branch: { vendorProfileId: vp.id }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } } }),
            this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', booking: { branch: { vendorProfileId: vp.id } } } }),
        ]);

        return {
            companyName: vp.companyName,
            status: vp.status,
            stats: {
                branches: branchesCount,
                services: servicesCount,
                activeBookings: activeBookingsCount,
                totalRevenue: revenueQuery._sum.amount ? revenueQuery._sum.amount.toNumber() : 0,
            },
        };
    }

    // ==================== PROFILE ====================

    async getProfile(userId: string) {
        const vp = await this.getVendorProfile(userId);
        return {
            id: vp.id,
            companyName: vp.companyName,
            description: vp.description,
            logo: vp.logo,
            phone: vp.phone,
            website: vp.website,
            images: vp.images,
            socialLinks: vp.socialLinks,
            status: vp.status,
            isVerified: vp.isVerified,
            verifiedAt: vp.verifiedAt,
            createdAt: vp.createdAt,
        };
    }

    async updateProfile(userId: string, data: { companyName?: string; description?: string; phone?: string; website?: string; images?: string[]; socialLinks?: Record<string, string> }) {
        const vp = await this.getVendorProfile(userId);

        return this.prisma.vendorProfile.update({
            where: { id: vp.id },
            data: {
                ...(data.companyName !== undefined ? { companyName: data.companyName } : {}),
                ...(data.description !== undefined ? { description: data.description } : {}),
                ...(data.phone !== undefined ? { phone: data.phone } : {}),
                ...(data.website !== undefined ? { website: data.website } : {}),
                ...(data.images !== undefined ? { images: data.images } : {}),
                ...(data.socialLinks !== undefined ? { socialLinks: data.socialLinks } : {}),
            },
            select: { id: true, companyName: true, description: true, phone: true, website: true, images: true, socialLinks: true, status: true, isVerified: true },
        });
    }

    async requestVerification(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);
        if (vp.isVerified) return { message: 'Already verified', isVerified: true };

        // Notify all admins about the verification request
        const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', isActive: true } });
        await this.prisma.notification.createMany({
            data: admins.map(a => ({
                userId: a.id,
                type: 'APPROVAL_REQUEST' as const,
                title: 'Verification Request',
                message: `${vp.companyName} has requested a verified badge.`,
                data: { vendorProfileId: vp.id },
            })),
        });

        return { message: 'Verification request submitted', isVerified: false };
    }

    // ==================== EARNINGS ====================

    async getEarnings(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);

        const payments = await this.prisma.payment.findMany({
            where: { status: 'COMPLETED', booking: { branch: { vendorProfileId: vp.id } } },
            orderBy: { createdAt: 'desc' },
            include: {
                booking: { include: { branch: { select: { name: true } }, service: { select: { name: true, type: true } }, user: { select: { name: true } } } },
            },
        });

        const byMonth: Record<string, number> = {};
        const paymentList = payments.map(p => {
            const date = p.paidAt || p.createdAt;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            byMonth[key] = (byMonth[key] || 0) + p.amount.toNumber();
            return {
                id: p.id,
                amount: p.amount.toNumber(),
                currency: p.currency,
                method: p.method,
                status: p.status,
                paidAt: p.paidAt,
                createdAt: p.createdAt,
                branch: p.booking.branch.name,
                service: p.booking.service.name,
                serviceType: p.booking.service.type,
                customer: p.booking.user?.name || 'Anonymous',
            };
        });

        return {
            payments: paymentList,
            monthly: Object.entries(byMonth).map(([month, total]) => ({ month, total })),
            totalEarnings: paymentList.reduce((sum, p) => sum + p.amount, 0),
        };
    }

    // ==================== ANALYTICS ====================

    async getAnalytics(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);
        const vendorFilter = { branch: { vendorProfileId: vp.id } };

        const [total, byStatus, recentBookings, services] = await Promise.all([
            this.prisma.booking.count({ where: vendorFilter }),
            this.prisma.booking.groupBy({ by: ['status'], _count: { status: true }, where: vendorFilter }),
            this.prisma.booking.findMany({
                where: vendorFilter,
                orderBy: { createdAt: 'desc' },
                take: 60,
                select: { createdAt: true, startTime: true, serviceId: true, status: true },
            }),
            this.prisma.service.findMany({
                where: { branch: { vendorProfileId: vp.id }, isActive: true },
                select: { id: true, name: true, type: true, _count: { select: { bookings: true } } },
            }),
        ]);

        // Daily bookings (last 30 days)
        const byDay: Record<string, number> = {};
        recentBookings.forEach(b => {
            const key = b.createdAt.toISOString().split('T')[0]!;
            byDay[key] = (byDay[key] || 0) + 1;
        });

        // Peak hours
        const hourCounts: Record<number, number> = {};
        recentBookings.forEach(b => {
            const hour = new Date(b.startTime).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        // Popular services
        const popularServices = services
            .map(s => ({ name: s.name, type: s.type, bookings: s._count.bookings }))
            .sort((a, b) => b.bookings - a.bookings);

        return {
            totalBookings: total,
            byStatus: byStatus.map(s => ({ status: s.status, count: s._count.status })),
            daily: Object.entries(byDay).map(([date, count]) => ({ date, count })),
            peakHours: Object.entries(hourCounts).map(([hour, count]) => ({ hour: Number(hour), count })).sort((a, b) => b.count - a.count),
            popularServices,
        };
    }

    // ==================== NOTIFICATIONS ====================

    async getNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async markNotificationRead(userId: string, notificationId: string) {
        const notif = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notif) throw new NotFoundException('Notification not found');

        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    // ==================== REVIEWS ====================

    async replyToReview(userId: string, reviewId: string, vendorReply: string) {
        const vp = await this.getApprovedVendorProfile(userId);

        // Find review and verify the branch belongs to this vendor
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
            include: { branch: true }
        });

        if (!review) throw new NotFoundException('Review not found');
        if (review.branch.vendorProfileId !== vp.id) throw new ForbiddenException('Review does not belong to your branches');

        // Update Review
        const updated = await this.prisma.review.update({
            where: { id: reviewId },
            data: {
                vendorReply,
                replyCreatedAt: new Date(),
            }
        });

        // Notify User
        await this.prisma.notification.create({
            data: {
                userId: review.userId,
                type: 'GENERAL',
                title: 'Host Replied to your Review',
                message: `${vp.companyName} replied to your review at ${review.branch.name}.`,
                data: { reviewId: review.id, branchId: review.branch.id }
            }
        });

        return updated;
    }

    // ==================== CALENDAR ====================

    async getCalendarEvents(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);

        const bookings = await this.prisma.booking.findMany({
            where: {
                branch: { vendorProfileId: vp.id },
                status: { in: ['CONFIRMED', 'CHECKED_IN'] }
            },
            include: {
                branch: { select: { name: true } },
                service: { select: { name: true, type: true } },
                user: { select: { name: true, email: true } },
            },
        });

        return bookings.map(b => ({
            id: b.id,
            title: `${b.service.name} - ${b.user.name}`,
            start: b.startTime.toISOString(),
            end: b.endTime.toISOString(),
            serviceType: b.service.type,
            resourceId: b.serviceId,
            extendedProps: {
                status: b.status,
                branchName: b.branch.name,
                customerEmail: b.user.email,
                numberOfPeople: b.numberOfPeople,
                totalPrice: b.totalPrice.toNumber(),
                notes: b.notes,
            }
        }));
    }

    // ==================== PROMOTIONS ====================

    async createPromoCode(userId: string, data: { code: string; discountPercent: number; maxUses?: number; validUntil?: string; isActive?: boolean; branchId?: string }) {
        const vp = await this.getApprovedVendorProfile(userId);

        if (data.branchId) {
            const branch = await this.prisma.branch.findFirst({ where: { id: data.branchId, vendorProfileId: vp.id } });
            if (!branch) throw new ForbiddenException('Branch not found or belongs to another vendor');
        }

        const existing = await this.prisma.promoCode.findUnique({ where: { code: data.code.toUpperCase() } });
        if (existing) throw new ForbiddenException('Promo code already exists globally. Please choose another one.');

        return this.prisma.promoCode.create({
            data: {
                code: data.code.toUpperCase(),
                discountPercent: data.discountPercent,
                maxUses: data.maxUses || 0,
                validUntil: data.validUntil ? new Date(data.validUntil) : null,
                isActive: data.isActive ?? true,
                vendorProfileId: vp.id,
                branchId: data.branchId || null,
            }
        });
    }

    async getPromoCodes(userId: string, query: { page?: number; limit?: number } = {}) {
        const vp = await this.getApprovedVendorProfile(userId);
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where = { vendorProfileId: vp.id };

        const [promos, total] = await Promise.all([
            this.prisma.promoCode.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: { branch: { select: { id: true, name: true } } },
            }),
            this.prisma.promoCode.count({ where }),
        ]);

        return buildPaginatedResponse(promos, total, page, limit);
    }

    async updatePromoCode(userId: string, promoId: string, data: any) {
        const vp = await this.getApprovedVendorProfile(userId);

        const promo = await this.prisma.promoCode.findFirst({ where: { id: promoId, vendorProfileId: vp.id } });
        if (!promo) throw new NotFoundException('Promo code not found');

        if (data.branchId) {
            const branch = await this.prisma.branch.findFirst({ where: { id: data.branchId, vendorProfileId: vp.id } });
            if (!branch) throw new ForbiddenException('Branch not found');
        }

        return this.prisma.promoCode.update({
            where: { id: promoId },
            data: {
                discountPercent: data.discountPercent !== undefined ? data.discountPercent : undefined,
                maxUses: data.maxUses !== undefined ? data.maxUses : undefined,
                validUntil: data.validUntil !== undefined ? (data.validUntil ? new Date(data.validUntil) : null) : undefined,
                isActive: data.isActive !== undefined ? data.isActive : undefined,
                branchId: data.branchId !== undefined ? data.branchId : undefined,
            },
            include: { branch: { select: { id: true, name: true } } }
        });
    }

    async deletePromoCode(userId: string, promoId: string) {
        const vp = await this.getApprovedVendorProfile(userId);
        const promo = await this.prisma.promoCode.findFirst({ where: { id: promoId, vendorProfileId: vp.id } });
        if (!promo) throw new NotFoundException('Promo code not found');

        await this.prisma.promoCode.delete({ where: { id: promoId } });
        return { message: 'Promo code deleted' };
    }
}
