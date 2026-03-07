import { IsString, IsOptional, IsNumber, Min, IsInt, IsEnum, IsArray, ValidateNested, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { SetupType, PricingInterval, DiscountType } from '@prisma/client';

export class BookingDayAddOnDto {
    @IsUUID()
    vendorAddOnId: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsString()
    serviceTime?: string;

    @IsOptional()
    @IsString()
    comments?: string;
}

export class BookingDayDto {
    @IsString()
    date: string;

    @IsString()
    startTime: string;

    @IsString()
    endTime: string;

    @IsUUID()
    serviceId: string;

    @IsOptional()
    @IsEnum(SetupType)
    setupType?: SetupType;

    @IsOptional()
    @IsEnum(PricingInterval)
    pricingInterval?: PricingInterval;

    @IsOptional()
    @IsNumber()
    @Min(0)
    unitPrice?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    numberOfPeople?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BookingDayAddOnDto)
    addOns?: BookingDayAddOnDto[];
}
