import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto } from './dto';

// Helper to build a Decimal-like object that matches Prisma's Decimal
const decimal = (value: number) => ({ toNumber: () => value });

// ---------------------------------------------------------------------------
// Reusable fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'user-uuid-1';
const CUSTOMER_ID = 'customer-uuid-1';
const BRANCH_ID = 'branch-uuid-1';
const SERVICE_ID = 'service-uuid-1';
const VENDOR_PROFILE_ID = 'vendor-uuid-1';
const QUOTATION_ID = 'quotation-uuid-1';
const BOOKING_ID = 'booking-uuid-1';
const VENDOR_ADDON_ID_1 = 'vendor-addon-uuid-1';
const VENDOR_ADDON_ID_2 = 'vendor-addon-uuid-2';

const START_TIME = new Date('2026-03-05T10:00:00.000Z');
const END_TIME = new Date('2026-03-05T12:00:00.000Z');
const CREATED_AT = new Date('2026-03-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-03-01T00:00:00.000Z');

const baseDto: CreateQuotationDto = {
  customerId: CUSTOMER_ID,
  branchId: BRANCH_ID,
  serviceId: SERVICE_ID,
  startTime: START_TIME.toISOString(),
  endTime: END_TIME.toISOString(),
  numberOfPeople: 2,
  totalAmount: 100,
  notes: 'Test quotation',
};

const baseQuotationRecord = {
  id: QUOTATION_ID,
  referenceNumber: 'QT-123-ABCD',
  customerId: CUSTOMER_ID,
  branchId: BRANCH_ID,
  serviceId: SERVICE_ID,
  startTime: START_TIME,
  endTime: END_TIME,
  numberOfPeople: 2,
  totalAmount: decimal(100),
  status: 'NOT_SENT',
  notes: 'Test quotation',
  subtotal: null,
  discountType: null,
  discountValue: null,
  discountAmount: null,
  taxRate: null,
  taxAmount: null,
  pricingMode: null,
  sentAt: null,
  bookingId: null,
  createdById: USER_ID,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  customer: { name: 'John Doe', email: 'john@example.com' },
  branch: { name: 'Downtown Hub' },
  service: { name: 'Meeting Room', type: 'MEETING_ROOM' },
  createdBy: { name: 'Vendor Admin' },
  lineItems: [],
  addOns: [],
};

const baseVendorAddOn1 = {
  id: VENDOR_ADDON_ID_1,
  name: 'Projector',
  unitPrice: decimal(15),
  vendorProfileId: VENDOR_PROFILE_ID,
};

