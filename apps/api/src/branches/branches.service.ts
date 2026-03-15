import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListBranchesQueryDto, CreateBranchDto, UpdateBranchDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) { }

  async listBranches(query: ListBranchesQueryDto) {
    const { city, type, search, page = 1, limit = 12, sort } = query;

    const where: Prisma.BranchWhereInput = {
      status: 'ACTIVE',
      vendor: { status: 'APPROVED' },
    };

    if (city) {
      where.city = city;
    }

    if (type) {
      where.services = {
        some: { type, isActive: true },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          vendor: {
            companyName: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (query.capacity) {
      where.services = {
        ...where.services,
        some: {
          ...(where.services?.some || {}),
          isActive: true,
          capacity: { gte: query.capacity },
        },
      };
    }

    const [branches, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          description: true,
          images: true,
          vendor: {
            select: {
              id: true,
              companyName: true,
              logo: true,
              isVerified: true,
            },
          },
          services: {
            where: { isActive: true, isPublic: true },
            select: {
              type: true,
              pricePerBooking: true,
              pricePerPerson: true,
              pricePerHour: true,
            },
          },
        },
      }),
      this.prisma.branch.count({ where }),
    ]);

    let data = branches.map((branch) => {
      const serviceTypes = [...new Set(branch.services.map((s) => s.type))];

      // Find the lowest price across all three pricing columns
      let startingPrice: number | null = null;
      let startingPricingMode: string | null = null;
      for (const s of branch.services) {
        const candidates: { price: number; mode: string }[] = [];
        if (s.pricePerBooking) candidates.push({ price: Number(s.pricePerBooking), mode: 'PER_BOOKING' });
        if (s.pricePerPerson) candidates.push({ price: Number(s.pricePerPerson), mode: 'PER_PERSON' });
        if (s.pricePerHour) candidates.push({ price: Number(s.pricePerHour), mode: 'PER_HOUR' });
        for (const c of candidates) {
          if (startingPrice === null || c.price < startingPrice) {
            startingPrice = c.price;
            startingPricingMode = c.mode;
          }
        }
      }

      return {
        id: branch.id,
        name: branch.name,
        city: branch.city,
        address: branch.address,
        description: branch.description,
        images: branch.images,
        vendor: branch.vendor,
        serviceTypes,
        startingPrice,
        startingPricingMode,
      };
    });

    // Post-query sort for price-based ordering
    if (sort === 'price_low') {
      data.sort((a, b) => (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity));
    } else if (sort === 'price_high') {
      data.sort((a, b) => (b.startingPrice ?? 0) - (a.startingPrice ?? 0));
    }

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBranchById(id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        status: 'ACTIVE',
        vendor: { status: 'APPROVED' },
      },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        description: true,
        phone: true,
        email: true,
        latitude: true,
        longitude: true,
        images: true,
        operatingHours: true,
        amenities: true,
        googleMapsUrl: true,
        vendor: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            isVerified: true,
            socialLinks: true,
          },
        },
        services: {
          where: { isActive: true, isPublic: true },
          orderBy: { type: 'asc' },
          select: {
            id: true,
            type: true,
            name: true,
            unitNumber: true,
            description: true,
            capacity: true,
            minCapacity: true,
            floor: true,
            netSize: true,
            shape: true,
            features: true,
            pricePerBooking: true,
            pricePerPerson: true,
            pricePerHour: true,
            currency: true,
            setupConfigs: {
              select: {
                setupType: true,
                minPeople: true,
                maxPeople: true,
              },
            },
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return {
      ...branch,
      services: branch.services.map((service) => ({
        ...service,
        netSize: service.netSize ? service.netSize.toNumber() : null,
        pricePerBooking: service.pricePerBooking ? Number(service.pricePerBooking) : null,
        pricePerPerson: service.pricePerPerson ? Number(service.pricePerPerson) : null,
        pricePerHour: service.pricePerHour ? Number(service.pricePerHour) : null,
      })),
    };
  }

  async getVendorBranches(userId: string, query: { unitType?: string } = {}) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });
    if (!vendorProfile) throw new ForbiddenException('Vendor profile not found');

    const where: any = { vendorProfileId: vendorProfile.id };
    if (query.unitType) {
      where.services = { some: { type: query.unitType } };
    }

    const branches = await this.prisma.branch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        services: {
          select: {
            id: true,
            type: true,
            name: true,
            unitNumber: true,
            description: true,
            capacity: true,
            minCapacity: true,
            isActive: true,
            isPublic: true,
            floor: true,
            profileNameEn: true,
            profileNameAr: true,
            weight: true,
            netSize: true,
            shape: true,
            features: true,
            setupConfigs: {
              select: { setupType: true, minPeople: true, maxPeople: true },
            },
            pricePerBooking: true,
            pricePerPerson: true,
            pricePerHour: true,
            currency: true,
          }
        }
      }
    });

    return {
      data: branches.map(b => ({
        ...b,
        services: b.services.map(s => ({
          ...s,
          netSize: s.netSize ? s.netSize.toNumber() : null,
          pricePerBooking: s.pricePerBooking ? Number(s.pricePerBooking) : null,
          pricePerPerson: s.pricePerPerson ? Number(s.pricePerPerson) : null,
          pricePerHour: s.pricePerHour ? Number(s.pricePerHour) : null,
        })),
      })),
    };
  }

  async createBranch(userId: string, dto: CreateBranchDto) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });
    if (!vendorProfile || vendorProfile.status !== 'APPROVED') {
      throw new ForbiddenException('Only approved vendors can create branches');
    }

    // Create branch with UNDER_REVIEW status — requires admin approval
    const branch = await this.prisma.branch.create({
      data: {
        ...dto,
        operatingHours: dto.operatingHours ?? undefined,
        vendorProfileId: vendorProfile.id,
        status: 'UNDER_REVIEW',
      },
    });

    // Auto-create an approval request for the admin
    await this.prisma.approvalRequest.create({
      data: {
        branchId: branch.id,
        type: 'CAPACITY_CHANGE',
        description: `New branch "${branch.name}" in ${branch.city} created by ${vendorProfile.companyName}. Requires review.`,
      },
    });

    return branch;
  }

  async updateBranch(userId: string, branchId: string, dto: UpdateBranchDto) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });
    if (!vendorProfile) throw new ForbiddenException('Vendor profile not found');

    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || branch.vendorProfileId !== vendorProfile.id) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data: dto,
    });
  }

  async deleteBranch(userId: string, branchId: string) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });
    if (!vendorProfile) throw new ForbiddenException('Vendor profile not found');

    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || branch.vendorProfileId !== vendorProfile.id) {
      throw new NotFoundException('Branch not found');
    }

    // If already suspended, permanently delete it
    if (branch.status === 'SUSPENDED') {
      await this.prisma.branch.delete({ where: { id: branchId } });
      return { message: 'Branch deleted permanently' };
    }

    // Check for active bookings across all services in this branch
    const activeBookingCount = await this.prisma.booking.count({
      where: {
        branchId,
        status: { in: ['PENDING', 'PENDING_APPROVAL', 'CONFIRMED', 'CHECKED_IN'] },
      },
    });

    if (activeBookingCount > 0) {
      throw new BadRequestException(
        `Cannot suspend this branch — it has ${activeBookingCount} active booking${activeBookingCount > 1 ? 's' : ''}. Cancel or complete them first.`,
      );
    }

    // Request suspension instead of immediate delete — admin must approve
    await this.prisma.approvalRequest.create({
      data: {
        branchId: branch.id,
        type: 'BRANCH_SUSPENSION',
        description: `Vendor ${vendorProfile.companyName} requested deletion of branch "${branch.name}".`,
      },
    });

    // Mark as suspended pending admin review
    return this.prisma.branch.update({
      where: { id: branchId },
      data: { status: 'SUSPENDED' },
    });
  }
}
