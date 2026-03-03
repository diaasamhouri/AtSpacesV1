import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVendorProfileDto {
    @ApiPropertyOptional() @IsString() @IsOptional() companyName?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() phone?: string;
    @ApiPropertyOptional() @IsString() @IsOptional() website?: string;
    @ApiPropertyOptional() @IsArray() @IsOptional() images?: string[];
    @ApiPropertyOptional() @IsObject() @IsOptional() socialLinks?: Record<string, string>;
}
