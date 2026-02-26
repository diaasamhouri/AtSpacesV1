import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { City, ServiceType } from '@prisma/client';

export class ListBranchesQueryDto {
  @ApiPropertyOptional({ enum: City, example: 'AMMAN' })
  @IsOptional()
  @IsEnum(City)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  city?: City;

  @ApiPropertyOptional({ enum: ServiceType, example: 'HOT_DESK' })
  @IsOptional()
  @IsEnum(ServiceType)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase().replace(/-/g, '_') : value,
  )
  type?: ServiceType;

  @ApiPropertyOptional({
    description: 'Search by branch name, address, or vendor company name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}
