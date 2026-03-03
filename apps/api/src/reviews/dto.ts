import { IsString, IsInt, IsOptional, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
    @ApiProperty() @IsUUID() branchId: string;
    @ApiPropertyOptional() @IsUUID() @IsOptional() bookingId?: string;
    @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) rating: number;
    @ApiPropertyOptional() @IsString() @IsOptional() comment?: string;
}

export class ReplyReviewDto {
    @ApiProperty() @IsString() vendorReply: string;
}

export class ToggleFavoriteDto {
    @ApiProperty() @IsUUID() branchId: string;
}
