import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListBranchesQueryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async listBranches(query: ListBranchesQueryDto) {
    const { city, type, search, page = 1, limit = 12 } = query;

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

    const data = branches.map((branch) => {
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
        vendor: {
          select: {
            id: true,
            companyName: true,
            logo: true,
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
}
