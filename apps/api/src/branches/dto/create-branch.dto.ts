import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, IsNumber, IsBoolean } from 'class-validator';
import { City } from '@prisma/client';

export class CreateBranchDto {
    @ApiProperty({ example: 'Downtown Hub' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ enum: City })
    @IsEnum(City)
    city: City;

    @ApiProperty({ example: '123 Main St, Amman' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ example: 'A vibrant coworking space in the heart of the city.', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: '+962791234567', required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ example: 'downtown@atspaces.com', required: false })
    @IsString()
    @IsOptional()
    email?: string;

    @ApiProperty({ example: 31.9539, required: false })
    @IsNumber()
    @IsOptional()
    latitude?: number;

    @ApiProperty({ example: 35.9106, required: false })
    @IsNumber()
    @IsOptional()
    longitude?: number;

    @ApiProperty({ example: ['https://example.com/image1.jpg'], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @ApiProperty({ description: 'Weekly operating hours', required: false })
    @IsOptional()
    operatingHours?: Record<string, any>;

    @ApiProperty({ example: 'https://maps.google.com/...', required: false })
    @IsString()
    @IsOptional()
    googleMapsUrl?: string;

    @ApiProperty({ example: ['WiFi', 'Parking', 'Air Conditioning'], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    amenities?: string[];

    @ApiProperty({ description: 'Automatically accept bookings for this branch', required: false })
    @IsBoolean()
    @IsOptional()
    autoAcceptBookings?: boolean;

    @ApiProperty({ example: 150.5, description: 'Gross area in sqm', required: false })
    @IsNumber()
    @IsOptional()
    grossArea?: number;

    @ApiProperty({ example: '+962791234567', description: 'Reception mobile number', required: false })
    @IsString()
    @IsOptional()
    receptionMobile?: string;

    @ApiProperty({ example: 'reception@branch.com', description: 'Reception email', required: false })
    @IsString()
    @IsOptional()
    receptionEmail?: string;

    @ApiProperty({ example: 'https://atspaces.com/branch/downtown', description: 'Profile URL', required: false })
    @IsString()
    @IsOptional()
    profileUrl?: string;
}
