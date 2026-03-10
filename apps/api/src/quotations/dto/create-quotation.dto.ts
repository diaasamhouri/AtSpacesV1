import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType, PricingInterval, PricingMode } from '@prisma/client';

export class QuotationLineItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class QuotationAddOnDto {
  @IsUUID()
  vendorAddOnId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;

  @IsOptional()
  @IsString()
  serviceTime?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateQuotationDto {
  @ApiProperty({ description: 'Customer user ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Branch ID' })
  @IsString()
  branchId: string;

  @ApiProperty({ description: 'Service ID' })
  @IsString()
  serviceId: string;

  @ApiProperty({ description: 'Start time (ISO 8601)' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End time (ISO 8601)' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Number of people', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  numberOfPeople?: number = 1;

  @ApiProperty({ description: 'Total amount in JOD' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  // Financial fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ enum: PricingInterval })
  @IsOptional()
  @IsEnum(PricingInterval)
  pricingInterval?: PricingInterval;

  @ApiPropertyOptional({ enum: PricingMode })
  @IsOptional()
  @IsEnum(PricingMode)
  pricingMode?: PricingMode;

  @ApiPropertyOptional({ type: [QuotationLineItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationLineItemDto)
  lineItems?: QuotationLineItemDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuotationAddOnDto)
  addOns?: QuotationAddOnDto[];
}
