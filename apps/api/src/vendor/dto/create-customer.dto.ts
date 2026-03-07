import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

export class CreateCustomerDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(['INDIVIDUAL', 'COMPANY'])
    entityType?: 'INDIVIDUAL' | 'COMPANY';
}
