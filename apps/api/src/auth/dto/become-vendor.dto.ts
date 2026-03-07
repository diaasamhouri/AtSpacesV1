import {
    IsString,
    IsOptional,
    IsArray,
    IsNotEmpty,
    IsDateString,
    IsBoolean,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    CreateAuthorizedSignatoryDto,
    CreateCompanyContactDto,
    CreateDepartmentContactDto,
    CreateBankingInfoDto,
} from './vendor-sub.dto';

export class BecomeVendorDto {
    @ApiProperty({ description: 'Company or venue name' })
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @ApiPropertyOptional({ description: 'Company description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Business phone number' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ description: 'Business website URL' })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiPropertyOptional({
        description: 'Array of uploaded image file paths (landscape only)',
        type: [String],
    })
    @IsArray()
    @IsOptional()
    images?: string[];

    @ApiPropertyOptional({
        description: 'Array of selected amenities/facilities',
        type: [String],
    })
    @IsArray()
    @IsOptional()
    amenities?: string[];

    @ApiPropertyOptional({ description: 'Timestamp when vendor agreed to T&C' })
    @IsDateString()
    @IsOptional()
    agreedToTermsAt?: string;

    // ==================== EXPANDED FIELDS ====================

    @ApiProperty({ description: 'Company legal name' })
    @IsString()
    @IsNotEmpty()
    companyLegalName: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    companyShortName?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    companyTradeName?: string;

    @ApiProperty({ description: 'Company national ID' })
    @IsString()
    @IsNotEmpty()
    companyNationalId: string;

    @ApiProperty({ description: 'Company registration number' })
    @IsString()
    @IsNotEmpty()
    companyRegistrationNumber: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    companyRegistrationDate?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    companySalesTaxNumber?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    registeredInCountry?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    hasTaxExemption?: boolean;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    companyDescription?: string;

    // ==================== NESTED SUB-MODELS ====================

    @ApiProperty({ type: [CreateAuthorizedSignatoryDto] })
    @ValidateNested({ each: true })
    @Type(() => CreateAuthorizedSignatoryDto)
    @ArrayMinSize(1)
    authorizedSignatories: CreateAuthorizedSignatoryDto[];

    @ApiProperty({ type: [CreateCompanyContactDto] })
    @ValidateNested({ each: true })
    @Type(() => CreateCompanyContactDto)
    @ArrayMinSize(1)
    companyContacts: CreateCompanyContactDto[];

    @ApiPropertyOptional({ type: [CreateDepartmentContactDto] })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateDepartmentContactDto)
    departmentContacts?: CreateDepartmentContactDto[];

    @ApiProperty({ type: [CreateBankingInfoDto] })
    @ValidateNested({ each: true })
    @Type(() => CreateBankingInfoDto)
    @ArrayMinSize(1)
    bankingInfo: CreateBankingInfoDto[];
}