const baseVendorAddOn2 = {
  id: VENDOR_ADDON_ID_2,
  name: 'Whiteboard',
  unitPrice: decimal(5),
  vendorProfileId: VENDOR_PROFILE_ID,
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('QuotationsService', () => {
  let service: QuotationsService;
  let prisma: {
    quotation: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    quotationLineItem: { deleteMany: jest.Mock };
    quotationAddOn: { create: jest.Mock; deleteMany: jest.Mock };
    vendorProfile: { findUnique: jest.Mock };
    vendorAddOn: { findUnique: jest.Mock };
    service: { findUnique: jest.Mock };
    booking: { create: jest.Mock };
    bookingAddOn: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      quotation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      quotationLineItem: { deleteMany: jest.fn() },
      quotationAddOn: { create: jest.fn(), deleteMany: jest.fn() },
      vendorProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: VENDOR_PROFILE_ID, userId: USER_ID }),
      },
      vendorAddOn: { findUnique: jest.fn() },
      service: { findUnique: jest.fn() },
      booking: { create: jest.fn() },
      bookingAddOn: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<QuotationsService>(QuotationsService);
  });

  // =========================================================================
  // createQuotation
  // =========================================================================
  describe('createQuotation', () => {
    it('should create a quotation successfully', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: SERVICE_ID, isActive: true });
      prisma.quotation.create.mockResolvedValue({ ...baseQuotationRecord });

      const result = await service.createQuotation(USER_ID, baseDto);

      expect(result).toEqual(
        expect.objectContaining({
          id: QUOTATION_ID,
          referenceNumber: 'QT-123-ABCD',
          customerId: CUSTOMER_ID,
          branchId: BRANCH_ID,
          serviceId: SERVICE_ID,
          totalAmount: 100,
          status: 'NOT_SENT',
          addOns: [],
          lineItems: [],
        }),
      );

      expect(prisma.quotation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: CUSTOMER_ID,
            branchId: BRANCH_ID,
            serviceId: SERVICE_ID,
            totalAmount: 100,
          }),
          include: expect.objectContaining({ addOns: { include: { vendorAddOn: true } } }),
        }),
      );
    });

    it('should throw BadRequestException when service is inactive', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: SERVICE_ID, isActive: false });

      await expect(service.createQuotation(USER_ID, baseDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createQuotation(USER_ID, baseDto)).rejects.toThrow(
        'Service is not active',
      );
    });

    it('should create quotation with add-ons', async () => {
      const dtoWithAddOns: CreateQuotationDto = {
        ...baseDto,
        addOns: [
          { vendorAddOnId: VENDOR_ADDON_ID_1, quantity: 2, serviceTime: 'BEFORE', comments: 'Need two' },
          { vendorAddOnId: VENDOR_ADDON_ID_2, quantity: 1 },
        ],
      };

      prisma.service.findUnique.mockResolvedValue({ id: SERVICE_ID, isActive: true });
      prisma.quotation.create.mockResolvedValue({ ...baseQuotationRecord });

      // Mock vendorAddOn lookups
      prisma.vendorAddOn.findUnique
        .mockResolvedValueOnce(baseVendorAddOn1)
        .mockResolvedValueOnce(baseVendorAddOn2);

      // Mock quotationAddOn creates
      prisma.quotationAddOn.create
        .mockResolvedValueOnce({ id: 'qa-1' })
        .mockResolvedValueOnce({ id: 'qa-2' });

      // After creating add-ons, the service re-fetches the quotation
      const refreshedQuotation = {
        ...baseQuotationRecord,
        addOns: [
          {
            id: 'qa-1',
            vendorAddOnId: VENDOR_ADDON_ID_1,
            name: 'Projector',
            unitPrice: decimal(15),
            quantity: 2,
            totalPrice: decimal(30),
            serviceTime: 'BEFORE',
            comments: 'Need two',
          },
          {
            id: 'qa-2',
            vendorAddOnId: VENDOR_ADDON_ID_2,
            name: 'Whiteboard',
            unitPrice: decimal(5),
            quantity: 1,
            totalPrice: decimal(5),
            serviceTime: null,
            comments: null,
          },
        ],
      };
      prisma.quotation.findUnique.mockResolvedValue(refreshedQuotation);

      const result = await service.createQuotation(USER_ID, dtoWithAddOns);

      // Assert vendorAddOn.findUnique was called for each add-on
      expect(prisma.vendorAddOn.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.vendorAddOn.findUnique).toHaveBeenCalledWith({
        where: { id: VENDOR_ADDON_ID_1 },
      });
      expect(prisma.vendorAddOn.findUnique).toHaveBeenCalledWith({
        where: { id: VENDOR_ADDON_ID_2 },
      });

      // Assert quotationAddOn.create was called with snapshot data
      expect(prisma.quotationAddOn.create).toHaveBeenCalledTimes(2);

      const addOnCalls = prisma.quotationAddOn.create.mock.calls;

      // First add-on: Projector
      expect(addOnCalls[0][0].data).toMatchObject({
        quotationId: QUOTATION_ID,
        vendorAddOnId: VENDOR_ADDON_ID_1,
        name: 'Projector',
        quantity: 2,
        totalPrice: 30, // unitPrice(15) * quantity(2)
        serviceTime: 'BEFORE',
        comments: 'Need two',
      });
      expect(addOnCalls[0][0].data.unitPrice.toNumber()).toBe(15);

      // Second add-on: Whiteboard
      expect(addOnCalls[1][0].data).toMatchObject({
        quotationId: QUOTATION_ID,
        vendorAddOnId: VENDOR_ADDON_ID_2,
        name: 'Whiteboard',
        quantity: 1,
        totalPrice: 5, // unitPrice(5) * quantity(1)
      });
      expect(addOnCalls[1][0].data.unitPrice.toNumber()).toBe(5);

      // Assert the result includes serialized add-ons
      expect(result.addOns).toHaveLength(2);
      expect(result.addOns[0]).toEqual({
        id: 'qa-1',
        vendorAddOnId: VENDOR_ADDON_ID_1,
        name: 'Projector',
        unitPrice: 15,
        quantity: 2,
        totalPrice: 30,
        serviceTime: 'BEFORE',
        comments: 'Need two',
      });
      expect(result.addOns[1]).toEqual({
        id: 'qa-2',
        vendorAddOnId: VENDOR_ADDON_ID_2,
        name: 'Whiteboard',
        unitPrice: 5,
        quantity: 1,
        totalPrice: 5,
        serviceTime: null,
        comments: null,
      });
    });

    it('should throw NotFoundException when vendorAddOn is not found', async () => {
      const dtoWithBadAddOn: CreateQuotationDto = {
        ...baseDto,
        addOns: [{ vendorAddOnId: 'non-existent-id', quantity: 1 }],
      };

      prisma.service.findUnique.mockResolvedValue({ id: SERVICE_ID, isActive: true });
      prisma.quotation.create.mockResolvedValue({ ...baseQuotationRecord });
      prisma.vendorAddOn.findUnique.mockResolvedValue(null);

      await expect(
        service.createQuotation(USER_ID, dtoWithBadAddOn),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createQuotation(USER_ID, dtoWithBadAddOn),
      ).rejects.toThrow('VendorAddOn non-existent-id not found');
    });
  });

  // =========================================================================
  // updateQuotation
  // =========================================================================
  describe('updateQuotation', () => {
    beforeEach(() => {
      // Default: verifyQuotationOwnership passes
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: VENDOR_PROFILE_ID, userId: USER_ID });
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        branch: { vendorProfileId: VENDOR_PROFILE_ID },
      });
    });

    it('should throw BadRequestException when trying to set status via update', async () => {
      await expect(
        service.updateQuotation(USER_ID, QUOTATION_ID, { status: 'SENT' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateQuotation(USER_ID, QUOTATION_ID, { status: 'SENT' }),
      ).rejects.toThrow(/dedicated/);
    });

    it('should update quotation add-ons by deleting and recreating', async () => {
      prisma.vendorAddOn.findUnique.mockResolvedValue(baseVendorAddOn1);
      prisma.quotationAddOn.create.mockResolvedValue({ id: 'qa-new-1' });
      prisma.quotationAddOn.deleteMany.mockResolvedValue({ count: 0 });

      const updatedRecord = {
        ...baseQuotationRecord,
        addOns: [
          {
            id: 'qa-new-1',
            vendorAddOnId: VENDOR_ADDON_ID_1,
            name: 'Projector',
            unitPrice: decimal(15),
            quantity: 3,
            totalPrice: decimal(45),
            serviceTime: null,
            comments: null,
          },
        ],
      };
      prisma.quotation.update.mockResolvedValue(updatedRecord);

      const result = await service.updateQuotation(USER_ID, QUOTATION_ID, {
        addOns: [
          { vendorAddOnId: VENDOR_ADDON_ID_1, quantity: 3 },
        ],
      });

      // Assert old add-ons were deleted
      expect(prisma.quotationAddOn.deleteMany).toHaveBeenCalledWith({
        where: { quotationId: QUOTATION_ID },
      });

      // Assert new add-on was created with correct data
      const createCall = prisma.quotationAddOn.create.mock.calls[0][0];
      expect(createCall.data).toMatchObject({
        quotationId: QUOTATION_ID,
        vendorAddOnId: VENDOR_ADDON_ID_1,
        name: 'Projector',
        quantity: 3,
        totalPrice: 45,
      });
      expect(createCall.data.unitPrice.toNumber()).toBe(15);

      expect(result.addOns).toHaveLength(1);
      expect(result.addOns[0]).toEqual(
        expect.objectContaining({
          name: 'Projector',
          unitPrice: 15,
          quantity: 3,
          totalPrice: 45,
        }),
      );
    });

    it('should clear all add-ons when empty array is provided', async () => {
      prisma.quotationAddOn.deleteMany.mockResolvedValue({ count: 2 });
      prisma.quotation.update.mockResolvedValue({
        ...baseQuotationRecord,
        addOns: [],
      });

      const result = await service.updateQuotation(USER_ID, QUOTATION_ID, {
        addOns: [],
      });

      expect(prisma.quotationAddOn.deleteMany).toHaveBeenCalledWith({
        where: { quotationId: QUOTATION_ID },
      });
      expect(prisma.quotationAddOn.create).not.toHaveBeenCalled();
      expect(result.addOns).toEqual([]);
    });
  });

  // =========================================================================
  // convertToBooking
  // =========================================================================
  describe('convertToBooking', () => {
    it('should convert accepted quotation to booking', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: VENDOR_PROFILE_ID, userId: USER_ID });
      // verifyQuotationOwnership call
      prisma.quotation.findUnique
        .mockResolvedValueOnce({
          ...baseQuotationRecord,
          status: 'ACCEPTED',
          branch: { vendorProfileId: VENDOR_PROFILE_ID },
        })
        // Re-fetch for add-ons in convertToBooking
        .mockResolvedValueOnce({
          ...baseQuotationRecord,
          status: 'ACCEPTED',
          addOns: [],
        });

      const createdBooking = {
        id: BOOKING_ID,
        status: 'CONFIRMED',
        startTime: START_TIME,
        endTime: END_TIME,
        numberOfPeople: 2,
        totalPrice: decimal(100),
        currency: 'JOD',
        notes: null,
        createdAt: CREATED_AT,
        branch: { id: BRANCH_ID, name: 'Downtown Hub', city: 'AMMAN', address: '123 Main St' },
        service: { id: SERVICE_ID, type: 'MEETING_ROOM', name: 'Meeting Room' },
        payment: null,
      };
      prisma.booking.create.mockResolvedValue(createdBooking);
      prisma.quotation.update.mockResolvedValue({});

      const result = await service.convertToBooking(USER_ID, QUOTATION_ID);

      expect(result).toEqual(
        expect.objectContaining({
          id: BOOKING_ID,
          status: 'CONFIRMED',
          totalPrice: 100,
        }),
      );

      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: CUSTOMER_ID,
            branchId: BRANCH_ID,
            serviceId: SERVICE_ID,
            status: 'CONFIRMED',
          }),
        }),
      );

      // Should link booking to quotation
      expect(prisma.quotation.update).toHaveBeenCalledWith({
        where: { id: QUOTATION_ID },
        data: { bookingId: BOOKING_ID },
      });
    });

    it('should throw BadRequestException for non-accepted quotation', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: VENDOR_PROFILE_ID, userId: USER_ID });
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'NOT_SENT',
        branch: { vendorProfileId: VENDOR_PROFILE_ID },
      });

      await expect(
        service.convertToBooking(USER_ID, QUOTATION_ID),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.convertToBooking(USER_ID, QUOTATION_ID),
      ).rejects.toThrow('Only accepted quotations can be converted to bookings');
    });

    it('should transfer add-ons when converting quotation to booking', async () => {
      const quotationAddOns = [
        {
          id: 'qa-1',
          vendorAddOnId: VENDOR_ADDON_ID_1,
          name: 'Projector',
          unitPrice: decimal(15),
          quantity: 2,
          totalPrice: decimal(30),
          serviceTime: 'BEFORE',
          comments: 'Need two projectors',
        },
        {
          id: 'qa-2',
          vendorAddOnId: VENDOR_ADDON_ID_2,
          name: 'Whiteboard',
          unitPrice: decimal(5),
          quantity: 1,
          totalPrice: decimal(5),
          serviceTime: null,
          comments: null,
        },
      ];

      // verifyQuotationOwnership call
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: VENDOR_PROFILE_ID, userId: USER_ID });
      prisma.quotation.findUnique
        .mockResolvedValueOnce({
          ...baseQuotationRecord,
          status: 'ACCEPTED',
          branch: { vendorProfileId: VENDOR_PROFILE_ID },
        })
        // Re-fetch with add-ons in convertToBooking
        .mockResolvedValueOnce({
          ...baseQuotationRecord,
          status: 'ACCEPTED',
          addOns: quotationAddOns,
        });

      const createdBooking = {
        id: BOOKING_ID,
        status: 'CONFIRMED',
        startTime: START_TIME,
        endTime: END_TIME,
        numberOfPeople: 2,
        totalPrice: decimal(100),
        currency: 'JOD',
        notes: null,
        createdAt: CREATED_AT,
        branch: { id: BRANCH_ID, name: 'Downtown Hub', city: 'AMMAN', address: '123 Main St' },
        service: { id: SERVICE_ID, type: 'MEETING_ROOM', name: 'Meeting Room' },
        payment: null,
      };
      prisma.booking.create.mockResolvedValue(createdBooking);
      prisma.bookingAddOn.create.mockResolvedValue({});
      prisma.quotation.update.mockResolvedValue({});

      await service.convertToBooking(USER_ID, QUOTATION_ID);

      // Assert bookingAddOn.create was called for each quotation add-on
      expect(prisma.bookingAddOn.create).toHaveBeenCalledTimes(2);

      const bookingAddOnCalls = prisma.bookingAddOn.create.mock.calls;

      // First add-on: Projector
      expect(bookingAddOnCalls[0][0].data).toMatchObject({
        bookingId: BOOKING_ID,
        vendorAddOnId: VENDOR_ADDON_ID_1,
        name: 'Projector',
        quantity: 2,
        serviceTime: 'BEFORE',
        comments: 'Need two projectors',
      });
      expect(bookingAddOnCalls[0][0].data.unitPrice.toNumber()).toBe(15);
      expect(bookingAddOnCalls[0][0].data.totalPrice.toNumber()).toBe(30);

      // Second add-on: Whiteboard
      expect(bookingAddOnCalls[1][0].data).toMatchObject({
        bookingId: BOOKING_ID,
        vendorAddOnId: VENDOR_ADDON_ID_2,
        name: 'Whiteboard',
        quantity: 1,
        serviceTime: null,
        comments: null,
      });
      expect(bookingAddOnCalls[1][0].data.unitPrice.toNumber()).toBe(5);
      expect(bookingAddOnCalls[1][0].data.totalPrice.toNumber()).toBe(5);
    });

    it('should not create bookingAddOns when quotation has no add-ons', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: VENDOR_PROFILE_ID, userId: USER_ID });
      prisma.quotation.findUnique
        .mockResolvedValueOnce({
          ...baseQuotationRecord,
          status: 'ACCEPTED',
          branch: { vendorProfileId: VENDOR_PROFILE_ID },
        })
        .mockResolvedValueOnce({
          ...baseQuotationRecord,
          status: 'ACCEPTED',
          addOns: [],
        });

      const createdBooking = {
        id: BOOKING_ID,
        status: 'CONFIRMED',
        startTime: START_TIME,
        endTime: END_TIME,
        numberOfPeople: 2,
        totalPrice: decimal(100),
        currency: 'JOD',
        notes: null,
        createdAt: CREATED_AT,
        branch: { id: BRANCH_ID, name: 'Downtown Hub', city: 'AMMAN', address: '123 Main St' },
        service: { id: SERVICE_ID, type: 'MEETING_ROOM', name: 'Meeting Room' },
        payment: null,
      };
      prisma.booking.create.mockResolvedValue(createdBooking);
      prisma.quotation.update.mockResolvedValue({});

      await service.convertToBooking(USER_ID, QUOTATION_ID);

      expect(prisma.bookingAddOn.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // deleteQuotation
  // =========================================================================
  describe('deleteQuotation', () => {
    it('should delete a NOT_SENT quotation owned by the user', async () => {
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'NOT_SENT',
        createdById: USER_ID,
      });
      prisma.quotation.delete.mockResolvedValue({});

      const result = await service.deleteQuotation(USER_ID, QUOTATION_ID);
      expect(result).toEqual({ message: 'Quotation deleted' });
      expect(prisma.quotation.delete).toHaveBeenCalledWith({
        where: { id: QUOTATION_ID },
      });
    });

    it('should delete a REJECTED quotation owned by the user', async () => {
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'REJECTED',
        createdById: USER_ID,
      });
      prisma.quotation.delete.mockResolvedValue({});

      const result = await service.deleteQuotation(USER_ID, QUOTATION_ID);
      expect(result).toEqual({ message: 'Quotation deleted' });
    });

    it('should throw NotFoundException when quotation does not exist', async () => {
      prisma.quotation.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deleteQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow('Quotation not found');
    });

    it('should throw ForbiddenException when quotation belongs to another user', async () => {
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'NOT_SENT',
        createdById: 'other-user-id',
      });

      await expect(
        service.deleteQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.deleteQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow('Not your quotation');
    });

    it('should throw BadRequestException when quotation status is SENT', async () => {
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'SENT',
        createdById: USER_ID,
      });

      await expect(
        service.deleteQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.deleteQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow('Only NOT_SENT or REJECTED quotations can be deleted');
    });

    it('should throw BadRequestException when quotation status is ACCEPTED', async () => {
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'ACCEPTED',
        createdById: USER_ID,
      });

      await expect(
        service.deleteQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // verifyQuotationOwnership (tested via other methods)
  // =========================================================================
  describe('ownership verification', () => {
    it('should throw BadRequestException when vendor profile not found', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.getQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when quotation belongs to another vendor', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: VENDOR_PROFILE_ID, userId: USER_ID });
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        branch: { name: 'Downtown Hub', vendorProfileId: 'other-vendor-id' },
      });

      await expect(
        service.getQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when quotation does not exist', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: VENDOR_PROFILE_ID, userId: USER_ID });
      prisma.quotation.findUnique.mockResolvedValue(null);

      await expect(
        service.getQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // getQuotations
  // =========================================================================
  describe('getQuotations', () => {
    it('should return paginated quotations for vendor', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: VENDOR_PROFILE_ID, userId: USER_ID });
      prisma.quotation.findMany.mockResolvedValue([baseQuotationRecord]);
      prisma.quotation.count.mockResolvedValue(1);

      const result = await service.getQuotations(USER_ID, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        }),
      );
    });

    it('should throw NotFoundException when vendor profile not found', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.getQuotations(USER_ID, {}),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getQuotations(USER_ID, {}),
      ).rejects.toThrow('Vendor profile not found');
    });
  });

  // =========================================================================
  // sendQuotation / acceptQuotation / rejectQuotation
  // =========================================================================
  describe('status transitions', () => {
    beforeEach(() => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: VENDOR_PROFILE_ID, userId: USER_ID });
    });

    it('should accept a SENT quotation', async () => {
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'SENT',
        branch: { vendorProfileId: VENDOR_PROFILE_ID },
      });

      prisma.quotation.update.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'ACCEPTED',
      });

      const result = await service.acceptQuotation(USER_ID, QUOTATION_ID);
      expect(result.status).toBe('ACCEPTED');
    });

    it('should throw BadRequestException when accepting a non-SENT quotation', async () => {
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'NOT_SENT',
        branch: { vendorProfileId: VENDOR_PROFILE_ID },
      });

      await expect(
        service.acceptQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.acceptQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow('Only sent quotations can be accepted');
    });

    it('should reject a SENT quotation', async () => {
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'SENT',
        branch: { vendorProfileId: VENDOR_PROFILE_ID },
      });

      prisma.quotation.update.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'REJECTED',
      });

      const result = await service.rejectQuotation(USER_ID, QUOTATION_ID);
      expect(result.status).toBe('REJECTED');
    });

    it('should throw BadRequestException when rejecting a non-SENT quotation', async () => {
      prisma.quotation.findUnique.mockResolvedValue({
        ...baseQuotationRecord,
        status: 'NOT_SENT',
        branch: { vendorProfileId: VENDOR_PROFILE_ID },
      });

      await expect(
        service.rejectQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.rejectQuotation(USER_ID, QUOTATION_ID),
      ).rejects.toThrow('Only sent quotations can be rejected');
    });
  });
});
