import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, PricingInterval } from '@prisma/client';

export class ServicePricingDto {
    @ApiProperty({ enum: PricingInterval })
    @IsEnum(PricingInterval)
    interval: PricingInterval;

    @ApiProperty({ example: 15.0 })
    @IsNumber()
    price: number;
}

export class CreateServiceDto {
    @ApiProperty({ example: 'branch-uuid' })
    @IsString()
    @IsNotEmpty()
    branchId: string;

    @ApiProperty({ enum: ServiceType })
    @IsEnum(ServiceType)
    type: ServiceType;

    @ApiProperty({ example: 'Hot Desk Area A' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Open seating area', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 20 })
    @IsNumber()
    capacity: number;

    @ApiProperty({ type: [ServicePricingDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ServicePricingDto)
    pricing: ServicePricingDto[];
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
