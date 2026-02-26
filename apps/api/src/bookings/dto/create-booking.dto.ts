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

export enum PricingIntervalParam {
  HOURLY = 'HOURLY',
  HALF_DAY = 'HALF_DAY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum PaymentMethodParam {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  APPLE_PAY = 'APPLE_PAY',
  CASH = 'CASH',
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
    description: 'Pricing interval to apply',
    enum: PricingIntervalParam,
  })
  @IsEnum(PricingIntervalParam)
  pricingInterval: PricingIntervalParam;

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
}
