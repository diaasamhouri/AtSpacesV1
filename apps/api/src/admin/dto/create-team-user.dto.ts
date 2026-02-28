import { IsString, IsEmail, IsNotEmpty, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateTeamUserDto {
    @ApiProperty({ description: 'Full name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Password' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ enum: ['MODERATOR', 'ACCOUNTANT'], description: 'Team role' })
    @IsEnum(Role)
    @IsNotEmpty()
    role: Role;
}
