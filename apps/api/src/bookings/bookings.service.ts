import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateBookingDto } from './dto';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

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
        branch: { select: { id: true, status: true } },
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
      const totalPrice = pricing.price.toNumber();

      // Determine payment status based on method
      const isCash = dto.paymentMethod === 'CASH';
      const paymentStatus = isCash ? 'PENDING' : 'COMPLETED';
      const bookingStatus = isCash ? 'PENDING' : 'CONFIRMED';

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
          branch: { select: { id: true, name: true, city: true, address: true } },
          service: { select: { id: true, type: true, name: true } },
          payment: true,
        },
      });

      return this.serializeBooking(booking);
    } finally {
      await this.redis.releaseLock(lockKey);
    }
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
