import { IsString, IsOptional } from 'class-validator';

export class ValidatePromoDto {
    @IsString()
    code: string;

    @IsOptional()
    @IsString()
    branchId?: string;
}
