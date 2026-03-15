import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, RoomShape, SetupType } from '@prisma/client';

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

    @ApiProperty({ example: 20, required: false, description: 'Max capacity for HOT_DESK/PRIVATE_OFFICE' })
    @IsInt()
    @IsOptional()
    capacity?: number;

    @ApiProperty({ example: 1, required: false, description: 'Min capacity for HOT_DESK/PRIVATE_OFFICE' })
    @IsInt()
    @Min(1)
    @IsOptional()
    minCapacity?: number;

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

    @ApiProperty({ required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;

    @ApiProperty({ example: 15.0, required: false, description: 'Price per booking (flat rate)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    pricePerBooking?: number;

    @ApiProperty({ example: 10.0, required: false, description: 'Price per person' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    pricePerPerson?: number;

    @ApiProperty({ example: 5.0, required: false, description: 'Price per hour' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    pricePerHour?: number;

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

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
}
