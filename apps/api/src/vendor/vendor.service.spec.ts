import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('VendorService', () => {
  let service: VendorService;
  let prisma: PrismaService;

  const mockUserId = 'user-1';
  const mockVendorProfileId = 'vp-1';

  const approvedVendorProfile = {
    id: mockVendorProfileId,
    userId: mockUserId,
    companyName: 'Test Co',
    description: 'A test company',
    logo: null,
    phone: '+962790000000',
    website: 'https://test.co',
    images: [],
    socialLinks: {},
    status: 'APPROVED',
    isVerified: false,
    verifiedAt: null,
    commissionRate: null,
    taxRate: new Decimal(16),
    taxEnabled: true,
    createdAt: new Date('2026-01-01'),
  };

  const pendingVendorProfile = {
    ...approvedVendorProfile,
    id: 'vp-pending',
    userId: 'user-pending',
    status: 'PENDING_APPROVAL',
  };

  const mockRedisService = {
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockPrismaService = {
    vendorProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    branch: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    service: {
      count: jest.fn(),
    },
    booking: {
      count: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    promoCode: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    systemSettings: {
      findUnique: jest.fn(),
    },
    paymentLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<VendorService>(VendorService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== getVendorStats ====================

  describe('getVendorStats', () => {
    it('should return correct counts when vendor is approved', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.branch.count.mockResolvedValue(3);
      mockPrismaService.service.count.mockResolvedValue(7);
      mockPrismaService.booking.count.mockResolvedValue(12);
      mockPrismaService.payment.aggregate.mockResolvedValue({
        _sum: { amount: new Decimal(1500.50) },
      });
      mockPrismaService.systemSettings.findUnique.mockResolvedValue({ value: '10' });

      const result = await service.getVendorStats(mockUserId);

      expect(result).toEqual({
        companyName: 'Test Co',
        status: 'APPROVED',
        stats: {
          branches: 3,
          services: 7,
          activeBookings: 12,
          totalRevenue: 1500.50,
          grossRevenue: 1500.50,
          commissionRate: 10,
          commissionAmount: 150.05,
          netRevenue: 1350.45,
        },
      });

      expect(mockPrismaService.vendorProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(mockPrismaService.branch.count).toHaveBeenCalledWith({
        where: { vendorProfileId: mockVendorProfileId, status: { not: 'SUSPENDED' } },
      });
      expect(mockPrismaService.service.count).toHaveBeenCalledWith({
        where: { branch: { vendorProfileId: mockVendorProfileId }, isActive: true },
      });
      expect(mockPrismaService.booking.count).toHaveBeenCalledWith({
        where: { branch: { vendorProfileId: mockVendorProfileId }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
      });
      expect(mockPrismaService.payment.aggregate).toHaveBeenCalledWith({
        _sum: { amount: true },
        where: { status: 'COMPLETED', booking: { branch: { vendorProfileId: mockVendorProfileId } } },
      });
    });

    it('should return totalRevenue as 0 when no payments exist', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.branch.count.mockResolvedValue(0);
      mockPrismaService.service.count.mockResolvedValue(0);
      mockPrismaService.booking.count.mockResolvedValue(0);
      mockPrismaService.payment.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });
      mockPrismaService.systemSettings.findUnique.mockResolvedValue({ value: '10' });

      const result = await service.getVendorStats(mockUserId);

      expect(result.stats.totalRevenue).toBe(0);
      expect(result.stats.grossRevenue).toBe(0);
      expect(result.stats.commissionAmount).toBe(0);
      expect(result.stats.netRevenue).toBe(0);
    });

    it('should throw ForbiddenException when vendor is not approved', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(pendingVendorProfile);

      await expect(service.getVendorStats('user-pending')).rejects.toThrow(ForbiddenException);
      await expect(service.getVendorStats('user-pending')).rejects.toThrow(
        'Vendor account is not approved yet.',
      );
    });

    it('should throw NotFoundException when vendor profile does not exist', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(service.getVendorStats('non-existent-user')).rejects.toThrow(NotFoundException);
      await expect(service.getVendorStats('non-existent-user')).rejects.toThrow(
        'Vendor profile not found',
      );
    });
  });

  // ==================== updateProfile ====================

  describe('updateProfile', () => {
    it('should update vendor profile fields correctly', async () => {
      const updateData = {
        companyName: 'Updated Co',
        description: 'Updated description',
        phone: '+962791111111',
      };
      const updatedProfile = {
        id: mockVendorProfileId,
        companyName: 'Updated Co',
        description: 'Updated description',
        phone: '+962791111111',
        website: 'https://test.co',
        images: [],
        socialLinks: {},
        status: 'APPROVED',
        isVerified: false,
      };

      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.vendorProfile.update.mockResolvedValue(updatedProfile);

      const result = await service.updateProfile(mockUserId, updateData);

      expect(result).toEqual(updatedProfile);
      expect(mockPrismaService.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: mockVendorProfileId },
        data: {
          companyName: 'Updated Co',
          description: 'Updated description',
          phone: '+962791111111',
        },
        select: {
          id: true,
          companyName: true,
          description: true,
          phone: true,
          website: true,
          images: true,
          socialLinks: true,
          status: true,
          isVerified: true,
          companyLegalName: true,
          companyShortName: true,
          companyTradeName: true,
          companyNationalId: true,
          companyRegistrationNumber: true,
          companyRegistrationDate: true,
          companySalesTaxNumber: true,
          registeredInCountry: true,
          hasTaxExemption: true,
          companyDescription: true,
        },
      });
    });

    it('should only include provided fields in the update data', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.vendorProfile.update.mockResolvedValue(approvedVendorProfile);

      await service.updateProfile(mockUserId, { website: 'https://new.co' });

      expect(mockPrismaService.vendorProfile.update).toHaveBeenCalledWith({
        where: { id: mockVendorProfileId },
        data: {
          website: 'https://new.co',
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when vendor profile does not exist', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('non-existent-user', { companyName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateProfile('non-existent-user', { companyName: 'New Name' }),
      ).rejects.toThrow('Vendor profile not found');
    });
  });

  // ==================== replyToReview ====================

  describe('replyToReview', () => {
    const mockReviewId = 'review-1';
    const mockReviewUserId = 'customer-1';

    const mockReview = {
      id: mockReviewId,
      userId: mockReviewUserId,
      branchId: 'branch-1',
      rating: 4,
      comment: 'Great space!',
      vendorReply: null,
      branch: {
        id: 'branch-1',
        name: 'Downtown Branch',
        vendorProfileId: mockVendorProfileId,
      },
    };

    it('should successfully reply to own branch review', async () => {
      const replyText = 'Thank you for your review!';
      const updatedReview = {
        ...mockReview,
        vendorReply: replyText,
        replyCreatedAt: expect.any(Date),
      };

      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.review.findUnique.mockResolvedValue(mockReview);
      mockPrismaService.review.update.mockResolvedValue(updatedReview);
      mockPrismaService.notification.create.mockResolvedValue({});

      const result = await service.replyToReview(mockUserId, mockReviewId, replyText);

      expect(result).toEqual(updatedReview);
      expect(mockPrismaService.review.findUnique).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        include: { branch: true },
      });
      expect(mockPrismaService.review.update).toHaveBeenCalledWith({
        where: { id: mockReviewId },
        data: {
          vendorReply: replyText,
          replyCreatedAt: expect.any(Date),
        },
      });
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: mockReviewUserId,
          type: 'GENERAL',
          title: 'Host Replied to your Review',
          message: 'Test Co replied to your review at Downtown Branch.',
          data: { reviewId: mockReviewId, branchId: 'branch-1' },
        },
      });
    });

    it('should throw ForbiddenException when review belongs to another vendor\'s branch', async () => {
      const otherVendorReview = {
        ...mockReview,
        branch: {
          ...mockReview.branch,
          vendorProfileId: 'other-vendor-profile-id',
        },
      };

      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.review.findUnique.mockResolvedValue(otherVendorReview);

      await expect(
        service.replyToReview(mockUserId, mockReviewId, 'Thanks!'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.replyToReview(mockUserId, mockReviewId, 'Thanks!'),
      ).rejects.toThrow('Review does not belong to your branches');
    });

    it('should throw NotFoundException when review does not exist', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(
        service.replyToReview(mockUserId, 'non-existent-review', 'Thanks!'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.replyToReview(mockUserId, 'non-existent-review', 'Thanks!'),
      ).rejects.toThrow('Review not found');
    });
  });

  // ==================== Promo Code CRUD ====================

  describe('createPromoCode', () => {
    const createPromoData = {
      code: 'SUMMER20',
      discountPercent: 20,
      maxUses: 100,
      validUntil: '2026-12-31',
      isActive: true,
    };

    it('should create a promo code successfully', async () => {
      const createdPromo = {
        id: 'promo-1',
        code: 'SUMMER20',
        discountPercent: 20,
        maxUses: 100,
        currentUses: 0,
        validUntil: new Date('2026-12-31'),
        isActive: true,
        vendorProfileId: mockVendorProfileId,
        branchId: null,
        createdAt: new Date(),
      };

      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);
      mockPrismaService.promoCode.create.mockResolvedValue(createdPromo);

      const result = await service.createPromoCode(mockUserId, createPromoData);

      expect(result).toEqual(createdPromo);
      expect(mockPrismaService.promoCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'SUMMER20' },
      });
      expect(mockPrismaService.promoCode.create).toHaveBeenCalledWith({
        data: {
          code: 'SUMMER20',
          discountPercent: 20,
          maxUses: 100,
          validUntil: new Date('2026-12-31'),
          isActive: true,
          vendorProfileId: mockVendorProfileId,
          branchId: null,
        },
      });
    });

    it('should uppercase the promo code', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);
      mockPrismaService.promoCode.create.mockResolvedValue({ id: 'promo-1' });

      await service.createPromoCode(mockUserId, {
        code: 'summer20',
        discountPercent: 20,
      });

      expect(mockPrismaService.promoCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'SUMMER20' },
      });
      expect(mockPrismaService.promoCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ code: 'SUMMER20' }),
      });
    });

    it('should throw ForbiddenException on duplicate code', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.promoCode.findUnique.mockResolvedValue({
        id: 'existing-promo',
        code: 'SUMMER20',
      });

      await expect(
        service.createPromoCode(mockUserId, createPromoData),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createPromoCode(mockUserId, createPromoData),
      ).rejects.toThrow('Promo code already exists globally. Please choose another one.');
    });

    it('should validate branchId belongs to the vendor when provided', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.branch.findFirst.mockResolvedValue(null);

      await expect(
        service.createPromoCode(mockUserId, {
          ...createPromoData,
          branchId: 'other-vendor-branch',
        }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createPromoCode(mockUserId, {
          ...createPromoData,
          branchId: 'other-vendor-branch',
        }),
      ).rejects.toThrow('Branch not found or belongs to another vendor');
    });

    it('should set defaults for optional fields', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.promoCode.findUnique.mockResolvedValue(null);
      mockPrismaService.promoCode.create.mockResolvedValue({ id: 'promo-1' });

      await service.createPromoCode(mockUserId, {
        code: 'BASIC',
        discountPercent: 10,
      });

      expect(mockPrismaService.promoCode.create).toHaveBeenCalledWith({
        data: {
          code: 'BASIC',
          discountPercent: 10,
          maxUses: 0,
          validUntil: null,
          isActive: true,
          vendorProfileId: mockVendorProfileId,
          branchId: null,
        },
      });
    });
  });

  describe('updatePromoCode', () => {
    const mockPromoId = 'promo-1';
    const existingPromo = {
      id: mockPromoId,
      code: 'SUMMER20',
      discountPercent: 20,
      maxUses: 100,
      vendorProfileId: mockVendorProfileId,
    };

    it('should update promo code fields correctly', async () => {
      const updateData = { discountPercent: 25, isActive: false };
      const updatedPromo = {
        ...existingPromo,
        discountPercent: 25,
        isActive: false,
        branch: null,
      };

      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.promoCode.findFirst.mockResolvedValue(existingPromo);
      mockPrismaService.promoCode.update.mockResolvedValue(updatedPromo);

      const result = await service.updatePromoCode(mockUserId, mockPromoId, updateData);

      expect(result).toEqual(updatedPromo);
      expect(mockPrismaService.promoCode.findFirst).toHaveBeenCalledWith({
        where: { id: mockPromoId, vendorProfileId: mockVendorProfileId },
      });
      expect(mockPrismaService.promoCode.update).toHaveBeenCalledWith({
        where: { id: mockPromoId },
        data: {
          discountPercent: 25,
          maxUses: undefined,
          validUntil: undefined,
          isActive: false,
          branchId: undefined,
        },
        include: { branch: { select: { id: true, name: true } } },
      });
    });

    it('should throw NotFoundException for non-existent promo code', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.promoCode.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePromoCode(mockUserId, 'non-existent', { discountPercent: 10 }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updatePromoCode(mockUserId, 'non-existent', { discountPercent: 10 }),
      ).rejects.toThrow('Promo code not found');
    });

    it('should throw ForbiddenException when updating branchId to a branch not owned by vendor', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.promoCode.findFirst.mockResolvedValue(existingPromo);
      mockPrismaService.branch.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePromoCode(mockUserId, mockPromoId, { branchId: 'other-branch' }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updatePromoCode(mockUserId, mockPromoId, { branchId: 'other-branch' }),
      ).rejects.toThrow('Branch not found');
    });
  });

  describe('deletePromoCode', () => {
    const mockPromoId = 'promo-1';
    const existingPromo = {
      id: mockPromoId,
      code: 'SUMMER20',
      vendorProfileId: mockVendorProfileId,
    };

    it('should delete promo code successfully', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.promoCode.findFirst.mockResolvedValue(existingPromo);
      mockPrismaService.promoCode.delete.mockResolvedValue(existingPromo);

      const result = await service.deletePromoCode(mockUserId, mockPromoId);

      expect(result).toEqual({ message: 'Promo code deleted' });
      expect(mockPrismaService.promoCode.findFirst).toHaveBeenCalledWith({
        where: { id: mockPromoId, vendorProfileId: mockVendorProfileId },
      });
      expect(mockPrismaService.promoCode.delete).toHaveBeenCalledWith({
        where: { id: mockPromoId },
      });
    });

    it('should throw NotFoundException for non-existent promo code', async () => {
      mockPrismaService.vendorProfile.findUnique.mockResolvedValue(approvedVendorProfile);
      mockPrismaService.promoCode.findFirst.mockResolvedValue(null);

      await expect(
        service.deletePromoCode(mockUserId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deletePromoCode(mockUserId, 'non-existent'),
      ).rejects.toThrow('Promo code not found');
    });
  });
});
