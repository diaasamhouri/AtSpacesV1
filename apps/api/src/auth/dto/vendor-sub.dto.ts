import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, LegalDocType, DepartmentType } from '@prisma/client';

export class CreateAuthorizedSignatoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiPropertyOptional({ enum: LegalDocType })
  @IsEnum(LegalDocType)
  @IsOptional()
  legalDocType?: LegalDocType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  legalDocNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;
}

export class CreateCompanyContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contactPersonName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fax?: string;
}

export class CreateDepartmentContactDto {
  @ApiPropertyOptional({ enum: DepartmentType })
  @IsEnum(DepartmentType)
  @IsNotEmpty()
  department: DepartmentType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fax?: string;
}

export class CreateBankingInfoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankBranch?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  iban?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  swiftCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accountantManagerName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cliq?: string;
}
