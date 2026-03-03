import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
    @ApiPropertyOptional({ description: 'Target user ID (omit for broadcast)' })
    @IsUUID()
    @IsOptional()
    userId?: string;

    @ApiProperty({ description: 'Notification title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'Notification message body' })
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiPropertyOptional({ description: 'Notification type label' })
    @IsString()
    @IsOptional()
    type?: string;
}
