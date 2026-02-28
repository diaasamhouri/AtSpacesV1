import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  BookingResponseDto,
  BookingListResponseDto,
  AvailabilityResponseDto,
} from './dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking (requires login)' })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my bookings' })
  @ApiResponse({ status: 200, type: BookingListResponseDto })
  async getMyBookings(@Req() req: any) {
    return this.bookingsService.getUserBookings(req.user.id);
  }

  @Get('check-availability')
  @ApiOperation({ summary: 'Check service availability for a time range' })
  @ApiResponse({ status: 200, type: AvailabilityResponseDto })
  async checkAvailability(
    @Query('serviceId') serviceId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.bookingsService.checkAvailability(
      serviceId,
      startTime,
      endTime,
    );
  }

  @Get('verify-promo')
  @ApiOperation({ summary: 'Verify a promo code' })
  @ApiResponse({ status: 200, description: 'Promo code is valid' })
  async verifyPromoCode(
    @Query('code') code: string,
    @Query('serviceId') serviceId: string,
  ) {
    if (!code || !serviceId) {
      throw new BadRequestException('Missing required query parameters');
    }
    return this.bookingsService.verifyPromoCode(code, serviceId);
  }

  // ==================== VENDOR ENDPOINTS ====================

  @Get('vendor')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings for vendor branches' })
  async getVendorBookings(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.bookingsService.getVendorBookings(req.user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (Vendor only)' })
  async updateBookingStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    return this.bookingsService.updateBookingStatus(req.user.id, id, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async getBooking(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.getBookingById(id, req.user.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  async cancelBooking(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(id, req.user.id);
  }
}
