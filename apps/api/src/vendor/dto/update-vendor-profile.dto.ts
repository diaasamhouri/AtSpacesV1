import { IsString, IsOptional, IsArray, IsObject, IsBoolean, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVendorProfileDto {
    @ApiPropertyOptional() @IsString() @IsOptional() companyName?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() phone?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() website?: string;
    @ApiPropertyOptional() @IsArray() @IsOptional() images?: string[];
    @ApiPropertyOptional() @IsObject() @IsOptional() socialLinks?: Record<string, string>;

    // Expanded legal fields
    @ApiPropertyOptional() @IsString() @IsOptional() companyLegalName?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() companyShortName?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() companyTradeName?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() companyNationalId?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() companyRegistrationNumber?: string;
    @ApiPropertyOptional() @IsDateString() @IsOptional() companyRegistrationDate?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() companySalesTaxNumber?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() registeredInCountry?: string;
    @ApiPropertyOptional() @IsBoolean() @IsOptional() hasTaxExemption?: boolean;
    @ApiPropertyOptional() @IsString() @IsOptional() companyDescription?: string;

    // Tax settings
    @ApiPropertyOptional() @IsNumber() @Min(0) @Max(100) @IsOptional() taxRate?: number;
    @ApiPropertyOptional() @IsBoolean() @IsOptional() taxEnabled?: boolean;
}
