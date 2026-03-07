import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AdminVendorsQueryDto extends PaginationQueryDto { }

export class AdminUsersQueryDto extends PaginationQueryDto { }

export class AdminBookingsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    status?: string;
}

export class AdminPaymentsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    status?: string;
}

export class AdminBranchesQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    city?: string;
}

export class AdminApprovalsQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    status?: string;
}

export class AdminServicesQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    branchId?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    floor?: string;
}
