import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class EmailLoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+962791234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+962[0-9]{8,9}$/, {
    message: 'Phone must be a valid Jordanian number (+962XXXXXXXXX)',
  })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+962791234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
