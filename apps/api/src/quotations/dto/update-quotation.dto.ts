import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateQuotationDto } from './create-quotation.dto';

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {
  @ApiPropertyOptional({ description: 'Quotation status' })
  @IsOptional()
  @IsString()
  status?: string;
}
