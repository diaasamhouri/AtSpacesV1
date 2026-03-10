import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { buildPaginatedResponse } from '../common/helpers/paginate';
import { CreateVendorBookingDto } from './dto/create-vendor-booking.dto';
import { UpdateVendorBookingDto } from './dto/update-vendor-booking.dto';
import { CreateVendorAddOnDto, UpdateVendorAddOnDto } from './dto/create-vendor-addon.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { SETUP_ELIGIBLE_TYPES } from '../common/constants';
import { calculateSubtotal, checkSlotAvailability } from '../bookings/booking-creation.helper';

@Injectable()
export class VendorService {
    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
    ) { }

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

    private async getGlobalCommissionRate(): Promise<number> {
        const setting = await this.prisma.systemSettings.findUnique({ where: { key: 'DEFAULT_COMMISSION_RATE' } });
        return setting ? parseFloat(setting.value) : 10;
    }

    // ==================== DASHBOARD ====================

    async getVendorStats(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);

        const [branchesCount, servicesCount, activeBookingsCount, revenueQuery, globalRate] = await Promise.all([
            this.prisma.branch.count({ where: { vendorProfileId: vp.id, status: { not: 'SUSPENDED' } } }),
            this.prisma.service.count({ where: { branch: { vendorProfileId: vp.id }, isActive: true } }),
            this.prisma.booking.count({ where: { branch: { vendorProfileId: vp.id }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } } }),
            this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', booking: { branch: { vendorProfileId: vp.id } } } }),
            this.getGlobalCommissionRate(),
        ]);

        const grossRevenue = revenueQuery._sum.amount ? revenueQuery._sum.amount.toNumber() : 0;
        const commissionRate = vp.commissionRate ?? globalRate;
        const commissionAmount = (grossRevenue * commissionRate) / 100;
        const netRevenue = grossRevenue - commissionAmount;

        return {
            companyName: vp.companyName,
            status: vp.status,
            stats: {
                branches: branchesCount,
                services: servicesCount,
                activeBookings: activeBookingsCount,
                totalRevenue: grossRevenue,
                grossRevenue,
                commissionRate,
                commissionAmount,
                netRevenue,
            },
        };
    }

    // ==================== PROFILE ====================

    async getProfile(userId: string) {
        const vp = await this.prisma.vendorProfile.findUnique({
            where: { userId },
            include: {
                authorizedSignatories: true,
                companyContacts: true,
                departmentContacts: true,
                bankingInfo: true,
            },
        });
        if (!vp) throw new NotFoundException('Vendor profile not found');
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
            verificationRequestedAt: vp.verificationRequestedAt,
            companyLegalName: vp.companyLegalName,
            companyShortName: vp.companyShortName,
            companyTradeName: vp.companyTradeName,
            companyNationalId: vp.companyNationalId,
            companyRegistrationNumber: vp.companyRegistrationNumber,
            companyRegistrationDate: vp.companyRegistrationDate,
            companySalesTaxNumber: vp.companySalesTaxNumber,
            registeredInCountry: vp.registeredInCountry,
            hasTaxExemption: vp.hasTaxExemption,
            companyDescription: vp.companyDescription,
            authorizedSignatories: vp.authorizedSignatories,
            companyContacts: vp.companyContacts,
            departmentContacts: vp.departmentContacts,
            bankingInfo: vp.bankingInfo,
            createdAt: vp.createdAt,
        };
    }

    async updateProfile(userId: string, data: {
        companyName?: string; description?: string; phone?: string; website?: string;
        images?: string[]; socialLinks?: Record<string, string>;
        companyLegalName?: string; companyShortName?: string; companyTradeName?: string;
        companyNationalId?: string; companyRegistrationNumber?: string; companyRegistrationDate?: string;
        companySalesTaxNumber?: string; registeredInCountry?: string; hasTaxExemption?: boolean;
        companyDescription?: string;
    }) {
        const vp = await this.getVendorProfile(userId);

        if (vp.status === 'REJECTED') {
            throw new ForbiddenException('Cannot update a rejected vendor profile.');
        }

        const updateData: Record<string, any> = {};
        const fields = [
            'companyName', 'description', 'phone', 'website', 'images', 'socialLinks',
            'companyLegalName', 'companyShortName', 'companyTradeName', 'companyNationalId',
            'companyRegistrationNumber', 'companySalesTaxNumber', 'registeredInCountry',
            'hasTaxExemption', 'companyDescription',
        ] as const;

        for (const field of fields) {
            if ((data as any)[field] !== undefined) {
                updateData[field] = (data as any)[field];
            }
        }

        if (data.companyRegistrationDate !== undefined) {
            updateData.companyRegistrationDate = data.companyRegistrationDate ? new Date(data.companyRegistrationDate) : null;
        }

        return this.prisma.vendorProfile.update({
            where: { id: vp.id },
            data: updateData,
            select: {
                id: true, companyName: true, description: true, phone: true, website: true,
                images: true, socialLinks: true, status: true, isVerified: true,
                verifiedAt: true, verificationRequestedAt: true,
                companyLegalName: true, companyShortName: true, companyTradeName: true,
                companyNationalId: true, companyRegistrationNumber: true, companyRegistrationDate: true,
                companySalesTaxNumber: true, registeredInCountry: true, hasTaxExemption: true,
                companyDescription: true,
                authorizedSignatories: true,
                companyContacts: true,
                departmentContacts: true,
                bankingInfo: true,
            },
        });
    }

    // ==================== SIGNATORY CRUD ====================

    async addSignatory(userId: string, dto: any) {
        const vp = await this.getVendorProfile(userId);
        return this.prisma.authorizedSignatory.create({
            data: { vendorProfileId: vp.id, ...dto },
        });
    }

    async updateSignatory(userId: string, id: string, dto: any) {
        const vp = await this.getVendorProfile(userId);
        const record = await this.prisma.authorizedSignatory.findFirst({ where: { id, vendorProfileId: vp.id } });
        if (!record) throw new NotFoundException('Signatory not found');
        return this.prisma.authorizedSignatory.update({ where: { id }, data: dto });
    }

    async deleteSignatory(userId: string, id: string) {
        const vp = await this.getVendorProfile(userId);
        const record = await this.prisma.authorizedSignatory.findFirst({ where: { id, vendorProfileId: vp.id } });
        if (!record) throw new NotFoundException('Signatory not found');
        await this.prisma.authorizedSignatory.delete({ where: { id } });
        return { message: 'Signatory deleted' };
    }

    // ==================== COMPANY CONTACT CRUD ====================

    async addCompanyContact(userId: string, dto: any) {
        const vp = await this.getVendorProfile(userId);
        return this.prisma.companyContact.create({
            data: { vendorProfileId: vp.id, ...dto },
        });
    }

    async updateCompanyContact(userId: string, id: string, dto: any) {
        const vp = await this.getVendorProfile(userId);
        const record = await this.prisma.companyContact.findFirst({ where: { id, vendorProfileId: vp.id } });
        if (!record) throw new NotFoundException('Company contact not found');
        return this.prisma.companyContact.update({ where: { id }, data: dto });
    }

    async deleteCompanyContact(userId: string, id: string) {
        const vp = await this.getVendorProfile(userId);
        const record = await this.prisma.companyContact.findFirst({ where: { id, vendorProfileId: vp.id } });
        if (!record) throw new NotFoundException('Company contact not found');
        await this.prisma.companyContact.delete({ where: { id } });
        return { message: 'Company contact deleted' };
    }

    // ==================== DEPARTMENT CONTACT CRUD ====================

    async addDepartmentContact(userId: string, dto: any) {
        const vp = await this.getVendorProfile(userId);
        return this.prisma.departmentContact.create({
            data: { vendorProfileId: vp.id, ...dto },
        });
    }

    async updateDepartmentContact(userId: string, id: string, dto: any) {
        const vp = await this.getVendorProfile(userId);
        const record = await this.prisma.departmentContact.findFirst({ where: { id, vendorProfileId: vp.id } });
        if (!record) throw new NotFoundException('Department contact not found');
        return this.prisma.departmentContact.update({ where: { id }, data: dto });
    }

    async deleteDepartmentContact(userId: string, id: string) {
        const vp = await this.getVendorProfile(userId);
        const record = await this.prisma.departmentContact.findFirst({ where: { id, vendorProfileId: vp.id } });
        if (!record) throw new NotFoundException('Department contact not found');
        await this.prisma.departmentContact.delete({ where: { id } });
        return { message: 'Department contact deleted' };
    }

    // ==================== BANKING INFO CRUD ====================

    async addBankingInfo(userId: string, dto: any) {
        const vp = await this.getVendorProfile(userId);
        return this.prisma.bankingInfo.create({
            data: { vendorProfileId: vp.id, ...dto },
        });
    }

    async updateBankingInfo(userId: string, id: string, dto: any) {
        const vp = await this.getVendorProfile(userId);
        const record = await this.prisma.bankingInfo.findFirst({ where: { id, vendorProfileId: vp.id } });
        if (!record) throw new NotFoundException('Banking info not found');
        return this.prisma.bankingInfo.update({ where: { id }, data: dto });
    }

    async deleteBankingInfo(userId: string, id: string) {
        const vp = await this.getVendorProfile(userId);
        const record = await this.prisma.bankingInfo.findFirst({ where: { id, vendorProfileId: vp.id } });
        if (!record) throw new NotFoundException('Banking info not found');
        await this.prisma.bankingInfo.delete({ where: { id } });
        return { message: 'Banking info deleted' };
    }

    async requestVerification(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);
        if (vp.isVerified) return { message: 'Already verified', isVerified: true };
        if (vp.verificationRequestedAt) return { message: 'Verification request already pending', isVerified: false };

        // Mark the request timestamp
        await this.prisma.vendorProfile.update({
            where: { id: vp.id },
            data: { verificationRequestedAt: new Date() },
        });

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

        const [payments, globalRate] = await Promise.all([
            this.prisma.payment.findMany({
                where: { status: 'COMPLETED', booking: { branch: { vendorProfileId: vp.id } } },
                orderBy: { createdAt: 'desc' },
                take: 500,
                include: {
                    booking: { include: { branch: { select: { name: true } }, service: { select: { name: true, type: true } }, user: { select: { name: true } } } },
                },
            }),
            this.getGlobalCommissionRate(),
        ]);

        const commissionRate = vp.commissionRate ?? globalRate;
        const byMonth: Record<string, { gross: number; commission: number; net: number }> = {};
        const paymentList = payments.map(p => {
            const gross = p.amount.toNumber();
            const commission = (gross * commissionRate) / 100;
            const net = gross - commission;
            const date = p.paidAt || p.createdAt;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const entry = byMonth[key] || { gross: 0, commission: 0, net: 0 };
            entry.gross += gross;
            entry.commission += commission;
            entry.net += net;
            byMonth[key] = entry;
            return {
                id: p.id,
                amount: gross,
                grossAmount: gross,
                commissionAmount: commission,
                netAmount: net,
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

        const totalGross = paymentList.reduce((sum, p) => sum + p.grossAmount, 0);
        const totalCommission = paymentList.reduce((sum, p) => sum + p.commissionAmount, 0);
        const totalNet = paymentList.reduce((sum, p) => sum + p.netAmount, 0);

        return {
            payments: paymentList,
            monthly: Object.entries(byMonth).map(([month, v]) => ({ month, total: v.gross, gross: v.gross, commission: v.commission, net: v.net })),
            totalEarnings: totalGross,
            commissionRate,
            totalGross,
            totalCommission,
            totalNet,
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

    async getNotifications(userId: string, query: { page?: number; limit?: number } = {}) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const where = { userId };
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where }),
        ]);

        return buildPaginatedResponse(notifications, total, page, limit);
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

    async getVendorReviews(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);

        const reviews = await this.prisma.review.findMany({
            where: { branch: { vendorProfileId: vp.id } },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                user: { select: { name: true, image: true } },
                branch: { select: { name: true } },
            },
        });

        return reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            vendorReply: r.vendorReply,
            replyCreatedAt: r.replyCreatedAt,
            createdAt: r.createdAt,
            branchName: r.branch.name,
            user: r.user,
        }));
    }

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

    async deleteReviewReply(userId: string, reviewId: string) {
        const vp = await this.getApprovedVendorProfile(userId);

        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
            include: { branch: true },
        });

        if (!review) throw new NotFoundException('Review not found');
        if (review.branch.vendorProfileId !== vp.id) throw new ForbiddenException('Review does not belong to your branches');
        if (!review.vendorReply) throw new BadRequestException('No reply to delete');

        return this.prisma.review.update({
            where: { id: reviewId },
            data: { vendorReply: null, replyCreatedAt: null },
        });
    }

    // ==================== CALENDAR ====================

    async getCalendarEvents(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);

        const bookings = await this.prisma.booking.findMany({
            where: {
                branch: { vendorProfileId: vp.id },
                status: { in: ['CONFIRMED', 'CHECKED_IN'] }
            },
            take: 1000,
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

    // ==================== DAY VIEW ====================

    async getDayView(userId: string, date: string, branchId?: string) {
        const vp = await this.getApprovedVendorProfile(userId);

        const dayStart = new Date(`${date}T00:00:00.000Z`);
        const dayEnd = new Date(`${date}T23:59:59.999Z`);

        const branchFilter: any = { vendorProfileId: vp.id };
        if (branchId) branchFilter.id = branchId;

        const services = await this.prisma.service.findMany({
            where: {
                branch: branchFilter,
                isActive: true,
            },
            include: {
                branch: { select: { name: true } },
                bookings: {
                    where: {
                        startTime: { lte: dayEnd },
                        endTime: { gte: dayStart },
                        status: { notIn: ['CANCELLED', 'REJECTED'] as any },
                    },
                    take: 1000,
                    include: {
                        user: { select: { name: true } },
                    },
                    orderBy: { startTime: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });

        return {
            rooms: services.map(s => ({
                id: s.id,
                name: s.name,
                branch: s.branch.name,
                bookings: s.bookings.map(b => ({
                    id: b.id,
                    ref: b.id.slice(0, 8).toUpperCase(),
                    startTime: b.startTime.toISOString(),
                    endTime: b.endTime.toISOString(),
                    customer: b.user.name,
                    status: b.status,
                })),
            })),
        };
    }

    // ==================== VENDOR BRANCHES ====================

    async getVendorBranches(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);

        return this.prisma.branch.findMany({
            where: { vendorProfileId: vp.id },
            select: { id: true, name: true, city: true, status: true },
            orderBy: { name: 'asc' },
        });
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

        // Prevent deletion if the code is actively used by pending/confirmed bookings
        const activeUsageCount = await this.prisma.booking.count({
            where: {
                promoCodeId: promoId,
                status: { in: ['PENDING', 'PENDING_APPROVAL', 'CONFIRMED', 'CHECKED_IN'] },
            },
        });

        if (activeUsageCount > 0) {
            throw new BadRequestException(
                `Cannot delete this promo code — it is used by ${activeUsageCount} active booking${activeUsageCount > 1 ? 's' : ''}. Cancel or complete them first.`,
            );
        }

        await this.prisma.promoCode.delete({ where: { id: promoId } });
        return { message: 'Promo code deleted' };
    }

    // ==================== COLLECT PAYMENT ====================

    async collectPayment(vendorUserId: string, bookingId: string, options?: { receiptNumber?: string; notes?: string }) {
        const vp = await this.getApprovedVendorProfile(vendorUserId);

        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                payment: true,
                branch: { select: { id: true, name: true, vendorProfileId: true } },
                user: { select: { name: true } },
            },
        });

        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.branch.vendorProfileId !== vp.id) throw new ForbiddenException('Booking does not belong to your branches');
        if (!booking.payment) throw new BadRequestException('Booking has no payment record');
        if (booking.payment.method !== 'CASH') throw new BadRequestException('Only cash payments can be collected');
        if (booking.payment.status !== 'PENDING') throw new BadRequestException('Payment is not in pending status');

        const [updatedPayment] = await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: booking.payment.id },
                data: { status: 'COMPLETED', paidAt: new Date() },
            }),
            this.prisma.paymentLog.create({
                data: {
                    paymentId: booking.payment.id,
                    action: 'COLLECTED',
                    performedById: vendorUserId,
                    receiptNumber: options?.receiptNumber || null,
                    notes: options?.notes || null,
                    details: `Cash payment of ${booking.payment.amount} ${booking.payment.currency} collected for booking at ${booking.branch.name}`,
                },
            }),
            this.prisma.notification.create({
                data: {
                    userId: booking.userId,
                    type: 'GENERAL',
                    title: 'Cash Payment Recorded',
                    message: `Your cash payment at ${booking.branch.name} has been recorded.`,
                    data: { bookingId: booking.id, branchId: booking.branch.id },
                },
            }),
        ]);

        return {
            id: updatedPayment.id,
            method: updatedPayment.method,
            status: updatedPayment.status,
            amount: updatedPayment.amount.toNumber(),
            currency: updatedPayment.currency,
            paidAt: updatedPayment.paidAt?.toISOString() ?? null,
        };
    }

    async bulkCollectPayments(vendorUserId: string, bookingIds: string[], options?: { receiptNumber?: string; notes?: string }) {
        const vp = await this.getApprovedVendorProfile(vendorUserId);

        const bookings = await this.prisma.booking.findMany({
            where: { id: { in: bookingIds } },
            include: {
                payment: true,
                branch: { select: { id: true, name: true, vendorProfileId: true } },
            },
        });

        // Validate all bookings
        const errors: string[] = [];
        for (const id of bookingIds) {
            const booking = bookings.find(b => b.id === id);
            if (!booking) { errors.push(`Booking ${id.slice(0, 8)} not found`); continue; }
            if (booking.branch.vendorProfileId !== vp.id) { errors.push(`Booking ${id.slice(0, 8)} does not belong to your branches`); continue; }
            if (!booking.payment) { errors.push(`Booking ${id.slice(0, 8)} has no payment record`); continue; }
            if (booking.payment.method !== 'CASH') { errors.push(`Booking ${id.slice(0, 8)} is not a cash payment`); continue; }
            if (booking.payment.status !== 'PENDING') { errors.push(`Booking ${id.slice(0, 8)} payment is not pending`); continue; }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors.join('; '));
        }

        const now = new Date();
        const operations: any[] = [];

        for (const booking of bookings) {
            operations.push(
                this.prisma.payment.update({
                    where: { id: booking.payment!.id },
                    data: { status: 'COMPLETED', paidAt: now },
                }),
                this.prisma.paymentLog.create({
                    data: {
                        paymentId: booking.payment!.id,
                        action: 'COLLECTED',
                        performedById: vendorUserId,
                        receiptNumber: options?.receiptNumber || null,
                        notes: options?.notes || null,
                        details: `Bulk collect: Cash payment of ${booking.payment!.amount} ${booking.payment!.currency} at ${booking.branch.name}`,
                    },
                }),
                this.prisma.notification.create({
                    data: {
                        userId: booking.userId,
                        type: 'GENERAL',
                        title: 'Cash Payment Recorded',
                        message: `Your cash payment at ${booking.branch.name} has been recorded.`,
                        data: { bookingId: booking.id, branchId: booking.branch.id },
                    },
                }),
            );
        }

        await this.prisma.$transaction(operations);

        return { collected: bookings.length, bookingIds: bookings.map(b => b.id) };
    }

    async getPaymentLogs(vendorUserId: string, bookingId: string) {
        const vp = await this.getApprovedVendorProfile(vendorUserId);

        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                payment: true,
                branch: { select: { vendorProfileId: true } },
            },
        });

        if (!booking) throw new NotFoundException('Booking not found');
        if (booking.branch.vendorProfileId !== vp.id) throw new ForbiddenException('Booking does not belong to your branches');
        if (!booking.payment) throw new BadRequestException('Booking has no payment record');

        const logs = await this.prisma.paymentLog.findMany({
            where: { paymentId: booking.payment.id },
            include: { performedBy: { select: { name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return logs.map(log => ({
            id: log.id,
            paymentId: log.paymentId,
            action: log.action,
            performedBy: { name: log.performedBy.name, role: log.performedBy.role },
            receiptNumber: log.receiptNumber,
            notes: log.notes,
            details: log.details,
            createdAt: log.createdAt.toISOString(),
        }));
    }

    // ==================== CUSTOMER SEARCH ====================

    async searchCustomers(userId: string, search: string, limit = 10) {
        await this.getApprovedVendorProfile(userId);

        if (!search || search.length < 2) {
            return { data: [] };
        }

        const customers = await this.prisma.user.findMany({
            where: {
                role: 'CUSTOMER',
                isActive: true,
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } },
                ],
            },
            select: { id: true, name: true, email: true, phone: true, entityType: true, customerClassification: true },
            take: limit,
        });

        return { data: customers };
    }

    // ==================== VENDOR ADD-ONS ====================

    async getAddOns(userId: string) {
        const vp = await this.getApprovedVendorProfile(userId);
        const addOns = await this.prisma.vendorAddOn.findMany({
            where: { vendorProfileId: vp.id },
            orderBy: { createdAt: 'desc' },
        });
        return addOns.map(a => ({
            id: a.id,
            name: a.name,
            nameAr: a.nameAr,
            unitPrice: a.unitPrice.toNumber(),
            currency: a.currency,
            isActive: a.isActive,
            createdAt: a.createdAt.toISOString(),
        }));
    }

    async createAddOn(userId: string, dto: CreateVendorAddOnDto) {
        const vp = await this.getApprovedVendorProfile(userId);
        const addOn = await this.prisma.vendorAddOn.create({
            data: {
                vendorProfileId: vp.id,
                name: dto.name,
                nameAr: dto.nameAr,
                unitPrice: dto.unitPrice,
            },
        });
        return { id: addOn.id, name: addOn.name, nameAr: addOn.nameAr, unitPrice: addOn.unitPrice.toNumber(), currency: addOn.currency, isActive: addOn.isActive };
    }

    async updateAddOn(userId: string, id: string, dto: UpdateVendorAddOnDto) {
        const vp = await this.getApprovedVendorProfile(userId);
        const addOn = await this.prisma.vendorAddOn.findUnique({ where: { id } });
        if (!addOn || addOn.vendorProfileId !== vp.id) throw new NotFoundException('Add-on not found');
        const updated = await this.prisma.vendorAddOn.update({
            where: { id },
            data: { name: dto.name, nameAr: dto.nameAr, unitPrice: dto.unitPrice, isActive: dto.isActive },
        });
        return { id: updated.id, name: updated.name, nameAr: updated.nameAr, unitPrice: updated.unitPrice.toNumber(), currency: updated.currency, isActive: updated.isActive };
    }

    async deleteAddOn(userId: string, id: string) {
        const vp = await this.getApprovedVendorProfile(userId);
        const addOn = await this.prisma.vendorAddOn.findUnique({ where: { id } });
        if (!addOn || addOn.vendorProfileId !== vp.id) throw new NotFoundException('Add-on not found');
        await this.prisma.vendorAddOn.update({ where: { id }, data: { isActive: false } });
        return { message: 'Add-on deactivated' };
    }

    // ==================== CREATE CUSTOMER ====================

    async createCustomer(userId: string, dto: CreateCustomerDto) {
        await this.getApprovedVendorProfile(userId);

        if (!dto.email && !dto.phone) {
            throw new BadRequestException('At least one of email or phone is required');
        }

        // Check existing by email
        if (dto.email) {
            const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
            if (existing) {
                return { id: existing.id, name: existing.name, email: existing.email, phone: existing.phone, entityType: existing.entityType, customerClassification: existing.customerClassification, isNew: false };
            }
        }

        // Check existing by phone
        if (dto.phone) {
            const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
            if (existing) {
                return { id: existing.id, name: existing.name, email: existing.email, phone: existing.phone, entityType: existing.entityType, customerClassification: existing.customerClassification, isNew: false };
            }
        }

        const randomPassword = randomUUID();
        const passwordHash = await bcrypt.hash(randomPassword, 10);

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email || null,
                phone: dto.phone || null,
                role: 'CUSTOMER',
                isActive: true,
                passwordHash,
                entityType: dto.entityType ?? 'INDIVIDUAL',
            },
        });

        return { id: user.id, name: user.name, email: user.email, phone: user.phone, entityType: user.entityType, customerClassification: user.customerClassification, isNew: true };
    }

    // ==================== PROMO CODE VALIDATION ====================

    async validatePromoCode(userId: string, dto: ValidatePromoDto) {
        const vp = await this.getApprovedVendorProfile(userId);

        const promo = await this.prisma.promoCode.findUnique({ where: { code: dto.code } });
        if (!promo || promo.vendorProfileId !== vp.id) {
            return { valid: false, discountPercent: 0, message: 'Promo code not found' };
        }
        if (!promo.isActive) {
            return { valid: false, discountPercent: 0, message: 'Promo code is inactive' };
        }
        if (promo.validUntil && promo.validUntil < new Date()) {
            return { valid: false, discountPercent: 0, message: 'Promo code has expired' };
        }
        if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
            return { valid: false, discountPercent: 0, message: 'Promo code has reached maximum uses' };
        }
        if (dto.branchId && promo.branchId && promo.branchId !== dto.branchId) {
            return { valid: false, discountPercent: 0, message: 'Promo code is not valid for this branch' };
        }

        return { valid: true, discountPercent: promo.discountPercent, message: 'Promo code is valid', promoCodeId: promo.id };
    }

    // ==================== VENDOR BOOKING CREATION ====================

    async createBookingForCustomer(vendorUserId: string, dto: CreateVendorBookingDto) {
        const vp = await this.getApprovedVendorProfile(vendorUserId);

        // Validate branch belongs to vendor
        const branch = await this.prisma.branch.findUnique({
            where: { id: dto.branchId },
            select: { id: true, name: true, status: true, vendorProfileId: true },
        });
        if (!branch || branch.vendorProfileId !== vp.id) {
            throw new ForbiddenException('Branch does not belong to you');
        }
        if (branch.status !== 'ACTIVE') {
            throw new BadRequestException('Branch is not currently active');
        }

        // Validate customer exists
        const customer = await this.prisma.user.findUnique({ where: { id: dto.customerId } });
        if (!customer || !customer.isActive) {
            throw new BadRequestException('Customer not found or inactive');
        }

        if (!dto.days || dto.days.length === 0) {
            throw new BadRequestException('At least one booking day is required');
        }

        const bookingGroupId = randomUUID();

        // Resolve promo code if provided
        let resolvedDiscountType = dto.discountType || 'NONE';
        let resolvedDiscountValue = dto.discountValue || 0;
        let promoCodeId: string | null = null;

        if (dto.promoCode) {
            const promoResult = await this.validatePromoCode(vendorUserId, { code: dto.promoCode, branchId: dto.branchId });
            if (!promoResult.valid) {
                throw new BadRequestException(promoResult.message);
            }
            resolvedDiscountType = 'PERCENTAGE';
            resolvedDiscountValue = promoResult.discountPercent;
            promoCodeId = promoResult.promoCodeId!;
        }

        // Determine tax
        const subjectToTax = dto.subjectToTax ?? vp.taxEnabled;
        const taxRate = subjectToTax ? vp.taxRate.toNumber() : 0;

        // Compute aggregate subtotal
        let aggregateSubtotal = 0;
        const daySubtotals: number[] = [];

        const dayPricingModes: string[] = [];

        for (const day of dto.days) {
            let daySubtotal = day.unitPrice || 0;

            // Look up pricing mode from the service pricing record
            const pricingRecord = day.pricingInterval && day.serviceId
                ? await this.prisma.servicePricing.findFirst({
                    where: { serviceId: day.serviceId, interval: day.pricingInterval as any, isActive: true },
                })
                : null;
            const dayPricingMode = pricingRecord?.pricingMode || 'PER_BOOKING';
            dayPricingModes.push(dayPricingMode);

            // Apply pricing mode multiplier
            const numberOfPeopleForCalc = day.numberOfPeople ?? 1;
            let durationHours = 0;
            if (day.startTime && day.endTime) {
                const [sh, sm] = day.startTime.split(':').map(Number) as [number, number];
                const [eh, em] = day.endTime.split(':').map(Number) as [number, number];
                durationHours = Math.max(((eh * 60 + em) - (sh * 60 + sm)) / 60, 0);
            }
            daySubtotal = calculateSubtotal(daySubtotal, dayPricingMode, numberOfPeopleForCalc, durationHours);

            if (day.addOns) {
                for (const addOn of day.addOns) {
                    const vendorAddOn = await this.prisma.vendorAddOn.findUnique({ where: { id: addOn.vendorAddOnId } });
                    if (!vendorAddOn || vendorAddOn.vendorProfileId !== vp.id) {
                        throw new BadRequestException(`Add-on ${addOn.vendorAddOnId} not found`);
                    }
                    daySubtotal += vendorAddOn.unitPrice.toNumber() * addOn.quantity;
                }
            }
            daySubtotals.push(daySubtotal);
            aggregateSubtotal += daySubtotal;
        }

        // Compute discount
        let discountAmount = 0;
        if (resolvedDiscountType === 'PERCENTAGE' && resolvedDiscountValue > 0) {
            discountAmount = aggregateSubtotal * (resolvedDiscountValue / 100);
        } else if (resolvedDiscountType === 'FIXED' && resolvedDiscountValue > 0) {
            discountAmount = Math.min(resolvedDiscountValue, aggregateSubtotal);
        }

        // Compute tax
        const taxableAmount = aggregateSubtotal - discountAmount;
        const totalTax = subjectToTax ? taxableAmount * (taxRate / 100) : 0;
        const grandTotal = taxableAmount + totalTax;

        const createdBookings: any[] = [];

        for (let i = 0; i < dto.days.length; i++) {
            const day = dto.days[i]!;
            const daySubtotal = daySubtotals[i]!;
            const ratio = aggregateSubtotal > 0 ? daySubtotal / aggregateSubtotal : 1 / dto.days.length;
            const dayDiscount = discountAmount * ratio;
            const dayTax = totalTax * ratio;
            const dayTotal = daySubtotal - dayDiscount + dayTax;

            // Validate service for this day
            const service = await this.prisma.service.findUnique({
                where: { id: day.serviceId },
                include: { setupConfigs: true, pricing: { where: { isActive: true } } },
            });
            if (!service || !service.isActive || service.branchId !== dto.branchId) {
                throw new BadRequestException(`Service ${day.serviceId} not found or does not belong to branch`);
            }

            const numberOfPeople = day.numberOfPeople ?? 1;
            const effectiveCapacity = service.setupConfigs.length > 0
                ? Math.max(...service.setupConfigs.map(c => c.maxPeople))
                : service.capacity ?? 0;

            // Reject setup type for non-eligible service types
            if (day.setupType && !SETUP_ELIGIBLE_TYPES.includes(service.type)) {
                throw new BadRequestException(
                    `Setup type is only available for Meeting Room and Event Space (service: ${service.type})`,
                );
            }

            if (day.setupType && service.setupConfigs.length > 0) {
                const config = service.setupConfigs.find(c => c.setupType === day.setupType);
                if (config && (numberOfPeople < config.minPeople || numberOfPeople > config.maxPeople)) {
                    throw new BadRequestException(
                        `Setup ${day.setupType} requires between ${config.minPeople} and ${config.maxPeople} people`,
                    );
                }
            }

            const startTime = new Date(`${day.date}T${day.startTime}:00`);
            const endTime = new Date(`${day.date}T${day.endTime}:00`);

            if (endTime <= startTime) {
                throw new BadRequestException(`End time must be after start time for ${day.date}`);
            }

            const lockKey = `booking:${day.serviceId}:${startTime.toISOString()}`;
            const locked = await this.redis.acquireLock(lockKey, 30);
            if (!locked) {
                throw new ConflictException(`Another booking is being processed for ${day.date}. Please try again.`);
            }

            try {
                if (effectiveCapacity > 0) {
                    await checkSlotAvailability(
                        this.prisma, day.serviceId, startTime, endTime,
                        effectiveCapacity, `No availability for ${day.date}`,
                    );
                }

                const booking = await this.prisma.booking.create({
                    data: {
                        userId: dto.customerId,
                        branchId: dto.branchId,
                        serviceId: day.serviceId,
                        status: 'CONFIRMED',
                        startTime,
                        endTime,
                        numberOfPeople,
                        totalPrice: dayTotal,
                        notes: day.notes || dto.notes,
                        requestedSetup: day.setupType ?? null,
                        pricingInterval: day.pricingInterval ?? null,
                        pricingMode: dayPricingModes[i] as any,
                        unitPrice: day.unitPrice ?? null,
                        subtotal: daySubtotal,
                        discountType: resolvedDiscountType as any,
                        discountValue: resolvedDiscountValue || null,
                        discountAmount: dayDiscount || null,
                        taxRate: subjectToTax ? taxRate : null,
                        taxAmount: dayTax || null,
                        promoCodeId,
                        bookingGroupId,
                        payment: {
                            create: {
                                method: 'CASH',
                                status: 'PENDING',
                                amount: dayTotal,
                                paidAt: null,
                            },
                        },
                    },
                    include: {
                        branch: { select: { id: true, name: true, city: true, address: true } },
                        service: { select: { id: true, type: true, name: true } },
                        payment: true,
                    },
                });

                // Create add-on records
                if (day.addOns && day.addOns.length > 0) {
                    for (const addOn of day.addOns) {
                        const vendorAddOn = await this.prisma.vendorAddOn.findUnique({ where: { id: addOn.vendorAddOnId } });
                        if (vendorAddOn) {
                            await this.prisma.bookingAddOn.create({
                                data: {
                                    bookingId: booking.id,
                                    vendorAddOnId: addOn.vendorAddOnId,
                                    name: vendorAddOn.name,
                                    unitPrice: vendorAddOn.unitPrice,
                                    quantity: addOn.quantity,
                                    totalPrice: vendorAddOn.unitPrice.toNumber() * addOn.quantity,
                                    serviceTime: addOn.serviceTime,
                                    comments: addOn.comments,
                                },
                            });
                        }
                    }
                }

                if (booking.payment) {
                    await this.prisma.paymentLog.create({
                        data: {
                            paymentId: booking.payment.id,
                            action: 'CREATED',
                            performedById: vendorUserId,
                            details: `Cash payment of ${dayTotal.toFixed(3)} JOD created by vendor for booking at ${branch.name}`,
                        },
                    });
                }

                createdBookings.push(booking);
            } finally {
                await this.redis.releaseLock(lockKey);
            }
        }

        // Increment promo code uses
        if (promoCodeId) {
            await this.prisma.promoCode.update({
                where: { id: promoCodeId },
                data: { currentUses: { increment: 1 } },
            });
        }

        // Notify customer
        const datesSummary = dto.days.length > 1
            ? `${dto.days.length} bookings on multiple dates`
            : `a booking`;
        await this.prisma.notification.create({
            data: {
                userId: dto.customerId,
                type: 'BOOKING_CONFIRMED',
                title: 'Booking Confirmed',
                message: `${datesSummary} at ${branch.name} has been created for you. Payment: Cash (pending).`,
                data: { bookingIds: createdBookings.map(b => b.id), branchId: branch.id },
            },
        });

        return {
            bookingIds: createdBookings.map(b => b.id),
            bookingGroupId,
            financialSummary: {
                subtotal: aggregateSubtotal,
                discount: discountAmount,
                discountType: resolvedDiscountType,
                discountValue: resolvedDiscountValue,
                taxRate,
                tax: totalTax,
                total: grandTotal,
            },
        };
    }

    // ==================== VENDOR BOOKING EDITING ====================

    async updateVendorBooking(vendorUserId: string, bookingId: string, dto: UpdateVendorBookingDto) {
        // 1. Get vendor profile with tax settings
        const vp = await this.getApprovedVendorProfile(vendorUserId);

        // 2. Fetch existing booking with relations
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                branch: { select: { id: true, name: true, city: true, address: true, vendorProfileId: true } },
                service: { select: { id: true, type: true, name: true, branchId: true, isActive: true, capacity: true, pricing: { where: { isActive: true } } } },
                payment: true,
                addOns: true,
            },
        });
        if (!booking) throw new NotFoundException('Booking not found');

        // 3. Verify vendor owns the booking's branch
        if (booking.branch.vendorProfileId !== vp.id) {
            throw new ForbiddenException('This booking does not belong to your branch');
        }

        // 4. Verify status is editable
        const editableStatuses = ['PENDING', 'PENDING_APPROVAL', 'CONFIRMED'];
        if (!editableStatuses.includes(booking.status)) {
            throw new BadRequestException(`Cannot edit booking with status ${booking.status}. Only PENDING, PENDING_APPROVAL, and CONFIRMED bookings can be edited.`);
        }

        // 5. Resolve final values (use dto if provided, else keep existing)
        const finalBranchId = dto.branchId ?? booking.branchId;
        const finalServiceId = dto.serviceId ?? booking.serviceId;
        const finalStartTime = dto.startTime ? new Date(dto.startTime) : booking.startTime;
        const finalEndTime = dto.endTime ? new Date(dto.endTime) : booking.endTime;
        const finalNumberOfPeople = dto.numberOfPeople ?? booking.numberOfPeople;
        const finalNotes = dto.notes !== undefined ? dto.notes : booking.notes;
        const finalRequestedSetup = dto.requestedSetup !== undefined ? (dto.requestedSetup || null) : booking.requestedSetup;
        const finalPricingInterval = dto.pricingInterval ?? booking.pricingInterval;
        const finalDiscountType = dto.discountType !== undefined ? dto.discountType : (booking.discountType as string);
        const finalDiscountValue = dto.discountValue !== undefined ? dto.discountValue : (booking.discountValue?.toNumber() ?? 0);
        const finalSubjectToTax = dto.subjectToTax ?? (booking.taxRate !== null && booking.taxRate.toNumber() > 0);

        // 6. If branchId changed, verify vendor owns the new branch
        let finalBranch = booking.branch;
        if (dto.branchId && dto.branchId !== booking.branchId) {
            const newBranch = await this.prisma.branch.findUnique({
                where: { id: dto.branchId },
                select: { id: true, name: true, city: true, address: true, vendorProfileId: true, status: true },
            });
            if (!newBranch || newBranch.vendorProfileId !== vp.id) {
                throw new ForbiddenException('New branch does not belong to you');
            }
            if (newBranch.status !== 'ACTIVE') {
                throw new BadRequestException('New branch is not currently active');
            }
            finalBranch = newBranch as typeof booking.branch;
        }

        // 7. If serviceId changed, validate new service belongs to the branch and is active
        let finalService = booking.service;
        if (dto.serviceId && dto.serviceId !== booking.serviceId) {
            const newService = await this.prisma.service.findUnique({
                where: { id: dto.serviceId },
                select: { id: true, type: true, name: true, branchId: true, isActive: true, capacity: true, pricing: { where: { isActive: true } } },
            });
            if (!newService || newService.branchId !== finalBranchId) {
                throw new BadRequestException('Service not found or does not belong to the selected branch');
            }
            if (!newService.isActive) {
                throw new BadRequestException('Service is not active');
            }
            finalService = newService as typeof booking.service;
        }

        // 8. Resolve pricing: look up ServicePricing for the service + pricingInterval
        const pricingRecord = finalPricingInterval
            ? await this.prisma.servicePricing.findFirst({
                where: { serviceId: finalServiceId, interval: finalPricingInterval, isActive: true },
            })
            : null;
        const unitPrice = pricingRecord ? pricingRecord.price.toNumber() : (booking.unitPrice?.toNumber() ?? 0);
        const pricingMode = pricingRecord?.pricingMode || booking.pricingMode || 'PER_BOOKING';

        // 9. If startTime/endTime/serviceId changed, check availability EXCLUDING the current booking
        if (dto.startTime || dto.endTime || dto.serviceId) {
            const overlappingCount = await this.prisma.booking.count({
                where: {
                    serviceId: finalServiceId,
                    id: { not: bookingId },
                    status: { in: ['PENDING', 'PENDING_APPROVAL', 'CONFIRMED', 'CHECKED_IN'] },
                    startTime: { lt: finalEndTime },
                    endTime: { gt: finalStartTime },
                },
            });
            const effectiveCapacity = finalService.capacity ?? 0;
            if (effectiveCapacity > 0 && overlappingCount >= effectiveCapacity) {
                throw new ConflictException('No availability for the selected time slot');
            }
        }

        // 10. Recalculate financials
        const durationHours = Math.max((finalEndTime.getTime() - finalStartTime.getTime()) / (1000 * 60 * 60), 0);
        let subtotal = calculateSubtotal(unitPrice, pricingMode, finalNumberOfPeople, durationHours);

        // Add add-on totals
        let addOnTotal = 0;
        if (dto.addOns !== undefined) {
            // Use the new add-ons from the DTO
            for (const addOn of dto.addOns || []) {
                const vendorAddOn = await this.prisma.vendorAddOn.findUnique({ where: { id: addOn.vendorAddOnId } });
                if (!vendorAddOn || vendorAddOn.vendorProfileId !== vp.id) {
                    throw new BadRequestException(`Add-on ${addOn.vendorAddOnId} not found`);
                }
                addOnTotal += vendorAddOn.unitPrice.toNumber() * addOn.quantity;
            }
        } else {
            // Keep existing add-on totals
            for (const existingAddOn of booking.addOns) {
                addOnTotal += existingAddOn.totalPrice.toNumber();
            }
        }
        subtotal += addOnTotal;

        // Recalculate discount
        let discountAmount = 0;
        if (finalDiscountType === 'PERCENTAGE' && finalDiscountValue > 0) {
            discountAmount = subtotal * (finalDiscountValue / 100);
        } else if (finalDiscountType === 'FIXED' && finalDiscountValue > 0) {
            discountAmount = Math.min(finalDiscountValue, subtotal);
        } else if (finalDiscountType === 'PROMO_CODE' && finalDiscountValue > 0) {
            discountAmount = subtotal * (finalDiscountValue / 100);
        }

        const afterDiscount = Math.max(0, subtotal - discountAmount);
        const taxRate = finalSubjectToTax ? vp.taxRate.toNumber() : 0;
        const taxAmount = finalSubjectToTax ? afterDiscount * (taxRate / 100) : 0;
        const totalPrice = afterDiscount + taxAmount;

        // 11. Update the booking record
        const updatedBooking = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                branchId: finalBranchId,
                serviceId: finalServiceId,
                startTime: finalStartTime,
                endTime: finalEndTime,
                numberOfPeople: finalNumberOfPeople,
                notes: finalNotes,
                requestedSetup: finalRequestedSetup as any,
                pricingInterval: finalPricingInterval,
                pricingMode: pricingMode as any,
                unitPrice,
                subtotal,
                discountType: finalDiscountType as any,
                discountValue: finalDiscountValue || null,
                discountAmount: discountAmount || null,
                taxRate: finalSubjectToTax ? taxRate : null,
                taxAmount: taxAmount || null,
                totalPrice,
            },
            include: {
                branch: { select: { id: true, name: true, city: true, address: true } },
                service: { select: { id: true, type: true, name: true } },
                payment: true,
                addOns: true,
                user: { select: { id: true, name: true, email: true } },
            },
        });

        // 12. If dto.addOns provided: deleteMany existing, create new ones
        if (dto.addOns !== undefined) {
            await this.prisma.bookingAddOn.deleteMany({ where: { bookingId } });
            for (const addOn of dto.addOns || []) {
                const vendorAddOn = await this.prisma.vendorAddOn.findUnique({ where: { id: addOn.vendorAddOnId } });
                if (vendorAddOn) {
                    await this.prisma.bookingAddOn.create({
                        data: {
                            bookingId,
                            vendorAddOnId: addOn.vendorAddOnId,
                            name: vendorAddOn.name,
                            unitPrice: vendorAddOn.unitPrice,
                            quantity: addOn.quantity,
                            totalPrice: vendorAddOn.unitPrice.toNumber() * addOn.quantity,
                            serviceTime: addOn.serviceTime,
                            comments: addOn.comments,
                        },
                    });
                }
            }
        }

        // 13. If payment exists and status is PENDING, update payment amount
        if (updatedBooking.payment && updatedBooking.payment.status === 'PENDING') {
            await this.prisma.payment.update({
                where: { id: updatedBooking.payment.id },
                data: { amount: totalPrice },
            });
        }

        // 14. Return serialized booking with Decimal fields converted to numbers
        const refreshedBooking = dto.addOns !== undefined
            ? await this.prisma.booking.findUnique({
                where: { id: bookingId },
                include: {
                    branch: { select: { id: true, name: true, city: true, address: true } },
                    service: { select: { id: true, type: true, name: true } },
                    payment: true,
                    addOns: true,
                    user: { select: { id: true, name: true, email: true } },
                },
            })
            : updatedBooking;

        const b = refreshedBooking!;
        return {
            id: b.id,
            userId: b.userId,
            branchId: b.branchId,
            serviceId: b.serviceId,
            status: b.status,
            startTime: b.startTime,
            endTime: b.endTime,
            numberOfPeople: b.numberOfPeople,
            totalPrice: b.totalPrice.toNumber(),
            currency: b.currency,
            notes: b.notes,
            requestedSetup: b.requestedSetup,
            pricingInterval: b.pricingInterval,
            pricingMode: b.pricingMode,
            unitPrice: b.unitPrice?.toNumber() ?? null,
            subtotal: b.subtotal?.toNumber() ?? null,
            discountType: b.discountType,
            discountValue: b.discountValue?.toNumber() ?? null,
            discountAmount: b.discountAmount?.toNumber() ?? null,
            taxRate: b.taxRate?.toNumber() ?? null,
            taxAmount: b.taxAmount?.toNumber() ?? null,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
            branch: b.branch,
            service: b.service,
            user: b.user,
            payment: b.payment ? {
                id: b.payment.id,
                method: b.payment.method,
                status: b.payment.status,
                amount: b.payment.amount.toNumber(),
            } : null,
            addOns: b.addOns.map(a => ({
                id: a.id,
                vendorAddOnId: a.vendorAddOnId,
                name: a.name,
                unitPrice: a.unitPrice.toNumber(),
                quantity: a.quantity,
                totalPrice: a.totalPrice.toNumber(),
                serviceTime: a.serviceTime,
                comments: a.comments,
            })),
        };
    }
}
