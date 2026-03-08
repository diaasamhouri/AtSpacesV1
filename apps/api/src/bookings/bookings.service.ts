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

const SETUP_ELIGIBLE_TYPES = ['MEETING_ROOM', 'EVENT_SPACE'];

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) { }

  /** Allowed booking status transitions */
  private static readonly VALID_TRANSITIONS: Record<string, string[]> = {
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

  async createBooking(userId: string, dto: CreateBookingDto) {
    const startTime = new Date(dto.startTime);
    let endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Enforce half-day = 4 hours
    if (dto.pricingInterval === 'HALF_DAY') {
      const diffMs = endTime.getTime() - startTime.getTime();
      const fourHoursMs = 4 * 60 * 60 * 1000;
      if (Math.abs(diffMs - fourHoursMs) > 60000) {
        // Auto-correct endTime to startTime + 4 hours
        endTime = new Date(startTime.getTime() + fourHoursMs);
      }
    }

    // Fetch service with pricing
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: {
        pricing: { where: { isActive: true, isPublic: true } },
        branch: { select: { id: true, status: true, vendorProfileId: true, autoAcceptBookings: true, operatingHours: true } },
      },
    });

    if (!service || !service.isActive || !service.isPublic) {
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

    // Reject requestedSetup for non-eligible service types
    if (dto.requestedSetup && !SETUP_ELIGIBLE_TYPES.includes(service.type)) {
      throw new BadRequestException('Setup type is only available for Meeting Room and Event Space');
    }

    // Capacity check: use setupConfigs if available
    const effectiveCapacity = service.capacity ?? 0;
    if (dto.numberOfPeople > effectiveCapacity) {
      throw new BadRequestException(
        `Requested ${dto.numberOfPeople} people but service capacity is ${effectiveCapacity}`,
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

      if (overlappingCount >= (service.capacity ?? 0)) {
        throw new ConflictException(
          'No availability for the selected time slot',
        );
      }

      // Calculate financial breakdown
      const unitPrice = pricing.price.toNumber();
      const pricingMode = pricing.pricingMode || 'PER_BOOKING';

      let subtotal = unitPrice;
      if (pricingMode === 'PER_PERSON') {
        subtotal = unitPrice * dto.numberOfPeople;
      } else if (pricingMode === 'PER_HOUR') {
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        subtotal = unitPrice * hours;
      }

      // Promo code validation + discount
      let promoCodeRecord: any = null;
      let discountType: string = 'NONE';
      let discountValue: number | null = null;
      let discountAmount = 0;
      let promoCodeId: string | null = null;

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

        discountType = 'PROMO_CODE';
        discountValue = promoCodeRecord.discountPercent;
        discountAmount = (subtotal * promoCodeRecord.discountPercent) / 100;
        promoCodeId = promoCodeRecord.id;
      }

      const afterDiscount = Math.max(0, subtotal - discountAmount);

      // Tax calculation from vendor profile
      const vendorProfile = await this.prisma.vendorProfile.findUnique({
        where: { id: service.branch.vendorProfileId },
        select: { taxRate: true, taxEnabled: true },
      });

      let taxRate: number | null = null;
      let taxAmount = 0;
      if (vendorProfile?.taxEnabled) {
        taxRate = (vendorProfile.taxRate as any).toNumber?.() ?? Number(vendorProfile.taxRate);
        taxAmount = (afterDiscount * taxRate!) / 100;
      }

      const totalPrice = afterDiscount + taxAmount;

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
          pricingInterval: dto.pricingInterval,
          pricingMode: pricingMode as any,
          unitPrice,
          subtotal,
          discountType: discountType as any,
          discountValue: discountValue,
          discountAmount: discountAmount,
          taxRate: taxRate,
          taxAmount: taxAmount,
          promoCodeId: promoCodeId,
          notes: dto.notes,
          requestedSetup: dto.requestedSetup ?? null,
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
          addOns: true,
        },
      });

      // Log payment creation
      if (booking.payment) {
        await this.prisma.paymentLog.create({
          data: {
            paymentId: booking.payment.id,
            action: 'CREATED',
            performedById: userId,
            details: `${dto.paymentMethod} payment of ${totalPrice} JOD created for booking at ${booking.branch.name}`,
          },
        });
      }

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
              data: { bookingId: booking.id, branchId: service.branch.id },
            },
            {
              userId,
              type: isAutoAccepted ? 'BOOKING_CONFIRMED' : 'GENERAL',
              title: isAutoAccepted ? 'Booking Confirmed' : 'Booking Submitted',
              message: isAutoAccepted
                ? `Your booking at ${branchInfo.name} has been confirmed.`
                : `Your booking at ${branchInfo.name} has been submitted and is awaiting approval.`,
              data: { bookingId: booking.id, branchId: service.branch.id },
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
        addOns: true,
      },
    });

    return { data: bookings.map((b) => this.serializeBooking(b)) };
  }

  async getVendorBookings(userId: string, query: { page?: number; limit?: number; search?: string; status?: string; salesApproved?: boolean; accountantApproved?: boolean } = {}) {
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
    if (query.salesApproved !== undefined) {
      where.salesApproved = query.salesApproved;
    }
    if (query.accountantApproved !== undefined) {
      where.accountantApproved = query.accountantApproved;
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
          addOns: true,
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

  async updateBookingStatus(userId: string, bookingId: string, status: string) {
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

    // Validate status transition
    const allowed = BookingsService.VALID_TRANSITIONS[booking.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${status}`,
      );
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
      data: { status: status as any },
      include: {
        branch: { select: { id: true, name: true, city: true, address: true } },
        service: { select: { id: true, type: true, name: true } },
        payment: true,
        addOns: true,
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
        data: { bookingId: booking.id, branchId: booking.branchId },
      },
    });

    return this.serializeBooking(updated);
  }

  async approveSales(userId: string, bookingId: string) {
    return this.approveStep(userId, bookingId, 'sales');
  }

  async approveAccountant(userId: string, bookingId: string) {
    return this.approveStep(userId, bookingId, 'accountant');
  }

  private async approveStep(userId: string, bookingId: string, step: 'sales' | 'accountant') {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });
    if (!vendorProfile || vendorProfile.status !== 'APPROVED') {
      throw new ForbiddenException('Only approved vendors can approve bookings');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { branch: true },
    });

    if (!booking || booking.branch.vendorProfileId !== vendorProfile.id) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Only PENDING_APPROVAL bookings can be approved');
    }

    const updateData: any = {};
    if (step === 'sales') {
      if (booking.salesApproved) throw new BadRequestException('Sales already approved');
      updateData.salesApproved = true;
      // If accountant was already approved, auto-confirm
      if (booking.accountantApproved) {
        updateData.status = 'CONFIRMED';
      }
    } else {
      if (booking.accountantApproved) throw new BadRequestException('Accountant already approved');
      updateData.accountantApproved = true;
      // If sales was already approved, auto-confirm
      if (booking.salesApproved) {
        updateData.status = 'CONFIRMED';
      }
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true, city: true, address: true } },
        service: { select: { id: true, type: true, name: true } },
        payment: true,
        addOns: true,
      },
    });

    // Notify customer if booking was auto-confirmed
    if (updateData.status === 'CONFIRMED') {
      await this.prisma.notification.create({
        data: {
          userId: booking.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed',
          message: `Your booking at ${updated.branch.name} has been confirmed.`,
          data: { bookingId: booking.id, branchId: booking.branchId },
        },
      });
    }

    return this.serializeBooking(updated);
  }

  async getBookingById(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        branch: { select: { id: true, name: true, city: true, address: true } },
        service: { select: { id: true, type: true, name: true } },
        payment: true,
        addOns: true,
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
        addOns: true,
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
          data: { bookingId: booking.id, branchId: booking.branchId },
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

    if (!service || !service.isActive || !service.isPublic) {
      throw new NotFoundException('Service not found or inactive');
    }

    const capacity = service.capacity ?? 0;

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

  async searchAvailable(query: {
    branchId?: string;
    capacity?: number;
    unitType?: string;
    startDate: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    dates?: string; // comma-separated dates for multiple date mode
  }) {
    const { branchId, capacity, unitType, startDate, startTime, endTime, dates } = query;

    // Build list of dates to check
    const datesToCheck: string[] = [];
    if (dates) {
      datesToCheck.push(...dates.split(',').map(d => d.trim()).filter(Boolean));
    } else {
      datesToCheck.push(startDate);
    }

    const where: any = { isActive: true, isPublic: true, branch: { status: 'ACTIVE' } };
    if (branchId) where.branchId = branchId;
    if (unitType) where.type = unitType;

    const services = await this.prisma.service.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true } },
        pricing: { where: { isActive: true, isPublic: true }, select: { interval: true, pricingMode: true, price: true, currency: true } },
        setupConfigs: { select: { setupType: true, minPeople: true, maxPeople: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Filter by capacity across setup configs or min/max capacity
    const filteredServices = capacity
      ? services.filter(s => {
        if (s.setupConfigs.length > 0) {
          return s.setupConfigs.some(c => c.minPeople <= capacity && c.maxPeople >= capacity);
        }
        const min = s.minCapacity ?? 1;
        const max = s.capacity ?? 0;
        return min <= capacity && max >= capacity;
      })
      : services;

    const results: any[] = [];
    for (const service of filteredServices) {
      const effectiveCapacity = service.setupConfigs.length > 0
        ? Math.max(...service.setupConfigs.map(c => c.maxPeople))
        : service.capacity ?? 0;

      // Check availability across ALL selected dates
      let worstRemaining = effectiveCapacity;
      for (const dateStr of datesToCheck) {
        const dayStart = new Date(`${dateStr}T${startTime}:00`);
        const dayEnd = new Date(`${dateStr}T${endTime}:00`);

        const bookingCount = await this.prisma.booking.count({
          where: {
            serviceId: service.id,
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING', 'PENDING_APPROVAL'] },
            startTime: { lt: dayEnd },
            endTime: { gt: dayStart },
          },
        });

        const remaining = effectiveCapacity - bookingCount;
        if (remaining < worstRemaining) {
          worstRemaining = remaining;
        }
      }

      const effectiveMinCapacity = service.setupConfigs.length > 0
        ? Math.min(...service.setupConfigs.map(c => c.minPeople))
        : service.minCapacity ?? 1;

      results.push({
        id: service.id,
        name: service.name,
        unitNumber: service.unitNumber,
        type: service.type,
        capacity: effectiveCapacity,
        minCapacity: effectiveMinCapacity,
        floor: service.floor,
        description: service.description,
        features: service.features,
        netSize: service.netSize ? service.netSize.toNumber() : null,
        branchName: service.branch.name,
        branchId: service.branch.id,
        available: worstRemaining > 0,
        remainingSpots: Math.max(0, worstRemaining),
        pricing: service.pricing.map(p => ({
          interval: p.interval,
          pricingMode: p.pricingMode,
          price: p.price.toNumber(),
          currency: p.currency,
        })),
        setupConfigs: SETUP_ELIGIBLE_TYPES.includes(service.type)
          ? service.setupConfigs.map(c => ({
              setupType: c.setupType,
              minPeople: c.minPeople,
              maxPeople: c.maxPeople,
            }))
          : [],
      });
    }

    return results;
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
      requestedSetup: booking.requestedSetup ?? null,
      pricingInterval: booking.pricingInterval ?? null,
      pricingMode: booking.pricingMode ?? null,
      unitPrice: booking.unitPrice ? booking.unitPrice.toNumber() : null,
      subtotal: booking.subtotal ? booking.subtotal.toNumber() : null,
      discountType: booking.discountType ?? 'NONE',
      discountValue: booking.discountValue ? booking.discountValue.toNumber() : null,
      discountAmount: booking.discountAmount ? booking.discountAmount.toNumber() : null,
      taxRate: booking.taxRate ? booking.taxRate.toNumber() : null,
      taxAmount: booking.taxAmount ? booking.taxAmount.toNumber() : null,
      bookingGroupId: booking.bookingGroupId ?? null,
      addOns: booking.addOns?.map((a: any) => ({
        id: a.id,
        vendorAddOnId: a.vendorAddOnId,
        name: a.name,
        unitPrice: a.unitPrice.toNumber(),
        quantity: a.quantity,
        totalPrice: a.totalPrice.toNumber(),
        serviceTime: a.serviceTime?.toISOString() ?? null,
        comments: a.comments,
      })) ?? [],
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
