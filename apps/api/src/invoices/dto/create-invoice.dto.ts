import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Booking ID to associate with the invoice' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Customer user ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Invoice amount before tax', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Tax amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiProperty({ description: 'Total invoice amount (amount + tax)', minimum: 0 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Due date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
