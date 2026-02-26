import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class EmailSignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'Ahmad' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class PhoneSignupDto {
  @ApiProperty({ example: '+962791234567' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+962[0-9]{8,9}$/, {
    message: 'Phone must be a valid Jordanian number (+962XXXXXXXXX)',
  })
  phone: string;

  @ApiPropertyOptional({ example: 'Ahmad' })
  @IsString()
  @IsOptional()
  name?: string;
}
