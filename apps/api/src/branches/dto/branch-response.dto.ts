import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PricingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() interval: string;
  @ApiProperty({ type: Number, description: 'Price in JOD' }) price: number;
  @ApiProperty() currency: string;
}

export class ServiceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() type: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() capacity: number;
  @ApiProperty({ type: [PricingResponseDto] }) pricing: PricingResponseDto[];
}

export class VendorSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() companyName: string;
  @ApiPropertyOptional() logo: string | null;
}

export class BranchListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() city: string;
  @ApiProperty() address: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty({ type: [String] }) images: string[];
  @ApiProperty({ type: VendorSummaryDto }) vendor: VendorSummaryDto;
  @ApiProperty({
    type: [String],
    description: 'Service types available at this branch',
  })
  serviceTypes: string[];
  @ApiPropertyOptional({
    type: Number,
    description: 'Lowest price in JOD across all active services',
  })
  startingPrice: number | null;
}

export class PaginationMetaDto {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPages: number;
}

export class BranchListResponseDto {
  @ApiProperty({ type: [BranchListItemDto] }) data: BranchListItemDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}

export class BranchDetailResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() city: string;
  @ApiProperty() address: string;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional() phone: string | null;
  @ApiPropertyOptional() email: string | null;
  @ApiPropertyOptional() latitude: number | null;
  @ApiPropertyOptional() longitude: number | null;
  @ApiProperty({ type: [String] }) images: string[];
  @ApiProperty({ type: VendorSummaryDto }) vendor: VendorSummaryDto;
  @ApiProperty({ type: [ServiceResponseDto] }) services: ServiceResponseDto[];
}
