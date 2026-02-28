import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VendorStatus } from '@prisma/client';

export class UpdateVendorStatusDto {
    @ApiProperty({ enum: VendorStatus })
    @IsEnum(VendorStatus)
    @IsNotEmpty()
    status: VendorStatus;

    @ApiProperty({ required: false, description: 'Rejection reason' })
    @IsString()
    @IsOptional()
    reason?: string;
}

export { CreateTeamUserDto } from './create-team-user.dto';
export {
    AdminVendorsQueryDto,
    AdminUsersQueryDto,
    AdminBookingsQueryDto,
    AdminPaymentsQueryDto,
    AdminBranchesQueryDto,
    AdminApprovalsQueryDto,
} from './admin-query.dto';
