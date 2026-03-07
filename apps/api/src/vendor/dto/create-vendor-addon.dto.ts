import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateVendorAddOnDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    nameAr?: string;

    @IsNumber()
    @Min(0)
    unitPrice: number;
}

export class UpdateVendorAddOnDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    nameAr?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    unitPrice?: number;

    @IsOptional()
    isActive?: boolean;
}
