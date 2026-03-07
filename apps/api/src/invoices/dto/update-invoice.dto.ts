import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsDateString, IsString, Min } from 'class-validator';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'Invoice amount before tax', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ description: 'Tax amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Total invoice amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Invoice status (DRAFT, ISSUED, PAID, OVERDUE, CANCELLED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Due date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
