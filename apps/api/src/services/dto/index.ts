import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, PricingInterval, PricingMode, RoomShape, SetupType } from '@prisma/client';

export class ServicePricingDto {
    @ApiProperty({ enum: PricingInterval })
    @IsEnum(PricingInterval)
    interval: PricingInterval;

    @ApiProperty({ enum: PricingMode, required: false })
    @IsOptional()
    @IsEnum(PricingMode)
    pricingMode?: PricingMode;

    @ApiProperty({ example: 15.0 })
    @IsNumber()
    price: number;
}

export class SetupConfigDto {
    @ApiProperty({ enum: SetupType })
    @IsEnum(SetupType)
    setupType: SetupType;

    @ApiProperty({ example: 1 })
    @IsInt()
    @Min(1)
    minPeople: number;

    @ApiProperty({ example: 20 })
    @IsInt()
    @Min(1)
    maxPeople: number;
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

    @ApiProperty({ example: 'A-101', required: false })
    @IsString()
    @IsOptional()
    unitNumber?: string;

    @ApiProperty({ example: 'Open seating area', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 20, required: false, description: 'Legacy capacity field; prefer setupConfigs' })
    @IsNumber()
    @IsOptional()
    capacity?: number;

    @ApiProperty({ example: 'Ground Floor', required: false })
    @IsString()
    @IsOptional()
    floor?: string;

    @ApiProperty({ example: 'Room A', required: false })
    @IsString()
    @IsOptional()
    profileNameEn?: string;

    @ApiProperty({ example: 'غرفة أ', required: false })
    @IsString()
    @IsOptional()
    profileNameAr?: string;

    @ApiProperty({ example: 5, required: false })
    @IsInt()
    @IsOptional()
    weight?: number;

    @ApiProperty({ example: 25.5, required: false })
    @IsNumber()
    @IsOptional()
    netSize?: number;

    @ApiProperty({ enum: RoomShape, required: false })
    @IsEnum(RoomShape)
    @IsOptional()
    shape?: RoomShape;

    @ApiProperty({ example: ['Whiteboard', 'Projector'], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    features?: string[];

    @ApiProperty({ type: [ServicePricingDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ServicePricingDto)
    pricing: ServicePricingDto[];

    @ApiProperty({ type: [SetupConfigDto], required: false, description: 'Setup configurations with min/max people per setup type' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SetupConfigDto)
    @IsOptional()
    setupConfigs?: SetupConfigDto[];
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
