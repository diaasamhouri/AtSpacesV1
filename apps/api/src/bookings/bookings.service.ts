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
        branch: { select: { id: true, status: true, vendorProfileId: true, autoAcceptBookings: true, operatingHours: true } },
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

    // Validate operating hours (times compared in UTC)
    const operatingHours = service.branch.operatingHours as Record<string, { open: string; close: string } | null> | null;
    if (operatingHours) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[startTime.getUTCDay()]!;
      const dayHours = operatingHours[dayName];

      if (!dayHours || !dayHours.open || !dayHours.close) {
        throw new BadRequestException('Branch is closed on this day');
      }

      const [openH, openM] = dayHours.open.split(':').map(Number) as [number, number];
      const [closeH, closeM] = dayHours.close.split(':').map(Number) as [number, number];
      const bookingStartMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
      const bookingEndMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      if (bookingStartMinutes < openMinutes || bookingEndMinutes > closeMinutes) {
        throw new BadRequestException(
          `Booking time is outside operating hours (open: ${dayHours.open}, close: ${dayHours.close})`,
        );
      }
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

      // Notify vendor and customer
      const branchInfo = await this.prisma.branch.findUnique({
        where: { id: service.branch.id },
        select: { name: true, vendor: { select: { userId: true } } },
      });
      if (branchInfo) {
        const isAutoAccepted = bookingStatus === 'CONFIRMED';
        await this.prisma.notification.createMany({
          data: [
            {
              userId: branchInfo.vendor.userId,
              type: isAutoAccepted ? 'BOOKING_CONFIRMED' : 'GENERAL',
              title: isAutoAccepted ? 'New Booking Confirmed' : 'New Booking Awaiting Approval',
              message: isAutoAccepted
                ? `A new booking at ${branchInfo.name} has been auto-confirmed.`
                : `A new booking at ${branchInfo.name} is awaiting your approval.`,
            },
            {
              userId,
              type: isAutoAccepted ? 'BOOKING_CONFIRMED' : 'GENERAL',
              title: isAutoAccepted ? 'Booking Confirmed' : 'Booking Submitted',
              message: isAutoAccepted
                ? `Your booking at ${branchInfo.name} has been confirmed.`
                : `Your booking at ${branchInfo.name} has been submitted and is awaiting approval.`,
            },
          ],
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

  async getVendorBookings(userId: string, query: { page?: number; limit?: number; search?: string; status?: string } = {}) {
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
    if (query.status) {
      where.status = query.status;
    }
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

    // Notify customer about status change
    const notifType = status === 'CONFIRMED' ? 'BOOKING_CONFIRMED'
      : status === 'REJECTED' ? 'BOOKING_CANCELLED'
      : 'GENERAL';
    const statusLabel = String(status).replace(/_/g, ' ').toLowerCase();
    await this.prisma.notification.create({
      data: {
        userId: booking.userId,
        type: notifType,
        title: `Booking ${status === 'CONFIRMED' ? 'Confirmed' : status === 'REJECTED' ? 'Rejected' : statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}`,
        message: `Your booking at ${updated.branch.name} has been ${statusLabel}.`,
      },
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

    if (!['PENDING', 'PENDING_APPROVAL', 'CONFIRMED'].includes(booking.status)) {
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

    // Notify vendor about cancellation
    const cancelBranch = await this.prisma.branch.findUnique({
      where: { id: booking.branchId },
      select: { name: true, vendor: { select: { userId: true } } },
    });
    if (cancelBranch) {
      await this.prisma.notification.create({
        data: {
          userId: cancelBranch.vendor.userId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          message: `A customer has cancelled their booking at ${cancelBranch.name}.`,
        },
      });
    }

    return this.serializeBooking(updated);
  }

  async checkAvailability(
    serviceId: string,
    startTime: string,
    endTime: string,
    numberOfPeople?: number,
  ) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const requestedPeople = numberOfPeople ?? 1;

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        branch: { select: { status: true, operatingHours: true } },
      },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found or inactive');
    }

    const capacity = service.capacity;

    // Check branch status
    if (service.branch.status !== 'ACTIVE') {
      return {
        available: false,
        currentBookings: 0,
        capacity,
        remainingSpots: 0,
        reason: 'Branch is not currently active',
      };
    }

    // Check operating hours
    const operatingHours = service.branch.operatingHours as Record<string, { open: string; close: string } | null> | null;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[start.getUTCDay()]!;
    let operatingHoursForDay: { open: string; close: string } | null = null;

    if (operatingHours) {
      const dayHours = operatingHours[dayName];
      operatingHoursForDay = dayHours ?? null;

      if (!dayHours || !dayHours.open || !dayHours.close) {
        const suggestions = await this.findSuggestedSlots(serviceId, capacity, start, end, operatingHours);
        return {
          available: false,
          currentBookings: 0,
          capacity,
          remainingSpots: 0,
          reason: 'Branch is closed on this day',
          operatingHoursForDay: null,
          suggestedSlots: suggestions,
        };
      }

      const [openH, openM] = dayHours.open.split(':').map(Number) as [number, number];
      const [closeH, closeM] = dayHours.close.split(':').map(Number) as [number, number];
      const bookingStartMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
      const bookingEndMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      if (bookingStartMinutes < openMinutes || bookingEndMinutes > closeMinutes) {
        const suggestions = await this.findSuggestedSlots(serviceId, capacity, start, end, operatingHours);
        return {
          available: false,
          currentBookings: 0,
          capacity,
          remainingSpots: 0,
          reason: `Booking time is outside operating hours (open: ${dayHours.open}, close: ${dayHours.close})`,
          operatingHoursForDay,
          suggestedSlots: suggestions,
        };
      }
    }

    // Count overlapping active bookings
    const currentBookings = await this.prisma.booking.count({
      where: {
        serviceId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    const remainingSpots = capacity - currentBookings;
    const available = remainingSpots >= requestedPeople;

    if (!available) {
      const suggestions = await this.findSuggestedSlots(serviceId, capacity, start, end, operatingHours);
      return {
        available: false,
        currentBookings,
        capacity,
        remainingSpots: Math.max(0, remainingSpots),
        reason: remainingSpots <= 0
          ? `Fully booked (${currentBookings}/${capacity})`
          : `Not enough capacity for ${requestedPeople} people (${remainingSpots} spots remaining)`,
        operatingHoursForDay,
        suggestedSlots: suggestions,
      };
    }

    return {
      available: true,
      currentBookings,
      capacity,
      remainingSpots,
      operatingHoursForDay,
    };
  }

  private async findSuggestedSlots(
    serviceId: string,
    capacity: number,
    originalStart: Date,
    originalEnd: Date,
    operatingHours: Record<string, { open: string; close: string } | null> | null,
  ): Promise<{ startTime: string; endTime: string; label: string }[]> {
    const suggestions: { startTime: string; endTime: string; label: string }[] = [];
    const durationMs = originalEnd.getTime() - originalStart.getTime();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const now = new Date();

    for (let dayOffset = 0; dayOffset <= 7 && suggestions.length < 3; dayOffset++) {
      const candidateDate = new Date(originalStart);
      candidateDate.setUTCDate(candidateDate.getUTCDate() + dayOffset);

      const dayName = days[candidateDate.getUTCDay()]!;
      const dayHours = operatingHours?.[dayName];
      if (!dayHours || !dayHours.open || !dayHours.close) continue;

      const [openH, openM] = dayHours.open.split(':').map(Number) as [number, number];
      const [closeH, closeM] = dayHours.close.split(':').map(Number) as [number, number];
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      // Scan hourly slots within operating hours
      for (let minutes = openMinutes; minutes + (durationMs / 60000) <= closeMinutes && suggestions.length < 3; minutes += 60) {
        const slotStart = new Date(candidateDate);
        slotStart.setUTCHours(0, 0, 0, 0);
        slotStart.setUTCMinutes(minutes);
        const slotEnd = new Date(slotStart.getTime() + durationMs);

        // Skip past slots
        if (slotStart <= now) continue;

        // Skip the originally-requested slot
        if (slotStart.getTime() === originalStart.getTime()) continue;

        const overlapping = await this.prisma.booking.count({
          where: {
            serviceId,
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            startTime: { lt: slotEnd },
            endTime: { gt: slotStart },
          },
        });

        if (overlapping < capacity) {
          const dayLabel = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : slotStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const timeLabel = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
          suggestions.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            label: `${dayLabel} at ${timeLabel}`,
          });
        }
      }
    }

    return suggestions;
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
