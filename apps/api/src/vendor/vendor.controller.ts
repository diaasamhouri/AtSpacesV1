import { Controller, Get, Patch, Post, Body, Param, Req, UseGuards, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VendorService } from './vendor.service';
import { UpdateVendorProfileDto, VendorReplyDto, CreatePromoCodeDto, UpdatePromoCodeDto } from './dto';

@ApiTags('Vendor')
@Controller('vendor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorController {
    constructor(private readonly vendorService: VendorService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Get vendor dashboard stats' })
    async getStats(@Req() req: any) {
        return this.vendorService.getVendorStats(req.user.id);
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get vendor profile' })
    async getProfile(@Req() req: any) {
        return this.vendorService.getProfile(req.user.id);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update vendor profile' })
    async updateProfile(@Req() req: any, @Body() dto: UpdateVendorProfileDto) {
        return this.vendorService.updateProfile(req.user.id, dto);
    }

    @Get('earnings')
    @ApiOperation({ summary: 'Get vendor earnings breakdown' })
    async getEarnings(@Req() req: any) {
        return this.vendorService.getEarnings(req.user.id);
    }

    @Get('analytics')
    @ApiOperation({ summary: 'Get vendor analytics' })
    async getAnalytics(@Req() req: any) {
        return this.vendorService.getAnalytics(req.user.id);
    }

    @Get('notifications')
    @ApiOperation({ summary: 'Get vendor notifications' })
    async getNotifications(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.vendorService.getNotifications(req.user.id, {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }

    @Patch('notifications/:id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    async markNotificationRead(@Req() req: any, @Param('id') id: string) {
        return this.vendorService.markNotificationRead(req.user.id, id);
    }

    @Post('request-verification')
    @ApiOperation({ summary: 'Request verified badge' })
    async requestVerification(@Req() req: any) {
        return this.vendorService.requestVerification(req.user.id);
    }

    // ==================== REVIEWS ====================

    @Get('reviews')
    @ApiOperation({ summary: 'Get all reviews for vendor branches' })
    async getReviews(@Req() req: any) {
        return this.vendorService.getVendorReviews(req.user.id);
    }

    @Patch('reviews/:id/reply')
    @ApiOperation({ summary: 'Reply to a customer review' })
    async replyToReview(@Req() req: any, @Param('id') reviewId: string, @Body() dto: VendorReplyDto) {
        return this.vendorService.replyToReview(req.user.id, reviewId, dto.vendorReply);
    }

    // ==================== CALENDAR ====================

    @Get('calendar')
    @ApiOperation({ summary: 'Get confirmed bookings for calendar view' })
    async getCalendarEvents(@Req() req: any) {
        return this.vendorService.getCalendarEvents(req.user.id);
    }

    // ==================== PROMOTIONS ====================

    @Get('promotions')
    @ApiOperation({ summary: 'Get all promo codes for vendor' })
    async getPromoCodes(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.vendorService.getPromoCodes(req.user.id, {
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }

    @Post('promotions')
    @ApiOperation({ summary: 'Create a new promo code' })
    async createPromoCode(@Req() req: any, @Body() dto: CreatePromoCodeDto) {
        return this.vendorService.createPromoCode(req.user.id, dto);
    }

    @Patch('promotions/:id')
    @ApiOperation({ summary: 'Update a promo code' })
    async updatePromoCode(@Req() req: any, @Param('id') promoId: string, @Body() dto: UpdatePromoCodeDto) {
        return this.vendorService.updatePromoCode(req.user.id, promoId, dto);
    }

    @Delete('promotions/:id')
    @ApiOperation({ summary: 'Delete a promo code' })
    async deletePromoCode(@Req() req: any, @Param('id') promoId: string) {
        return this.vendorService.deletePromoCode(req.user.id, promoId);
    }
}
