import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty() @IsEmail() email: string;
    @ApiProperty() @IsNotEmpty() @IsString() code: string;
    @ApiProperty() @IsNotEmpty() @IsString() @MinLength(6) newPassword: string;
}
