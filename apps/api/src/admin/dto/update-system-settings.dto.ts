import { IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SettingEntryDto {
    @ApiProperty() @IsString() key: string;
    @ApiProperty() @IsString() value: string;
}

export class UpdateSystemSettingsDto {
    @ApiProperty({ type: [SettingEntryDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SettingEntryDto)
    settings: SettingEntryDto[];
}
