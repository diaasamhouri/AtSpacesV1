import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = () => ({
  vendorProfile: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
  branch: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  approvalRequest: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
  },
  systemSettings: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  adminAuditLog: {
    create: jest.fn(),
  },
  service: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  paymentLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  serviceSetupConfig: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
});

describe('AdminService', () => {
  let service: AdminService;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeEach(async () => {
    prisma = mockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== listVendors ====================

  describe('listVendors', () => {
    it('should return paginated vendors', async () => {
      const mockVendors = [
        {
          id: 'v1',
          companyName: 'Vendor One',
          description: 'A vendor',
          phone: '123',
          website: 'https://vendor.com',
          images: [],
          rejectionReason: null,
          status: 'APPROVED',
          createdAt: new Date('2026-01-01'),
          user: { name: 'Owner', email: 'owner@test.com', phone: '123' },
          _count: { branches: 2 },
        },
      ];

      prisma.vendorProfile.findMany.mockResolvedValue(mockVendors);
      prisma.vendorProfile.count.mockResolvedValue(1);

      const result = await service.listVendors({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'v1',
        companyName: 'Vendor One',
        description: 'A vendor',
        phone: '123',
        website: 'https://vendor.com',
        images: [],
        rejectionReason: null,
        status: 'APPROVED',
        createdAt: new Date('2026-01-01'),
        owner: { name: 'Owner', email: 'owner@test.com', phone: '123' },
        branchesCount: 2,
      });
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.vendorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should apply search filtering', async () => {
      prisma.vendorProfile.findMany.mockResolvedValue([]);
      prisma.vendorProfile.count.mockResolvedValue(0);

      await service.listVendors({ search: 'test query' });

      expect(prisma.vendorProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { companyName: { contains: 'test query', mode: 'insensitive' } },
              { user: { name: { contains: 'test query', mode: 'insensitive' } } },
              { user: { email: { contains: 'test query', mode: 'insensitive' } } },
            ],
          },
        }),
      );
      expect(prisma.vendorProfile.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { companyName: { contains: 'test query', mode: 'insensitive' } },
              { user: { name: { contains: 'test query', mode: 'insensitive' } } },
              { user: { email: { contains: 'test query', mode: 'insensitive' } } },
            ],
          },
        }),
      );
    });
  });

  // ==================== getVendorById ====================

  describe('getVendorById', () => {
    it('should return vendor with expanded fields including relations', async () => {
      const mockVendor = {
        id: 'v1',
        companyName: 'Test Vendor',
        description: 'A vendor',
        phone: '123',
        website: 'https://vendor.com',
        images: [],
        logo: 'logo.png',
        socialLinks: { twitter: 'https://twitter.com/test' },
        companyLegalName: 'Test Legal LLC',
        companyShortName: 'TL',
        companyTradeName: 'Test Trade',
        companyNationalId: 'NID123',
        companyRegistrationNumber: 'REG456',
        companyRegistrationDate: new Date('2025-01-01'),
        companySalesTaxNumber: 'TAX789',
        registeredInCountry: 'Jordan',
        hasTaxExemption: false,
        companyDescription: 'Full description',
        status: 'APPROVED',
        isVerified: true,
        verificationRequestedAt: null,
        verifiedAt: new Date('2026-02-01'),
        verificationNote: 'Verified by admin',
        commissionRate: 10,
        rejectionReason: null,
        createdAt: new Date('2026-01-01'),
        user: { name: 'Owner', email: 'owner@test.com', phone: '123' },
        branches: [
          {
            id: 'b1', name: 'Branch 1', city: 'AMMAN', address: 'Addr', status: 'ACTIVE',
            _count: { services: 3, bookings: 5 },
          },
        ],
        authorizedSignatories: [{ id: 's1', fullName: 'Signer' }],
        companyContacts: [{ id: 'cc1', contactPersonName: 'Contact' }],
        departmentContacts: [{ id: 'dc1', department: 'FINANCE' }],
        bankingInfo: [{ id: 'bi1', bankName: 'Arab Bank' }],
      };

      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendor);

      const result = await service.getVendorById('v1');

      expect(result.companyLegalName).toBe('Test Legal LLC');
      expect(result.authorizedSignatories).toHaveLength(1);
      expect(result.companyContacts).toHaveLength(1);
      expect(result.departmentContacts).toHaveLength(1);
      expect(result.bankingInfo).toHaveLength(1);
      expect(result.verifiedAt).toBeDefined();
      expect(result.logo).toBe('logo.png');
      expect(prisma.vendorProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            authorizedSignatories: true,
            companyContacts: true,
            departmentContacts: true,
            bankingInfo: true,
          }),
        }),
      );
    });

    it('should throw NotFoundException for non-existent vendor', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);
      await expect(service.getVendorById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== updateVendorStatus ====================

  describe('updateVendorStatus', () => {
    it('should update status to APPROVED and clear rejection reason', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'v1', status: 'PENDING_APPROVAL' });
      prisma.vendorProfile.update.mockResolvedValue({
        id: 'v1',
        status: 'APPROVED',
        rejectionReason: null,
        user: { name: 'Owner', email: 'owner@test.com' },
      });

      const result = await service.updateVendorStatus('v1', 'APPROVED' as any);

      expect(result.status).toBe('APPROVED');
      expect(result.rejectionReason).toBeNull();
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
        },
        include: { user: { select: { name: true, email: true } } },
      });
    });

    it('should update status to REJECTED and set rejection reason', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'v1', status: 'PENDING_APPROVAL' });
      prisma.vendorProfile.update.mockResolvedValue({
        id: 'v1',
        status: 'REJECTED',
        rejectionReason: 'Missing documents',
        user: { name: 'Owner', email: 'owner@test.com' },
      });

      const result = await service.updateVendorStatus('v1', 'REJECTED' as any, 'Missing documents');

      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Missing documents');
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Missing documents',
        },
        include: { user: { select: { name: true, email: true } } },
      });
    });

    it('should throw NotFoundException for non-existent vendor', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(service.updateVendorStatus('nonexistent', 'APPROVED' as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== verifyVendor ====================

  describe('verifyVendor', () => {
    it('should set isVerified to true with verifiedAt date', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'v1' });
      const now = new Date();
      prisma.vendorProfile.update.mockResolvedValue({
        id: 'v1',
        isVerified: true,
        verifiedAt: now,
        verificationNote: 'Verified by admin',
        user: { id: 'u1', name: 'Owner', email: 'owner@test.com' },
      });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.verifyVendor('v1', true, 'Verified by admin');

      expect(result.isVerified).toBe(true);
      expect(result.verifiedAt).toBeDefined();
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: {
          isVerified: true,
          verifiedAt: expect.any(Date),
          verificationNote: 'Verified by admin',
          verificationRequestedAt: null,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });

    it('should set isVerified to false and clear verifiedAt', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'v1' });
      prisma.vendorProfile.update.mockResolvedValue({
        id: 'v1',
        isVerified: false,
        verifiedAt: null,
        verificationNote: null,
        user: { id: 'u1', name: 'Owner', email: 'owner@test.com' },
      });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.verifyVendor('v1', false);

      expect(result.isVerified).toBe(false);
      expect(result.verifiedAt).toBeNull();
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: {
          isVerified: false,
          verifiedAt: null,
          verificationNote: null,
          verificationRequestedAt: null,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });

    it('should throw NotFoundException for non-existent vendor', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(service.verifyVendor('nonexistent', true)).rejects.toThrow(NotFoundException);
    });

    it('should create a notification for the vendor when verified', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'v1' });
      prisma.vendorProfile.update.mockResolvedValue({
        id: 'v1',
        isVerified: true,
        verifiedAt: new Date(),
        user: { id: 'u1', name: 'Owner', email: 'owner@test.com' },
      });
      prisma.notification.create.mockResolvedValue({});

      await service.verifyVendor('v1', true);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: 'GENERAL',
          title: expect.stringContaining('Verified'),
          message: expect.stringContaining('verified'),
          data: { vendorProfileId: 'v1' },
        },
      });
    });

    it('should create a notification for the vendor when verification removed', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'v1' });
      prisma.vendorProfile.update.mockResolvedValue({
        id: 'v1',
        isVerified: false,
        verifiedAt: null,
        user: { id: 'u1', name: 'Owner', email: 'owner@test.com' },
      });
      prisma.notification.create.mockResolvedValue({});

      await service.verifyVendor('v1', false);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: 'GENERAL',
          title: 'Verification Removed',
          message: expect.stringContaining('removed'),
          data: { vendorProfileId: 'v1' },
        },
      });
    });
  });

  // ==================== processApproval ====================

  describe('processApproval', () => {
    it('should approve request and update vendor profile status when type is VENDOR_REGISTRATION', async () => {
      const mockRequest = {
        id: 'ar1',
        type: 'VENDOR_REGISTRATION',
        vendorProfileId: 'vp1',
        status: 'PENDING',
      };

      prisma.approvalRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.approvalRequest.update.mockResolvedValue({
        ...mockRequest,
        status: 'APPROVED',
        reason: null,
        reviewedBy: 'admin1',
        reviewedAt: expect.any(Date),
      });
      prisma.vendorProfile.update.mockResolvedValue({
        id: 'vp1',
        companyName: 'Test Vendor',
        status: 'APPROVED',
        rejectionReason: null,
        user: { id: 'u1', name: 'Vendor Owner' },
      });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.processApproval('ar1', 'APPROVED', undefined, 'admin1');

      expect(result.status).toBe('APPROVED');
      expect(prisma.approvalRequest.update).toHaveBeenCalledWith({
        where: { id: 'ar1' },
        data: {
          status: 'APPROVED',
          reason: null,
          reviewedBy: 'admin1',
          reviewedAt: expect.any(Date),
        },
      });
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: 'vp1' },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
        },
        include: { user: { select: { id: true, name: true } } },
      });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          type: 'VENDOR_APPROVED',
          title: 'Vendor Application Approved',
          message: expect.stringContaining('approved'),
          data: { vendorProfileId: 'vp1' },
        },
      });
    });

    it('should reject request with reason', async () => {
      const mockRequest = {
        id: 'ar2',
        type: 'VENDOR_REGISTRATION',
        vendorProfileId: 'vp2',
        status: 'PENDING',
      };

      prisma.approvalRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.approvalRequest.update.mockResolvedValue({
        ...mockRequest,
        status: 'REJECTED',
        reason: 'Incomplete application',
        reviewedBy: 'admin1',
        reviewedAt: new Date(),
      });
      prisma.vendorProfile.update.mockResolvedValue({
        id: 'vp2',
        companyName: 'Rejected Vendor',
        status: 'REJECTED',
        rejectionReason: 'Incomplete application',
        user: { id: 'u2', name: 'Vendor Owner 2' },
      });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.processApproval('ar2', 'REJECTED', 'Incomplete application', 'admin1');

      expect(result.status).toBe('REJECTED');
      expect(prisma.approvalRequest.update).toHaveBeenCalledWith({
        where: { id: 'ar2' },
        data: {
          status: 'REJECTED',
          reason: 'Incomplete application',
          reviewedBy: 'admin1',
          reviewedAt: expect.any(Date),
        },
      });
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: 'vp2' },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Incomplete application',
        },
        include: { user: { select: { id: true, name: true } } },
      });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'u2',
          type: 'VENDOR_REJECTED',
          title: 'Vendor Application Rejected',
          message: expect.stringContaining('rejected'),
          data: { vendorProfileId: 'vp2' },
        },
      });
    });

    it('should throw NotFoundException for non-existent request', async () => {
      prisma.approvalRequest.findUnique.mockResolvedValue(null);

      await expect(service.processApproval('nonexistent', 'APPROVED')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should approve CAPACITY_CHANGE and activate branch', async () => {
      const mockRequest = {
        id: 'ar3',
        type: 'CAPACITY_CHANGE',
        vendorProfileId: null,
        branchId: 'b1',
        status: 'PENDING',
      };

      prisma.approvalRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.approvalRequest.update.mockResolvedValue({
        ...mockRequest,
        status: 'APPROVED',
        reason: null,
        reviewedBy: 'admin1',
        reviewedAt: new Date(),
      });
      prisma.branch.findUnique.mockResolvedValue({
        id: 'b1',
        name: 'Test Branch',
        status: 'UNDER_REVIEW',
        vendor: { userId: 'u1', companyName: 'V' },
      });
      prisma.branch.update.mockResolvedValue({});
      prisma.notification.create.mockResolvedValue({});

      await service.processApproval('ar3', 'APPROVED', undefined, 'admin1');

      expect(prisma.vendorProfile.update).not.toHaveBeenCalled();
      expect(prisma.branch.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { status: 'ACTIVE' },
      });
      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });

  // ==================== processApproval - BRANCH_SUSPENSION ====================

  describe('processApproval - BRANCH_SUSPENSION', () => {
    it('should approve branch suspension and keep branch suspended', async () => {
      const mockRequest = {
        id: 'ar4',
        type: 'BRANCH_SUSPENSION',
        branchId: 'b1',
        vendorProfileId: null,
        status: 'PENDING',
      };

      prisma.approvalRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.approvalRequest.update.mockResolvedValue({
        ...mockRequest,
        status: 'APPROVED',
        reason: null,
        reviewedBy: 'admin1',
        reviewedAt: new Date(),
      });
      prisma.branch.findUnique.mockResolvedValue({
        id: 'b1',
        name: 'Test Branch',
        status: 'SUSPENDED',
        vendor: { userId: 'u1', companyName: 'V' },
      });
      prisma.notification.create.mockResolvedValue({});

      await service.processApproval('ar4', 'APPROVED', undefined, 'admin1');

      expect(prisma.branch.update).not.toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Branch Suspension Confirmed',
        }),
      });
    });

    it('should reject branch suspension and revert to ACTIVE', async () => {
      const mockRequest = {
        id: 'ar4',
        type: 'BRANCH_SUSPENSION',
        branchId: 'b1',
        vendorProfileId: null,
        status: 'PENDING',
      };

      prisma.approvalRequest.findUnique.mockResolvedValue(mockRequest);
      prisma.approvalRequest.update.mockResolvedValue({
        ...mockRequest,
        status: 'REJECTED',
        reason: 'Not allowed',
        reviewedBy: 'admin1',
        reviewedAt: new Date(),
      });
      prisma.branch.findUnique.mockResolvedValue({
        id: 'b1',
        name: 'Test Branch',
        status: 'SUSPENDED',
        vendor: { userId: 'u1', companyName: 'V' },
      });
      prisma.branch.update.mockResolvedValue({});
      prisma.notification.create.mockResolvedValue({});

      await service.processApproval('ar4', 'REJECTED', 'Not allowed', 'admin1');

      expect(prisma.branch.update).toHaveBeenCalledWith({
        where: { id: 'b1' },
        data: { status: 'ACTIVE' },
      });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Branch Suspension Denied',
        }),
      });
    });
  });

  // ==================== listBookings ====================

  describe('listBookings', () => {
    it('should return paginated bookings', async () => {
      const now = new Date();
      const mockBookings = [
        {
          id: 'bk1',
          status: 'CONFIRMED',
          startTime: now,
          endTime: now,
          numberOfPeople: 2,
          totalPrice: { toNumber: () => 50 },
          currency: 'JOD',
          notes: null,
          createdAt: now,
          user: { name: 'Customer', email: 'c@test.com' },
          branch: { name: 'Branch', city: 'AMMAN', vendor: { companyName: 'Vendor' } },
          service: { name: 'Room', type: 'MEETING_ROOM' },
          payment: { status: 'COMPLETED', amount: { toNumber: () => 50 }, method: 'VISA' },
        },
      ];

      prisma.booking.findMany.mockResolvedValue(mockBookings);
      prisma.booking.count.mockResolvedValue(1);

      const result = await service.listBookings({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].totalPrice).toBe(50);
      expect(result.data[0].customer.name).toBe('Customer');
    });
  });

  // ==================== getBookingById ====================

  describe('getBookingById', () => {
    it('should return booking detail', async () => {
      const now = new Date();
      prisma.booking.findUnique.mockResolvedValue({
        id: 'bk1',
        status: 'CONFIRMED',
        startTime: now,
        endTime: now,
        numberOfPeople: 2,
        totalPrice: { toNumber: () => 50 },
        currency: 'JOD',
        notes: null,
        createdAt: now,
        user: { id: 'u1', name: 'Customer', email: 'c@test.com', phone: '123' },
        branch: { id: 'b1', name: 'Branch', city: 'AMMAN', address: 'Addr', vendor: { companyName: 'Vendor' } },
        service: { id: 's1', name: 'Room', type: 'MEETING_ROOM' },
        payment: { id: 'p1', method: 'VISA', status: 'COMPLETED', amount: { toNumber: () => 50 }, currency: 'JOD', paidAt: now, createdAt: now },
      });

      const result = await service.getBookingById('bk1');

      expect(result.id).toBe('bk1');
      expect(result.totalPrice).toBe(50);
      expect(result.customer.name).toBe('Customer');
      expect(result.branch.id).toBe('b1');
      expect(result.payment.id).toBe('p1');
    });

    it('should throw NotFoundException when booking not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.getBookingById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== updateBookingStatus ====================

  describe('updateBookingStatus', () => {
    it('should update booking status with valid transition', async () => {
      prisma.booking.findUnique.mockResolvedValue({ id: 'bk1', status: 'CONFIRMED' });
      prisma.booking.update.mockResolvedValue({ id: 'bk1', status: 'CHECKED_IN' });

      await service.updateBookingStatus('bk1', 'CHECKED_IN' as any);

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'bk1' },
        data: { status: 'CHECKED_IN' },
      });
    });

    it('should throw BadRequestException for invalid transition', async () => {
      prisma.booking.findUnique.mockResolvedValue({ id: 'bk1', status: 'COMPLETED' });

      await expect(service.updateBookingStatus('bk1', 'CONFIRMED' as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when booking not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.updateBookingStatus('bk1', 'CONFIRMED' as any)).rejects.toThrow(NotFoundException);
    });

    it('should auto-refund on CANCELLED when payment is COMPLETED', async () => {
      prisma.booking.findUnique.mockResolvedValue({ id: 'bk1', status: 'CONFIRMED' });
      prisma.payment.findUnique.mockResolvedValue({ id: 'p1', status: 'COMPLETED', bookingId: 'bk1' });
      prisma.payment.update.mockResolvedValue({});
      prisma.booking.update.mockResolvedValue({ id: 'bk1', status: 'CANCELLED' });

      await service.updateBookingStatus('bk1', 'CANCELLED' as any);

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { status: 'REFUNDED' },
      });
    });
  });

  // ==================== refundPayment ====================

  describe('refundPayment', () => {
    it('should refund a completed payment', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'COMPLETED',
        amount: { toNumber: () => 100 },
        currency: 'JOD',
        bookingId: 'bk1',
      });
      prisma.$transaction.mockResolvedValue([{ id: 'p1' }]);
      prisma.booking.findUnique.mockResolvedValue({
        userId: 'u1',
        branchId: 'b1',
        branch: { name: 'Branch' },
      });
      prisma.notification.create.mockResolvedValue({});

      await service.refundPayment('p1', 'admin1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment not found', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(service.refundPayment('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when payment is not COMPLETED', async () => {
      prisma.payment.findUnique.mockResolvedValue({ id: 'p1', status: 'PENDING' });

      await expect(service.refundPayment('p1')).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== listAdminServices ====================

  describe('listAdminServices', () => {
    it('should return paginated services with pricing', async () => {
      const now = new Date();
      prisma.service.findMany.mockResolvedValue([
        {
          id: 's1',
          name: 'Room A',
          unitNumber: '101',
          type: 'MEETING_ROOM',
          description: 'Desc',
          capacity: 10,
          isActive: true,
          isPublic: true,
          floor: '1',
          profileNameEn: null,
          profileNameAr: null,
          weight: null,
          netSize: null,
          shape: null,
          features: [],
          pricePerBooking: { toNumber: () => 100 },
          pricePerPerson: null,
          pricePerHour: { toNumber: () => 15 },
          currency: 'JOD',
          createdAt: now,
          branch: { id: 'b1', name: 'Branch', vendor: { companyName: 'Vendor' } },
          setupConfigs: [],
        },
      ]);
      prisma.service.count.mockResolvedValue(1);

      const result = await service.listAdminServices({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].pricePerBooking).toBe(100);
      expect(result.data[0].pricePerPerson).toBeNull();
      expect(result.data[0].pricePerHour).toBe(15);
    });
  });

  // ==================== getAdminServiceById ====================

  describe('getAdminServiceById', () => {
    it('should return service detail', async () => {
      const now = new Date();
      prisma.service.findUnique.mockResolvedValue({
        id: 's1',
        name: 'Room A',
        unitNumber: '101',
        type: 'MEETING_ROOM',
        description: 'Desc',
        capacity: 10,
        isActive: true,
        isPublic: true,
        floor: '1',
        profileNameEn: null,
        profileNameAr: null,
        weight: null,
        netSize: null,
        shape: null,
        features: [],
        pricePerBooking: { toNumber: () => 100 },
        pricePerPerson: null,
        pricePerHour: { toNumber: () => 15 },
        currency: 'JOD',
        createdAt: now,
        branch: { id: 'b1', name: 'Branch', vendor: { companyName: 'Vendor' } },
        setupConfigs: [],
      });

      const result = await service.getAdminServiceById('s1');

      expect(result.id).toBe('s1');
      expect(result.name).toBe('Room A');
      expect(result.pricePerBooking).toBe(100);
      expect(result.branch.vendor).toBe('Vendor');
    });

    it('should throw NotFoundException when service not found', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.getAdminServiceById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== createAdminService ====================

  describe('createAdminService', () => {
    it('should create a service', async () => {
      const now = new Date();
      prisma.branch.findUnique.mockResolvedValue({ id: 'b1' });
      prisma.service.create.mockResolvedValue({ id: 's1' });
      prisma.service.findUnique.mockResolvedValue({
        id: 's1',
        name: 'New Room',
        unitNumber: null,
        type: 'MEETING_ROOM',
        description: null,
        capacity: null,
        isActive: true,
        isPublic: true,
        floor: null,
        profileNameEn: null,
        profileNameAr: null,
        weight: null,
        netSize: null,
        shape: null,
        features: [],
        pricePerBooking: { toNumber: () => 100 },
        pricePerPerson: null,
        pricePerHour: null,
        currency: 'JOD',
        createdAt: now,
        branch: { id: 'b1', name: 'Branch', vendor: { companyName: 'Vendor' } },
        setupConfigs: [],
      });

      const result = await service.createAdminService({
        branchId: 'b1',
        type: 'MEETING_ROOM',
        name: 'New Room',
        pricePerBooking: 100,
      } as any);

      expect(prisma.service.create).toHaveBeenCalled();
      expect(result.id).toBe('s1');
    });

    it('should throw NotFoundException when branch not found', async () => {
      prisma.branch.findUnique.mockResolvedValue(null);

      await expect(
        service.createAdminService({ branchId: 'b1', type: 'MEETING_ROOM', name: 'Room' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== updateAdminService ====================

  describe('updateAdminService', () => {
    it('should update service fields', async () => {
      const now = new Date();
      // First call: existence check
      prisma.service.findUnique.mockResolvedValueOnce({ id: 's1' });
      prisma.service.update.mockResolvedValue({});
      // Second call: getAdminServiceById
      prisma.service.findUnique.mockResolvedValueOnce({
        id: 's1',
        name: 'Updated Room',
        unitNumber: null,
        type: 'MEETING_ROOM',
        description: null,
        capacity: null,
        isActive: true,
        isPublic: true,
        floor: null,
        profileNameEn: null,
        profileNameAr: null,
        weight: null,
        netSize: null,
        shape: null,
        features: [],
        pricePerBooking: null,
        pricePerPerson: null,
        pricePerHour: null,
        currency: 'JOD',
        createdAt: now,
        branch: { id: 'b1', name: 'Branch', vendor: { companyName: 'Vendor' } },
        setupConfigs: [],
      });

      const result = await service.updateAdminService('s1', { name: 'Updated Room' });

      expect(prisma.service.update).toHaveBeenCalledWith({
        where: { id: 's1' },
        data: expect.objectContaining({ name: 'Updated Room' }),
      });
      expect(result.name).toBe('Updated Room');
    });

    it('should throw NotFoundException when service not found', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.updateAdminService('nonexistent', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== deleteAdminService ====================

  describe('deleteAdminService', () => {
    it('should delete a service', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 's1' });
      prisma.service.delete.mockResolvedValue({ id: 's1' });

      await service.deleteAdminService('s1');

      expect(prisma.service.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    });

    it('should throw NotFoundException when service not found', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.deleteAdminService('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
