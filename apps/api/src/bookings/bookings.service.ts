import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateBookingDto } from './dto';
import { buildPaginatedResponse } from '../common/helpers/paginate';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) { }

  async createBooking(userId: string, dto: CreateBookingDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Fetch service with pricing
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: {
        pricing: { where: { isActive: true } },
        branch: { select: { id: true, status: true, vendorProfileId: true, autoAcceptBookings: true } },
      },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found or inactive');
    }

    if (service.branch.status !== 'ACTIVE') {
      throw new BadRequestException('Branch is not currently active');
    }

    // Find the matching pricing interval
    const pricing = service.pricing.find(
      (p) => p.interval === dto.pricingInterval,
    );
    if (!pricing) {
      throw new BadRequestException(
        `No pricing available for interval: ${dto.pricingInterval}`,
      );
    }

    if (dto.numberOfPeople > service.capacity) {
      throw new BadRequestException(
        `Requested ${dto.numberOfPeople} people but service capacity is ${service.capacity}`,
      );
    }

    // Acquire Redis lock to prevent double-booking
    const lockKey = `booking:${dto.serviceId}:${startTime.toISOString()}`;
    const locked = await this.redis.acquireLock(lockKey, 30);

    if (!locked) {
      throw new ConflictException(
        'Another booking is being processed for this slot. Please try again.',
      );
    }

    try {
      // Check capacity — count overlapping active bookings
      const overlappingCount = await this.prisma.booking.count({
        where: {
          serviceId: dto.serviceId,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (overlappingCount >= service.capacity) {
        throw new ConflictException(
          'No availability for the selected time slot',
        );
      }

      // Calculate total price
      let totalPrice = pricing.price.toNumber();

      let promoCodeRecord: any = null;
      if (dto.promoCode) {
        promoCodeRecord = await this.prisma.promoCode.findFirst({
          where: {
            code: dto.promoCode.toUpperCase(),
            isActive: true,
            OR: [
              { branchId: service.branch.id },
              { branchId: null, vendorProfileId: service.branch.vendorProfileId }
            ]
          }
        });

        if (!promoCodeRecord) {
          throw new BadRequestException('Invalid or inactive promo code');
        }

        if (promoCodeRecord.validUntil && new Date() > promoCodeRecord.validUntil) {
          throw new BadRequestException('Promo code has expired');
        }

        if (promoCodeRecord.maxUses > 0 && promoCodeRecord.currentUses >= promoCodeRecord.maxUses) {
          throw new BadRequestException('Promo code usage limit reached');
        }

        const discountAmount = (totalPrice * promoCodeRecord.discountPercent) / 100;
        totalPrice = Math.max(0, totalPrice - discountAmount);
      }

      // Determine payment status based on method
      const isCash = dto.paymentMethod === 'CASH';
      const paymentStatus = isCash ? 'PENDING' : 'COMPLETED';
      const bookingStatus = service.branch.autoAcceptBookings ? 'CONFIRMED' : 'PENDING_APPROVAL';

      // Create booking + payment in a transaction
      const booking = await this.prisma.booking.create({
        data: {
          userId,
          branchId: service.branch.id,
          serviceId: dto.serviceId,
          status: bookingStatus,
          startTime,
          endTime,
          numberOfPeople: dto.numberOfPeople,
          totalPrice,
          notes: dto.notes,
          payment: {
            create: {
              method: dto.paymentMethod,
              status: paymentStatus,
              amount: totalPrice,
              paidAt: isCash ? null : new Date(),
            },
          },
        },
        include: {
          branch: {
            select: { id: true, name: true, city: true, address: true },
          },
          service: { select: { id: true, type: true, name: true } },
          payment: true,
        },
      });

      // Increment promo code usage if applicable
      if (promoCodeRecord) {
        await this.prisma.promoCode.update({
          where: { id: promoCodeRecord.id },
          data: { currentUses: { increment: 1 } }
        });
      }

      return this.serializeBooking(booking);
    } finally {
      await this.redis.releaseLock(lockKey);
    }
  }

  async verifyPromoCode(code: string, serviceId: string) {
    const promoCode = code.toUpperCase();

    // Verify service exists to get branch and vendor details
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { branch: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Find the promo code
    const promoCodeRecord = await this.prisma.promoCode.findFirst({
      where: {
        code: promoCode,
        isActive: true,
        OR: [
          { branchId: service.branch.id }, // Specific to this branch
          { branchId: null, vendorProfileId: service.branch.vendorProfileId } // Global to vendor
        ]
      }
    });

    if (!promoCodeRecord) {
      throw new BadRequestException('Invalid or inactive promo code');
    }

    if (promoCodeRecord.validUntil && new Date() > promoCodeRecord.validUntil) {
      throw new BadRequestException('Promo code has expired');
    }

    if (promoCodeRecord.maxUses > 0 && promoCodeRecord.currentUses >= promoCodeRecord.maxUses) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    return {
      valid: true,
      code: promoCodeRecord.code,
      discountPercent: promoCodeRecord.discountPercent,
    };
  }

  async getUserBookings(userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { id: true, name: true, city: true, address: true } },
        service: { select: { id: true, type: true, name: true } },
        payment: true,
      },
    });

    return { data: bookings.map((b) => this.serializeBooking(b)) };
  }

  async getVendorBookings(userId: string, query: { page?: number; limit?: number; search?: string } = {}) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });
    if (!vendorProfile || vendorProfile.status !== 'APPROVED') {
      throw new ForbiddenException('Only approved vendors can view these bookings');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { branch: { vendorProfileId: vendorProfile.id } };
    if (query.search) {
      where.user = { name: { contains: query.search, mode: 'insensitive' } };
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          branch: { select: { id: true, name: true, city: true, address: true } },
          service: { select: { id: true, type: true, name: true } },
          payment: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return buildPaginatedResponse(
      bookings.map((b) => ({ ...this.serializeBooking(b), customer: b.user })),
      total, page, limit,
    );
  }

  async updateBookingStatus(userId: string, bookingId: string, status: any) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });
    if (!vendorProfile || vendorProfile.status !== 'APPROVED') {
      throw new ForbiddenException('Only approved vendors can update bookings');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { branch: true },
    });

    if (!booking || booking.branch.vendorProfileId !== vendorProfile.id) {
      throw new NotFoundException('Booking not found');
    }

    if (status === 'REJECTED') {
      const payment = await this.prisma.payment.findUnique({
        where: { bookingId },
      });
      if (payment && payment.status === 'COMPLETED') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        branch: { select: { id: true, name: true, city: true, address: true } },
        service: { select: { id: true, type: true, name: true } },
        payment: true,
      }
    });

    return this.serializeBooking(updated);
  }

  async getBookingById(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        branch: { select: { id: true, name: true, city: true, address: true } },
        service: { select: { id: true, type: true, name: true } },
        payment: true,
      },
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    return this.serializeBooking(booking);
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException(
        `Cannot cancel a booking with status: ${booking.status}`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        payment:
          booking.payment && booking.payment.status === 'COMPLETED'
            ? { update: { status: 'REFUNDED' } }
            : undefined,
      },
      include: {
        branch: { select: { id: true, name: true, city: true, address: true } },
        service: { select: { id: true, type: true, name: true } },
        payment: true,
      },
    });

    return this.serializeBooking(updated);
  }

  async checkAvailability(
    serviceId: string,
    startTime: string,
    endTime: string,
  ) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { capacity: true, isActive: true },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found or inactive');
    }

    const currentBookings = await this.prisma.booking.count({
      where: {
        serviceId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    return {
      available: currentBookings < service.capacity,
      currentBookings,
      capacity: service.capacity,
    };
  }

  private serializeBooking(booking: any) {
    return {
      id: booking.id,
      status: booking.status,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      numberOfPeople: booking.numberOfPeople,
      totalPrice: booking.totalPrice.toNumber(),
      currency: booking.currency,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      branch: booking.branch,
      service: booking.service,
      payment: booking.payment
        ? {
          id: booking.payment.id,
          method: booking.payment.method,
          status: booking.payment.status,
          amount: booking.payment.amount.toNumber(),
          currency: booking.payment.currency,
          paidAt: booking.payment.paidAt?.toISOString() ?? null,
        }
        : null,
    };
  }
}
