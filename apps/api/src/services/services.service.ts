import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { SETUP_ELIGIBLE_TYPES } from '../common/constants';

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

        // At least one price must be set
        if (dto.pricePerBooking == null && dto.pricePerPerson == null && dto.pricePerHour == null) {
            throw new BadRequestException('At least one pricing field must be set (pricePerBooking, pricePerPerson, or pricePerHour)');
        }

        // Setup configs only apply to MEETING_ROOM and EVENT_SPACE
        if (dto.setupConfigs && dto.setupConfigs.length > 0 && !SETUP_ELIGIBLE_TYPES.includes(dto.type)) {
            throw new BadRequestException('Setup configurations are only available for Meeting Room and Event Space types');
        }

        // Derive capacity: from setupConfigs for eligible types, from direct fields otherwise
        let capacity = dto.capacity ?? null;
        let minCapacity = dto.minCapacity ?? null;
        if (dto.setupConfigs && dto.setupConfigs.length > 0) {
            capacity = Math.max(...dto.setupConfigs.map(c => c.maxPeople));
            minCapacity = Math.min(...dto.setupConfigs.map(c => c.minPeople));
        }

        return this.prisma.service.create({
            data: {
                branchId: dto.branchId,
                type: dto.type,
                name: dto.name,
                unitNumber: dto.unitNumber,
                description: dto.description,
                capacity,
                minCapacity,
                floor: dto.floor,
                profileNameEn: dto.profileNameEn,
                profileNameAr: dto.profileNameAr,
                weight: dto.weight,
                netSize: dto.netSize,
                shape: dto.shape,
                features: dto.features,
                isPublic: dto.isPublic ?? true,
                pricePerBooking: dto.pricePerBooking,
                pricePerPerson: dto.pricePerPerson,
                pricePerHour: dto.pricePerHour,
                setupConfigs: dto.setupConfigs && dto.setupConfigs.length > 0 ? {
                    create: dto.setupConfigs.map((c) => ({
                        setupType: c.setupType,
                        minPeople: c.minPeople,
                        maxPeople: c.maxPeople,
                    })),
                } : undefined,
            },
            include: { setupConfigs: true },
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

        // Derive capacity: from setupConfigs for eligible types, from direct fields otherwise
        let capacity = dto.capacity;
        let minCapacity = dto.minCapacity;
        if (dto.setupConfigs && dto.setupConfigs.length > 0) {
            capacity = Math.max(...dto.setupConfigs.map(c => c.maxPeople));
            minCapacity = Math.min(...dto.setupConfigs.map(c => c.minPeople));
        }

        // Prepare update data
        const updateData: any = {
            type: dto.type,
            name: dto.name,
            unitNumber: dto.unitNumber,
            description: dto.description,
            capacity,
            minCapacity,
            isActive: dto.isActive,
            isPublic: dto.isPublic,
            floor: dto.floor,
            profileNameEn: dto.profileNameEn,
            profileNameAr: dto.profileNameAr,
            weight: dto.weight,
            netSize: dto.netSize,
            shape: dto.shape,
            features: dto.features,
            pricePerBooking: dto.pricePerBooking,
            pricePerPerson: dto.pricePerPerson,
            pricePerHour: dto.pricePerHour,
        };

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
            include: { setupConfigs: true },
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

        // Prevent deletion if there are active/pending bookings
        const activeBookingCount = await this.prisma.booking.count({
            where: {
                serviceId,
                status: { in: ['PENDING', 'PENDING_APPROVAL', 'CONFIRMED', 'CHECKED_IN'] },
            },
        });

        if (activeBookingCount > 0) {
            throw new BadRequestException(
                `Cannot delete this unit — it has ${activeBookingCount} active booking${activeBookingCount > 1 ? 's' : ''}. Cancel or complete them first.`,
            );
        }

        return this.prisma.service.delete({
            where: { id: serviceId },
        });
    }
}
