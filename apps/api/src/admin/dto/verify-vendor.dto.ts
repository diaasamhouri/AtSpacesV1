import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyVendorDto {
    @ApiProperty({ description: 'Whether to verify or unverify the vendor' })
    @IsBoolean()
    verified: boolean;

    @ApiPropertyOptional({ description: 'Optional note for the verification change' })
    @IsString()
    @IsOptional()
    note?: string;
}
