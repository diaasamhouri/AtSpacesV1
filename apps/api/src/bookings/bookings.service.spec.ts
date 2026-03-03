import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateBookingDto, PricingIntervalParam, PaymentMethodParam } from './dto';

// Helper to build a Decimal-like object that matches Prisma's Decimal
const decimal = (value: number) => ({ toNumber: () => value });

// ---------------------------------------------------------------------------
// Reusable fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'user-uuid-1';
const SERVICE_ID = 'service-uuid-1';
const BRANCH_ID = 'branch-uuid-1';
const VENDOR_PROFILE_ID = 'vendor-uuid-1';
const BOOKING_ID = 'booking-uuid-1';
const PAYMENT_ID = 'payment-uuid-1';

/** A Wednesday (day index 3) at 10:00 UTC */
const START_TIME = new Date('2026-03-04T10:00:00.000Z');
/** Same Wednesday at 12:00 UTC */
const END_TIME = new Date('2026-03-04T12:00:00.000Z');

const baseBranch = {
  id: BRANCH_ID,
  status: 'ACTIVE',
  vendorProfileId: VENDOR_PROFILE_ID,
  autoAcceptBookings: false,
  operatingHours: {
    sunday: null,
    monday: { open: '08:00', close: '18:00' },
    tuesday: { open: '08:00', close: '18:00' },
    wednesday: { open: '08:00', close: '18:00' },
    thursday: { open: '08:00', close: '18:00' },
    friday: { open: '08:00', close: '14:00' },
    saturday: { open: '09:00', close: '15:00' },
  },
};

const baseService = {
  id: SERVICE_ID,
  isActive: true,
  capacity: 10,
  branch: baseBranch,
  pricing: [
    { id: 'pricing-1', interval: 'HOURLY', price: decimal(25), isActive: true },
  ],
};

const baseDto: CreateBookingDto = {
  serviceId: SERVICE_ID,
  startTime: START_TIME.toISOString(),
  endTime: END_TIME.toISOString(),
  numberOfPeople: 1,
  pricingInterval: PricingIntervalParam.HOURLY,
  paymentMethod: PaymentMethodParam.VISA,
};

