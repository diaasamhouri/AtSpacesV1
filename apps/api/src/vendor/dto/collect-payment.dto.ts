import { IsOptional, IsString, MaxLength, IsArray, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CollectPaymentDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    receiptNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}

export class BulkCollectPaymentDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    bookingIds: string[];

    @IsOptional()
    @IsString()
    @MaxLength(100)
    receiptNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}
