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

export class AdminBranchesQueryDto extends PaginationQueryDto { }

export class AdminApprovalsQueryDto extends PaginationQueryDto { }
