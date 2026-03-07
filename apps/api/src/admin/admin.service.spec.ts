import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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

    it('should not update vendor profile when type is not VENDOR_REGISTRATION', async () => {
      const mockRequest = {
        id: 'ar3',
        type: 'BRANCH_CREATION',
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

      await service.processApproval('ar3', 'APPROVED', undefined, 'admin1');

      expect(prisma.vendorProfile.update).not.toHaveBeenCalled();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });
});
