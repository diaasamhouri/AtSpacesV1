import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
            where: { isActive: true },
            select: {
              type: true,
              pricing: {
                where: { isActive: true },
                select: { price: true },
                orderBy: { price: 'asc' },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.branch.count({ where }),
    ]);

    let data = branches.map((branch) => {
      const serviceTypes = [...new Set(branch.services.map((s) => s.type))];
      const allPrices = branch.services
        .flatMap((s) => s.pricing)
        .map((p) => p.price.toNumber());
      const startingPrice =
        allPrices.length > 0 ? Math.min(...allPrices) : null;

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
          where: { isActive: true },
          orderBy: { type: 'asc' },
          select: {
            id: true,
            type: true,
            name: true,
            description: true,
            capacity: true,
            pricing: {
              where: { isActive: true },
              orderBy: { price: 'asc' },
              select: {
                id: true,
                interval: true,
                price: true,
                currency: true,
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
        pricing: service.pricing.map((p) => ({
          ...p,
          price: p.price.toNumber(),
        })),
      })),
    };
  }

  async getVendorBranches(userId: string) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });
    if (!vendorProfile) throw new ForbiddenException('Vendor profile not found');

    const branches = await this.prisma.branch.findMany({
      where: { vendorProfileId: vendorProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        services: {
          select: {
            id: true,
            type: true,
            name: true,
            capacity: true,
            isActive: true,
          }
        }
      }
    });

    return { data: branches };
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
