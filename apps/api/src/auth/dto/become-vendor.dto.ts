import { IsString, IsOptional, IsArray, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}

