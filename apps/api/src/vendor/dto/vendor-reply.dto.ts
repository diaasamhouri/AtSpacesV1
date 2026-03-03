import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VendorReplyDto {
    @ApiProperty({ description: 'Vendor reply to a customer review' })
    @IsString()
    @IsNotEmpty()
    vendorReply: string;
}
