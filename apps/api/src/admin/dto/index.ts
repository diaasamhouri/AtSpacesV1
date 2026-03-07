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
    AdminServicesQueryDto,
} from './admin-query.dto';
export { VerifyVendorDto } from './verify-vendor.dto';
export { SendNotificationDto } from './send-notification.dto';
export { UpdateSystemSettingsDto } from './update-system-settings.dto';
