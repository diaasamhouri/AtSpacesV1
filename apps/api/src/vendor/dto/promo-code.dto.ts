import { IsString, IsInt, IsOptional, Min, Max, IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromoCodeDto {
    @ApiProperty() @IsString() code: string;
    @ApiProperty({ minimum: 1, maximum: 100 }) @IsInt() @Min(1) @Max(100) discountPercent: number;
    @ApiPropertyOptional() @IsInt() @IsOptional() @Min(0) maxUses?: number;
    @ApiPropertyOptional() @IsDateString() @IsOptional() validUntil?: string;
    @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
    @ApiPropertyOptional() @IsUUID() @IsOptional() branchId?: string;
}

export class UpdatePromoCodeDto {
    @ApiPropertyOptional() @IsInt() @Min(1) @Max(100) @IsOptional() discountPercent?: number;
    @ApiPropertyOptional() @IsInt() @Min(0) @IsOptional() maxUses?: number;
    @ApiPropertyOptional() @IsDateString() @IsOptional() validUntil?: string;
    @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
    @ApiPropertyOptional() @IsUUID() @IsOptional() branchId?: string;
}