const baseBookingRecord = {
  id: BOOKING_ID,
  userId: USER_ID,
  branchId: BRANCH_ID,
  serviceId: SERVICE_ID,
  status: 'PENDING_APPROVAL',
  startTime: START_TIME,
  endTime: END_TIME,
  numberOfPeople: 1,
  totalPrice: decimal(25),
  currency: 'JOD',
  notes: null,
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
  branch: { id: BRANCH_ID, name: 'Downtown Hub', city: 'AMMAN', address: '123 Main St' },
  service: { id: SERVICE_ID, type: 'HOT_DESK', name: 'Hot Desk' },
  payment: {
    id: PAYMENT_ID,
    method: 'VISA',
    status: 'COMPLETED',
    amount: decimal(25),
    currency: 'JOD',
    paidAt: new Date('2026-03-01T00:00:00.000Z'),
  },
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: {
    service: { findUnique: jest.Mock };
    booking: { count: jest.Mock; create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    promoCode: { findFirst: jest.Mock; update: jest.Mock };
    vendorProfile: { findUnique: jest.Mock };
    payment: { findUnique: jest.Mock; update: jest.Mock };
    branch: { findUnique: jest.Mock };
    notification: { create: jest.Mock; createMany: jest.Mock };
  };
  let redis: { acquireLock: jest.Mock; releaseLock: jest.Mock };

  beforeEach(async () => {
    prisma = {
      service: { findUnique: jest.fn() },
      booking: {
        count: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      promoCode: { findFirst: jest.fn(), update: jest.fn() },
      vendorProfile: { findUnique: jest.fn() },
      payment: { findUnique: jest.fn(), update: jest.fn() },
      branch: { findUnique: jest.fn().mockResolvedValue({ name: 'Downtown Hub', vendor: { userId: 'vendor-user-1' } }) },
      notification: { create: jest.fn().mockResolvedValue({}), createMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };

    redis = {
      acquireLock: jest.fn().mockResolvedValue(true),
      releaseLock: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  // =========================================================================
  // createBooking
  // =========================================================================
  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      prisma.service.findUnique.mockResolvedValue(baseService);
      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.create.mockResolvedValue(baseBookingRecord);

      const result = await service.createBooking(USER_ID, baseDto);

      expect(result).toEqual({
        id: BOOKING_ID,
        status: 'PENDING_APPROVAL',
        startTime: START_TIME.toISOString(),
        endTime: END_TIME.toISOString(),
        numberOfPeople: 1,
        totalPrice: 25,
        currency: 'JOD',
        notes: null,
        createdAt: expect.any(String),
        branch: baseBookingRecord.branch,
        service: baseBookingRecord.service,
        payment: {
          id: PAYMENT_ID,
          method: 'VISA',
          status: 'COMPLETED',
          amount: 25,
          currency: 'JOD',
          paidAt: expect.any(String),
        },
      });

      // Verify Redis lock was acquired and released
      expect(redis.acquireLock).toHaveBeenCalledWith(
        `booking:${SERVICE_ID}:${START_TIME.toISOString()}`,
        30,
      );
      expect(redis.releaseLock).toHaveBeenCalled();

      // Verify booking was created with correct data
      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: USER_ID,
            branchId: BRANCH_ID,
            serviceId: SERVICE_ID,
            status: 'PENDING_APPROVAL',
          }),
        }),
      );
    });

    it('should throw BadRequestException when end time is before start time', async () => {
      const dto: CreateBookingDto = {
        ...baseDto,
        startTime: END_TIME.toISOString(),
        endTime: START_TIME.toISOString(),
      };

      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        'End time must be after start time',
      );
    });

    it('should throw BadRequestException when end time equals start time', async () => {
      const dto: CreateBookingDto = {
        ...baseDto,
        startTime: START_TIME.toISOString(),
        endTime: START_TIME.toISOString(),
      };

      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when overlapping bookings reach capacity', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        capacity: 2,
      });
      prisma.booking.count.mockResolvedValue(2); // already at capacity

      await expect(service.createBooking(USER_ID, baseDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createBooking(USER_ID, baseDto)).rejects.toThrow(
        'No availability for the selected time slot',
      );

      // Lock should still be released even on conflict
      expect(redis.releaseLock).toHaveBeenCalled();
    });

    it('should throw ConflictException when Redis lock cannot be acquired', async () => {
      redis.acquireLock.mockResolvedValue(false);
      prisma.service.findUnique.mockResolvedValue(baseService);

      await expect(service.createBooking(USER_ID, baseDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createBooking(USER_ID, baseDto)).rejects.toThrow(
        'Another booking is being processed for this slot. Please try again.',
      );
    });

    it('should throw NotFoundException when service is not found', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.createBooking(USER_ID, baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when service is inactive', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        isActive: false,
      });

      await expect(service.createBooking(USER_ID, baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when branch is not active', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        branch: { ...baseBranch, status: 'SUSPENDED' },
      });

      await expect(service.createBooking(USER_ID, baseDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBooking(USER_ID, baseDto)).rejects.toThrow(
        'Branch is not currently active',
      );
    });

    it('should throw BadRequestException when pricing interval is not available', async () => {
      const dto: CreateBookingDto = {
        ...baseDto,
        pricingInterval: PricingIntervalParam.MONTHLY,
      };
      prisma.service.findUnique.mockResolvedValue(baseService); // only HOURLY pricing

      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        'No pricing available for interval: MONTHLY',
      );
    });

    it('should throw BadRequestException when numberOfPeople exceeds capacity', async () => {
      const dto: CreateBookingDto = {
        ...baseDto,
        numberOfPeople: 20,
      };
      prisma.service.findUnique.mockResolvedValue(baseService); // capacity is 10

      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        'Requested 20 people but service capacity is 10',
      );
    });

    // --- Operating hours enforcement ---

    it('should throw BadRequestException when booking is outside operating hours', async () => {
      // Wednesday operating hours are 08:00–18:00
      // Book from 06:00–08:00 (too early)
      const earlyStart = new Date('2026-03-04T06:00:00.000Z');
      const earlyEnd = new Date('2026-03-04T08:00:00.000Z');

      const dto: CreateBookingDto = {
        ...baseDto,
        startTime: earlyStart.toISOString(),
        endTime: earlyEnd.toISOString(),
      };

      prisma.service.findUnique.mockResolvedValue(baseService);

      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        /outside operating hours/,
      );
    });

    it('should throw BadRequestException when booking end time exceeds closing hours', async () => {
      // Wednesday closes at 18:00, booking ends at 20:00
      const lateStart = new Date('2026-03-04T16:00:00.000Z');
      const lateEnd = new Date('2026-03-04T20:00:00.000Z');

      const dto: CreateBookingDto = {
        ...baseDto,
        startTime: lateStart.toISOString(),
        endTime: lateEnd.toISOString(),
      };

      prisma.service.findUnique.mockResolvedValue(baseService);

      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        /outside operating hours/,
      );
    });

    it('should throw BadRequestException when branch is closed on the requested day', async () => {
      // Sunday is closed (null in operatingHours)
      const sundayStart = new Date('2026-03-01T10:00:00.000Z'); // 2026-03-01 is a Sunday
      const sundayEnd = new Date('2026-03-01T12:00:00.000Z');

      const dto: CreateBookingDto = {
        ...baseDto,
        startTime: sundayStart.toISOString(),
        endTime: sundayEnd.toISOString(),
      };

      prisma.service.findUnique.mockResolvedValue(baseService);

      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        'Branch is closed on this day',
      );
    });

    it('should skip operating hours validation when operatingHours is null', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        branch: { ...baseBranch, operatingHours: null },
      });
      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.create.mockResolvedValue(baseBookingRecord);

      const result = await service.createBooking(USER_ID, baseDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(BOOKING_ID);
    });

    // --- Promo code validation ---

    it('should apply a valid promo code and reduce totalPrice', async () => {
      const dto: CreateBookingDto = {
        ...baseDto,
        promoCode: 'SAVE20',
      };

      prisma.service.findUnique.mockResolvedValue(baseService);
      prisma.booking.count.mockResolvedValue(0);
      prisma.promoCode.findFirst.mockResolvedValue({
        id: 'promo-1',
        code: 'SAVE20',
        isActive: true,
        discountPercent: 20,
        validUntil: new Date('2027-01-01'),
        maxUses: 100,
        currentUses: 5,
      });

      // The discounted price: 25 - (25 * 20 / 100) = 20
      const discountedBookingRecord = {
        ...baseBookingRecord,
        totalPrice: decimal(20),
        payment: {
          ...baseBookingRecord.payment,
          amount: decimal(20),
        },
      };
      prisma.booking.create.mockResolvedValue(discountedBookingRecord);

      const result = await service.createBooking(USER_ID, dto);

      expect(result.totalPrice).toBe(20);
      expect(prisma.promoCode.update).toHaveBeenCalledWith({
        where: { id: 'promo-1' },
        data: { currentUses: { increment: 1 } },
      });
    });

    it('should throw BadRequestException when promo code is expired', async () => {
      const dto: CreateBookingDto = {
        ...baseDto,
        promoCode: 'EXPIRED',
      };

      prisma.service.findUnique.mockResolvedValue(baseService);
      prisma.booking.count.mockResolvedValue(0);
      prisma.promoCode.findFirst.mockResolvedValue({
        id: 'promo-2',
        code: 'EXPIRED',
        isActive: true,
        discountPercent: 10,
        validUntil: new Date('2020-01-01'), // already expired
        maxUses: 100,
        currentUses: 5,
      });

      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        'Promo code has expired',
      );
    });

    it('should throw BadRequestException when promo code max uses reached', async () => {
      const dto: CreateBookingDto = {
        ...baseDto,
        promoCode: 'MAXED',
      };

      prisma.service.findUnique.mockResolvedValue(baseService);
      prisma.booking.count.mockResolvedValue(0);
      prisma.promoCode.findFirst.mockResolvedValue({
        id: 'promo-3',
        code: 'MAXED',
        isActive: true,
        discountPercent: 10,
        validUntil: new Date('2027-01-01'),
        maxUses: 50,
        currentUses: 50, // maxed out
      });

      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        'Promo code usage limit reached',
      );
    });

    it('should throw BadRequestException when promo code is not found', async () => {
      const dto: CreateBookingDto = {
        ...baseDto,
        promoCode: 'INVALID',
      };

      prisma.service.findUnique.mockResolvedValue(baseService);
      prisma.booking.count.mockResolvedValue(0);
      prisma.promoCode.findFirst.mockResolvedValue(null);

      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBooking(USER_ID, dto)).rejects.toThrow(
        'Invalid or inactive promo code',
      );
    });

    it('should set booking status to CONFIRMED when autoAcceptBookings is true', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        branch: { ...baseBranch, autoAcceptBookings: true },
      });
      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.create.mockResolvedValue({
        ...baseBookingRecord,
        status: 'CONFIRMED',
      });

      const result = await service.createBooking(USER_ID, baseDto);

      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CONFIRMED',
          }),
        }),
      );
      expect(result.status).toBe('CONFIRMED');
    });

    it('should set payment status to PENDING for cash payments', async () => {
      const dto: CreateBookingDto = {
        ...baseDto,
        paymentMethod: PaymentMethodParam.CASH,
      };

      prisma.service.findUnique.mockResolvedValue(baseService);
      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.create.mockResolvedValue({
        ...baseBookingRecord,
        payment: {
          ...baseBookingRecord.payment,
          method: 'CASH',
          status: 'PENDING',
          paidAt: null,
        },
      });

      await service.createBooking(USER_ID, dto);

      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            payment: {
              create: expect.objectContaining({
                method: 'CASH',
                status: 'PENDING',
                paidAt: null,
              }),
            },
          }),
        }),
      );
    });

    it('should release Redis lock even when an error occurs', async () => {
      prisma.service.findUnique.mockResolvedValue(baseService);
      prisma.booking.count.mockResolvedValue(0);
      prisma.booking.create.mockRejectedValue(new Error('DB error'));

      await expect(service.createBooking(USER_ID, baseDto)).rejects.toThrow(
        'DB error',
      );

      expect(redis.releaseLock).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // getUserBookings
  // =========================================================================
  describe('getUserBookings', () => {
    it('should return serialized bookings for the user', async () => {
      prisma.booking.findMany.mockResolvedValue([baseBookingRecord]);

      const result = await service.getUserBookings(USER_ID);

      expect(result).toEqual({
        data: [
          {
            id: BOOKING_ID,
            status: 'PENDING_APPROVAL',
            startTime: START_TIME.toISOString(),
            endTime: END_TIME.toISOString(),
            numberOfPeople: 1,
            totalPrice: 25,
            currency: 'JOD',
            notes: null,
            createdAt: expect.any(String),
            branch: baseBookingRecord.branch,
            service: baseBookingRecord.service,
            payment: {
              id: PAYMENT_ID,
              method: 'VISA',
              status: 'COMPLETED',
              amount: 25,
              currency: 'JOD',
              paidAt: expect.any(String),
            },
          },
        ],
      });

      expect(prisma.booking.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { id: true, name: true, city: true, address: true } },
          service: { select: { id: true, type: true, name: true } },
          payment: true,
        },
      });
    });

    it('should return empty data array when user has no bookings', async () => {
      prisma.booking.findMany.mockResolvedValue([]);

      const result = await service.getUserBookings(USER_ID);

      expect(result).toEqual({ data: [] });
    });

    it('should handle booking with null payment', async () => {
      prisma.booking.findMany.mockResolvedValue([
        { ...baseBookingRecord, payment: null },
      ]);

      const result = await service.getUserBookings(USER_ID);

      expect(result.data[0]!.payment).toBeNull();
    });
  });

  // =========================================================================
  // cancelBooking
  // =========================================================================
  describe('cancelBooking', () => {
    it('should cancel a PENDING booking for the owner', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...baseBookingRecord,
        status: 'PENDING',
        payment: { ...baseBookingRecord.payment, status: 'PENDING' },
      });

      const cancelledBooking = {
        ...baseBookingRecord,
        status: 'CANCELLED',
        payment: { ...baseBookingRecord.payment, status: 'PENDING' },
      };
      prisma.booking.update.mockResolvedValue(cancelledBooking);

      const result = await service.cancelBooking(BOOKING_ID, USER_ID);

      expect(result.status).toBe('CANCELLED');
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BOOKING_ID },
          data: expect.objectContaining({ status: 'CANCELLED' }),
        }),
      );
    });

    it('should cancel a CONFIRMED booking for the owner', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...baseBookingRecord,
        status: 'CONFIRMED',
        payment: { ...baseBookingRecord.payment, status: 'COMPLETED' },
      });

      const cancelledBooking = {
        ...baseBookingRecord,
        status: 'CANCELLED',
        payment: { ...baseBookingRecord.payment, status: 'REFUNDED' },
      };
      prisma.booking.update.mockResolvedValue(cancelledBooking);

      const result = await service.cancelBooking(BOOKING_ID, USER_ID);

      expect(result.status).toBe('CANCELLED');
      // Should trigger refund when payment was COMPLETED
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED',
            payment: { update: { status: 'REFUNDED' } },
          }),
        }),
      );
    });

    it('should throw NotFoundException when booking is not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelBooking(BOOKING_ID, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is not the owner', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...baseBookingRecord,
        status: 'PENDING',
        userId: 'other-user-id',
      });

      await expect(
        service.cancelBooking(BOOKING_ID, USER_ID),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.cancelBooking(BOOKING_ID, USER_ID),
      ).rejects.toThrow('Booking not found');
    });

    it('should throw BadRequestException when booking is already COMPLETED', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...baseBookingRecord,
        status: 'COMPLETED',
        payment: baseBookingRecord.payment,
      });

      await expect(
        service.cancelBooking(BOOKING_ID, USER_ID),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancelBooking(BOOKING_ID, USER_ID),
      ).rejects.toThrow('Cannot cancel a booking with status: COMPLETED');
    });

    it('should throw BadRequestException when booking is already CANCELLED', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...baseBookingRecord,
        status: 'CANCELLED',
        payment: baseBookingRecord.payment,
      });

      await expect(
        service.cancelBooking(BOOKING_ID, USER_ID),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancelBooking(BOOKING_ID, USER_ID),
      ).rejects.toThrow('Cannot cancel a booking with status: CANCELLED');
    });

    it('should not trigger refund when payment status is not COMPLETED', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...baseBookingRecord,
        status: 'PENDING',
        payment: { ...baseBookingRecord.payment, status: 'PENDING' },
      });

      prisma.booking.update.mockResolvedValue({
        ...baseBookingRecord,
        status: 'CANCELLED',
        payment: { ...baseBookingRecord.payment, status: 'PENDING' },
      });

      await service.cancelBooking(BOOKING_ID, USER_ID);

      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELLED',
            payment: undefined,
          }),
        }),
      );
    });
  });

  // =========================================================================
  // checkAvailability
  // =========================================================================
  describe('checkAvailability', () => {
    const startIso = START_TIME.toISOString();
    const endIso = END_TIME.toISOString();

    it('should return available with correct remainingSpots', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        branch: { status: 'ACTIVE', operatingHours: baseBranch.operatingHours },
      });
      prisma.booking.count.mockResolvedValue(3);

      const result = await service.checkAvailability(SERVICE_ID, startIso, endIso);

      expect(result.available).toBe(true);
      expect(result.currentBookings).toBe(3);
      expect(result.capacity).toBe(10);
      expect(result.remainingSpots).toBe(7);
    });

    it('should return unavailable when branch is closed on the requested day', async () => {
      // 2026-03-01 is a Sunday — sunday is null in baseBranch.operatingHours
      const sundayStart = '2026-03-01T10:00:00.000Z';
      const sundayEnd = '2026-03-01T12:00:00.000Z';

      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        branch: { status: 'ACTIVE', operatingHours: baseBranch.operatingHours },
      });
      // findSuggestedSlots will call booking.count for each candidate slot
      prisma.booking.count.mockResolvedValue(0);

      const result = await service.checkAvailability(SERVICE_ID, sundayStart, sundayEnd);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Branch is closed on this day');
      expect(result.operatingHoursForDay).toBeNull();
    });

    it('should return unavailable when outside operating hours with hours info', async () => {
      // Wednesday 06:00–08:00 is before opening at 08:00
      const earlyStart = '2026-03-04T06:00:00.000Z';
      const earlyEnd = '2026-03-04T08:00:00.000Z';

      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        branch: { status: 'ACTIVE', operatingHours: baseBranch.operatingHours },
      });
      prisma.booking.count.mockResolvedValue(0);

      const result = await service.checkAvailability(SERVICE_ID, earlyStart, earlyEnd);

      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/outside operating hours/);
      expect(result.operatingHoursForDay).toEqual({ open: '08:00', close: '18:00' });
    });

    it('should return unavailable when not enough capacity for numberOfPeople', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        capacity: 5,
        branch: { status: 'ACTIVE', operatingHours: baseBranch.operatingHours },
      });
      prisma.booking.count.mockResolvedValue(3); // 2 remaining, but requesting 4

      const result = await service.checkAvailability(SERVICE_ID, startIso, endIso, 4);

      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/Not enough capacity for 4 people/);
      expect(result.remainingSpots).toBe(2);
    });

    it('should return unavailable when branch is not active', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        branch: { status: 'SUSPENDED', operatingHours: baseBranch.operatingHours },
      });

      const result = await service.checkAvailability(SERVICE_ID, startIso, endIso);

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Branch is not currently active');
    });

    it('should throw NotFoundException when service not found', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.checkAvailability(SERVICE_ID, startIso, endIso)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return suggestedSlots when unavailable due to capacity', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        capacity: 2,
        branch: { status: 'ACTIVE', operatingHours: baseBranch.operatingHours },
      });
      // First call: overlapping count for the requested slot (full)
      // Subsequent calls: for suggested slot candidates (available)
      prisma.booking.count
        .mockResolvedValueOnce(2) // requested slot is full
        .mockResolvedValue(0);   // suggested slots are available

      const result = await service.checkAvailability(SERVICE_ID, startIso, endIso);

      expect(result.available).toBe(false);
      expect(result.suggestedSlots).toBeDefined();
      expect(result.suggestedSlots!.length).toBeGreaterThan(0);
      expect(result.suggestedSlots![0]).toHaveProperty('startTime');
      expect(result.suggestedSlots![0]).toHaveProperty('endTime');
      expect(result.suggestedSlots![0]).toHaveProperty('label');
    });

    it('should return operatingHoursForDay for the requested day', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...baseService,
        branch: { status: 'ACTIVE', operatingHours: baseBranch.operatingHours },
      });
      prisma.booking.count.mockResolvedValue(0);

      const result = await service.checkAvailability(SERVICE_ID, startIso, endIso);

      // Wednesday hours
      expect(result.operatingHoursForDay).toEqual({ open: '08:00', close: '18:00' });
    });
  });
});
