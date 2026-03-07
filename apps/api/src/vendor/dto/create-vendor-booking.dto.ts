import { IsUUID, IsOptional, IsString, IsEnum, IsNumber, Min, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '@prisma/client';
import { BookingDayDto } from './booking-day.dto';

export class CreateVendorBookingDto {
    @IsUUID()
    customerId: string;

    @IsUUID()
    branchId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BookingDayDto)
    days: BookingDayDto[];

    @IsOptional()
    @IsBoolean()
    subjectToTax?: boolean;

    @IsOptional()
    @IsEnum(DiscountType)
    discountType?: DiscountType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    discountValue?: number;

    @IsOptional()
    @IsString()
    promoCode?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
