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

export class UpdateBookingStatusDto {
    @ApiProperty({ enum: ['PENDING', 'PENDING_APPROVAL', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW', 'EXPIRED'] })
    @IsNotEmpty()
    @IsString()
    status: string;
}

export class UpdateBranchStatusDto {
    @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'UNDER_REVIEW'] })
    @IsNotEmpty()
    @IsString()
    status: string;
}

export class ProcessApprovalDto {
    @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
    @IsNotEmpty()
    @IsString()
    status: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    reason?: string;
}

export class UpdateVendorCommissionDto {
    @ApiProperty({ description: 'Commission rate (0-100) or null for default', required: false, nullable: true })
    @IsOptional()
    commissionRate: number | null;
}

export { CreateTeamUserDto } from './create-team-user.dto';
export {
    AdminVendorsQueryDto,
    AdminUsersQueryDto,
    AdminBookingsQueryDto,
    AdminPaymentsQueryDto,
    AdminBranchesQueryDto,
    AdminApprovalsQueryDto,
    AdminServicesQueryDto,
} from './admin-query.dto';
export { VerifyVendorDto } from './verify-vendor.dto';
export { SendNotificationDto } from './send-notification.dto';
export { UpdateSystemSettingsDto } from './update-system-settings.dto';
