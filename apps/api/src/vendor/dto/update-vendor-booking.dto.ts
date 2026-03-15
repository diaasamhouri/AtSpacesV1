import {
  IsOptional, IsUUID, IsString, IsInt, IsNumber, IsArray, ValidateNested, Min, IsBoolean, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PricingMode } from '@prisma/client';
import { BookingDayAddOnDto } from './booking-day.dto';

export class UpdateVendorBookingDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() serviceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endTime?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) numberOfPeople?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() requestedSetup?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => BookingDayAddOnDto) addOns?: BookingDayAddOnDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() discountType?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) discountValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() subjectToTax?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsEnum(PricingMode) pricingMode?: PricingMode;
}
