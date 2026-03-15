import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsDateString,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SetupType } from '@prisma/client';

export enum PaymentMethodParam {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  APPLE_PAY = 'APPLE_PAY',
  CASH = 'CASH',
}

export class CheckAvailabilityQueryDto {
  @ApiProperty({ description: 'Service ID to check' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ description: 'Start time (ISO 8601)' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End time (ISO 8601)' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Number of people', minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  @IsInt()
  @Min(1)
  numberOfPeople?: number;
}

export class CreateBookingDto {
  @ApiProperty({ description: 'Service ID to book' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ description: 'Booking start time (ISO 8601)' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'Booking end time (ISO 8601)' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ description: 'Number of people', minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  numberOfPeople: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethodParam,
  })
  @IsEnum(PaymentMethodParam)
  paymentMethod: PaymentMethodParam;

  @ApiPropertyOptional({ description: 'Optional notes for the booking' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Optional promo code' })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({ description: 'Requested room setup type (for meeting rooms / event spaces)', enum: SetupType })
  @IsOptional()
  @IsEnum(SetupType)
  requestedSetup?: SetupType;
}
