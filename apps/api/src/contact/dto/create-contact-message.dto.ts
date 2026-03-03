import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactMessageDto {
    @ApiProperty() @IsNotEmpty() @IsString() name: string;
    @ApiProperty() @IsEmail() email: string;
    @ApiProperty() @IsNotEmpty() @IsString() subject: string;
    @ApiProperty() @IsNotEmpty() @IsString() message: string;
}
