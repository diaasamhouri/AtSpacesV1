import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BookingBranchDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  city: string;
  @ApiProperty()
  address: string;
}

class BookingServiceDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  type: string;
  @ApiProperty()
  name: string;
}

class BookingPaymentDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  method: string;
  @ApiProperty()
  status: string;
  @ApiProperty()
  amount: number;
  @ApiProperty()
  currency: string;
  @ApiPropertyOptional()
  paidAt: string | null;
}

export class BookingResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  status: string;
  @ApiProperty()
  startTime: string;
  @ApiProperty()
  endTime: string;
  @ApiProperty()
  numberOfPeople: number;
  @ApiProperty()
  totalPrice: number;
  @ApiProperty()
  currency: string;
  @ApiPropertyOptional()
  notes: string | null;
  @ApiProperty()
  createdAt: string;
  @ApiProperty({ type: BookingBranchDto })
  branch: BookingBranchDto;
  @ApiProperty({ type: BookingServiceDto })
  service: BookingServiceDto;
  @ApiPropertyOptional({ type: BookingPaymentDto })
  payment: BookingPaymentDto | null;
}

export class BookingListResponseDto {
  @ApiProperty({ type: [BookingResponseDto] })
  data: BookingResponseDto[];
}

class OperatingHoursDto {
  @ApiProperty()
  open: string;
  @ApiProperty()
  close: string;
}

class SuggestedSlotDto {
  @ApiProperty()
  startTime: string;
  @ApiProperty()
  endTime: string;
  @ApiProperty()
  label: string;
}

export class AvailabilityResponseDto {
  @ApiProperty()
  available: boolean;
  @ApiProperty()
  currentBookings: number;
  @ApiProperty()
  capacity: number;
  @ApiProperty()
  remainingSpots: number;
  @ApiPropertyOptional()
  reason?: string;
  @ApiPropertyOptional({ type: OperatingHoursDto, nullable: true })
  operatingHoursForDay?: { open: string; close: string } | null;
  @ApiPropertyOptional({ type: [SuggestedSlotDto] })
  suggestedSlots?: { startTime: string; endTime: string; label: string }[];
}
