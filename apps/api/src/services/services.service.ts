import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';

/** Service types that support setup configurations */
const SETUP_ELIGIBLE_TYPES = ['MEETING_ROOM', 'EVENT_SPACE'];

@Injectable()
export class ServicesService {
    constructor(private prisma: PrismaService) { }

    private async getVendorProfileAssert(userId: string) {
        const vendorProfile = await this.prisma.vendorProfile.findUnique({
            where: { userId },
        });
        if (!vendorProfile || vendorProfile.status !== 'APPROVED') {
            throw new ForbiddenException('Only approved vendors can manage services');
        }
        return vendorProfile;
    }

    async createService(userId: string, dto: CreateServiceDto) {
        const vendorProfile = await this.getVendorProfileAssert(userId);

        // Verify branch belongs to vendor
        const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
        if (!branch || branch.vendorProfileId !== vendorProfile.id) {
            throw new NotFoundException('Branch not found');
        }

        if (!dto.pricing || dto.pricing.length === 0) {
            throw new BadRequestException('At least one pricing interval must be provided');
        }

        // Setup configs only apply to MEETING_ROOM and EVENT_SPACE
        if (dto.setupConfigs && dto.setupConfigs.length > 0 && !SETUP_ELIGIBLE_TYPES.includes(dto.type)) {
            throw new BadRequestException('Setup configurations are only available for Meeting Room and Event Space types');
        }

        // Derive capacity from setupConfigs if provided
        const capacity = dto.setupConfigs && dto.setupConfigs.length > 0
            ? Math.max(...dto.setupConfigs.map(c => c.maxPeople))
            : dto.capacity ?? null;

        return this.prisma.service.create({
            data: {
                branchId: dto.branchId,
                type: dto.type,
                name: dto.name,
                unitNumber: dto.unitNumber,
                description: dto.description,
                capacity,
                floor: dto.floor,
                profileNameEn: dto.profileNameEn,
                profileNameAr: dto.profileNameAr,
                weight: dto.weight,
                netSize: dto.netSize,
                shape: dto.shape,
                features: dto.features,
                pricing: {
                    create: dto.pricing.map((p) => ({
                        interval: p.interval,
                        pricingMode: p.pricingMode ?? 'PER_BOOKING',
                        price: p.price,
                    })),
                },
                setupConfigs: dto.setupConfigs && dto.setupConfigs.length > 0 ? {
                    create: dto.setupConfigs.map((c) => ({
                        setupType: c.setupType,
                        minPeople: c.minPeople,
                        maxPeople: c.maxPeople,
                    })),
                } : undefined,
            },
            include: { pricing: true, setupConfigs: true },
        });
    }

    async updateService(userId: string, serviceId: string, dto: UpdateServiceDto) {
        const vendorProfile = await this.getVendorProfileAssert(userId);

        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
            include: { branch: true },
        });

        if (!service || service.branch.vendorProfileId !== vendorProfile.id) {
            throw new NotFoundException('Service not found');
        }

        // Setup configs only apply to MEETING_ROOM and EVENT_SPACE
        const effectiveType = dto.type || service.type;
        if (dto.setupConfigs && dto.setupConfigs.length > 0 && !SETUP_ELIGIBLE_TYPES.includes(effectiveType)) {
            throw new BadRequestException('Setup configurations are only available for Meeting Room and Event Space types');
        }

        // If type is changing to a non-eligible type, clear existing setupConfigs
        if (dto.type && !SETUP_ELIGIBLE_TYPES.includes(dto.type) && !dto.setupConfigs) {
            dto.setupConfigs = [];
        }

        // Derive capacity from setupConfigs if provided
        const capacity = dto.setupConfigs && dto.setupConfigs.length > 0
            ? Math.max(...dto.setupConfigs.map(c => c.maxPeople))
            : dto.capacity;

        // Prepare update data
        const updateData: any = {
            type: dto.type,
            name: dto.name,
            unitNumber: dto.unitNumber,
            description: dto.description,
            capacity,
            isActive: dto.isActive,
            floor: dto.floor,
            profileNameEn: dto.profileNameEn,
            profileNameAr: dto.profileNameAr,
            weight: dto.weight,
            netSize: dto.netSize,
            shape: dto.shape,
            features: dto.features,
        };

        // If pricing is provided, delete old and recreate
        if (dto.pricing) {
            if (dto.pricing.length === 0) {
                throw new BadRequestException('At least one pricing interval must be provided');
            }

            await this.prisma.$transaction([
                this.prisma.servicePricing.deleteMany({ where: { serviceId } }),
                this.prisma.servicePricing.createMany({
                    data: dto.pricing.map((p) => ({
                        serviceId,
                        interval: p.interval,
                        pricingMode: p.pricingMode ?? 'PER_BOOKING',
                        price: p.price,
                    })),
                }),
            ]);
        }

        // If setupConfigs is provided, delete old and recreate
        if (dto.setupConfigs) {
            await this.prisma.$transaction([
                this.prisma.serviceSetupConfig.deleteMany({ where: { serviceId } }),
                ...(dto.setupConfigs.length > 0 ? [
                    this.prisma.serviceSetupConfig.createMany({
                        data: dto.setupConfigs.map((c) => ({
                            serviceId,
                            setupType: c.setupType,
                            minPeople: c.minPeople,
                            maxPeople: c.maxPeople,
                        })),
                    }),
                ] : []),
            ]);
        }

        return this.prisma.service.update({
            where: { id: serviceId },
            data: updateData,
            include: { pricing: true, setupConfigs: true },
        });
    }

    async deleteService(userId: string, serviceId: string) {
        const vendorProfile = await this.getVendorProfileAssert(userId);

        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
            include: { branch: true },
        });

        if (!service || service.branch.vendorProfileId !== vendorProfile.id) {
            throw new NotFoundException('Service not found');
        }

        return this.prisma.service.delete({
            where: { id: serviceId },
        });
    }
}
