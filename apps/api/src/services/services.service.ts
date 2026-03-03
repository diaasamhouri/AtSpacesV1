import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';

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

        return this.prisma.service.create({
            data: {
                branchId: dto.branchId,
                type: dto.type,
                name: dto.name,
                description: dto.description,
                capacity: dto.capacity,
                pricing: {
                    create: dto.pricing.map((p) => ({
                        interval: p.interval,
                        price: p.price,
                    })),
                },
            },
            include: { pricing: true },
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

        // Prepare update data
        const updateData: any = {
            type: dto.type,
            name: dto.name,
            description: dto.description,
            capacity: dto.capacity,
            isActive: dto.isActive,
        };

        // If pricing is provided, we can either upsert or delete all current and recreate.
        // Recreating is easiest for replacing arrays unless ID stability is strictly required.
        // For simplicity, we use a transaction to delete old pricing and create new ones.
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
                        price: p.price,
                    })),
                }),
            ]);
        }

        return this.prisma.service.update({
            where: { id: serviceId },
            data: updateData,
            include: { pricing: true },
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
