import { Controller, Get, Patch, Post, Body, Param, Req, UseGuards, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VendorService } from './vendor.service';
import {
    UpdateVendorProfileDto, VendorReplyDto, CreatePromoCodeDto, UpdatePromoCodeDto,
    CreateVendorBookingDto, UpdateVendorBookingDto, CollectPaymentDto, BulkCollectPaymentDto,
    UpdateSignatoryDto, UpdateCompanyContactDto, UpdateDepartmentContactDto, UpdateBankingInfoDto,
    CreateVendorAddOnDto, UpdateVendorAddOnDto, CreateCustomerDto, ValidatePromoDto,
} from './dto';
import {
    CreateAuthorizedSignatoryDto, CreateCompanyContactDto,
    CreateDepartmentContactDto, CreateBankingInfoDto,
} from '../auth/dto/vendor-sub.dto';

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

    @Delete('reviews/:id/reply')
    @ApiOperation({ summary: 'Delete vendor reply from a review' })
    async deleteReviewReply(@Req() req: any, @Param('id') reviewId: string) {
        return this.vendorService.deleteReviewReply(req.user.id, reviewId);
    }

    // ==================== CALENDAR ====================

    @Get('calendar')
    @ApiOperation({ summary: 'Get confirmed bookings for calendar view' })
    async getCalendarEvents(@Req() req: any) {
        return this.vendorService.getCalendarEvents(req.user.id);
    }

    // ==================== DAY VIEW ====================

    @Get('day-view')
    @ApiOperation({ summary: 'Get day view data for gantt timeline' })
    async getDayView(
        @Req() req: any,
        @Query('date') date: string,
        @Query('branchId') branchId?: string,
    ) {
        return this.vendorService.getDayView(req.user.id, date || new Date().toISOString().split('T')[0], branchId);
    }

    // ==================== BRANCHES (vendor) ====================

    @Get('branches')
    @ApiOperation({ summary: 'Get vendor branches list for dropdowns' })
    async getVendorBranches(@Req() req: any) {
        return this.vendorService.getVendorBranches(req.user.id);
    }

    // ==================== CUSTOMER SEARCH ====================

    @Get('customers')
    @ApiOperation({ summary: 'Search customers by name, email or phone' })
    async searchCustomers(
        @Req() req: any,
        @Query('search') search?: string,
        @Query('limit') limit?: string,
    ) {
        return this.vendorService.searchCustomers(
            req.user.id,
            search || '',
            limit ? parseInt(limit, 10) : undefined,
        );
    }

    @Post('customers')
    @ApiOperation({ summary: 'Create a new customer inline' })
    async createCustomer(@Req() req: any, @Body() dto: CreateCustomerDto) {
        return this.vendorService.createCustomer(req.user.id, dto);
    }

    // ==================== VENDOR ADD-ONS ====================

    @Get('addons')
    @ApiOperation({ summary: 'Get vendor add-on catalog' })
    async getAddOns(@Req() req: any) {
        return this.vendorService.getAddOns(req.user.id);
    }

    @Post('addons')
    @ApiOperation({ summary: 'Create a new add-on' })
    async createAddOn(@Req() req: any, @Body() dto: CreateVendorAddOnDto) {
        return this.vendorService.createAddOn(req.user.id, dto);
    }

    @Patch('addons/:id')
    @ApiOperation({ summary: 'Update an add-on' })
    async updateAddOn(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateVendorAddOnDto) {
        return this.vendorService.updateAddOn(req.user.id, id, dto);
    }

    @Delete('addons/:id')
    @ApiOperation({ summary: 'Deactivate an add-on' })
    async deleteAddOn(@Req() req: any, @Param('id') id: string) {
        return this.vendorService.deleteAddOn(req.user.id, id);
    }

    // ==================== PROMO CODE VALIDATION ====================

    @Post('promo-codes/validate')
    @ApiOperation({ summary: 'Validate a promo code' })
    async validatePromoCode(@Req() req: any, @Body() dto: ValidatePromoDto) {
        return this.vendorService.validatePromoCode(req.user.id, dto);
    }

    // ==================== VENDOR BOOKING CREATION ====================

    @Post('bookings/create')
    @ApiOperation({ summary: 'Create a booking on behalf of a customer' })
    async createBookingForCustomer(@Req() req: any, @Body() dto: CreateVendorBookingDto) {
        return this.vendorService.createBookingForCustomer(req.user.id, dto);
    }

    @Get('bookings/:id')
    @ApiOperation({ summary: 'Get a single booking by ID (vendor ownership check)' })
    async getBookingById(@Req() req: any, @Param('id') bookingId: string) {
        return this.vendorService.getVendorBookingById(req.user.id, bookingId);
    }

    @Patch('bookings/:id')
    @ApiOperation({ summary: 'Edit a booking (PENDING, PENDING_APPROVAL, or CONFIRMED)' })
    async updateBooking(@Req() req: any, @Param('id') bookingId: string, @Body() dto: UpdateVendorBookingDto) {
        return this.vendorService.updateVendorBooking(req.user.id, bookingId, dto);
    }

    // ==================== PAYMENTS ====================

    @Post('payments/bulk-collect')
    @ApiOperation({ summary: 'Bulk collect cash payments' })
    async bulkCollectPayments(@Req() req: any, @Body() dto: BulkCollectPaymentDto) {
        return this.vendorService.bulkCollectPayments(req.user.id, dto.bookingIds, {
            receiptNumber: dto.receiptNumber,
            notes: dto.notes,
        });
    }

    @Get('payments/:bookingId/logs')
    @ApiOperation({ summary: 'Get payment audit logs for a booking' })
    async getPaymentLogs(@Req() req: any, @Param('bookingId') bookingId: string) {
        return this.vendorService.getPaymentLogs(req.user.id, bookingId);
    }

    @Patch('payments/:bookingId/collect')
    @ApiOperation({ summary: 'Mark a cash payment as collected' })
    async collectPayment(@Req() req: any, @Param('bookingId') bookingId: string, @Body() dto: CollectPaymentDto) {
        return this.vendorService.collectPayment(req.user.id, bookingId, {
            receiptNumber: dto.receiptNumber,
            notes: dto.notes,
        });
    }

    // ==================== SIGNATORIES ====================

    @Post('profile/signatories')
    @ApiOperation({ summary: 'Add an authorized signatory' })
    async addSignatory(@Req() req: any, @Body() dto: CreateAuthorizedSignatoryDto) {
        return this.vendorService.addSignatory(req.user.id, dto);
    }

    @Patch('profile/signatories/:id')
    @ApiOperation({ summary: 'Update an authorized signatory' })
    async updateSignatory(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSignatoryDto) {
        return this.vendorService.updateSignatory(req.user.id, id, dto);
    }

    @Delete('profile/signatories/:id')
    @ApiOperation({ summary: 'Delete an authorized signatory' })
    async deleteSignatory(@Req() req: any, @Param('id') id: string) {
        return this.vendorService.deleteSignatory(req.user.id, id);
    }

    // ==================== COMPANY CONTACTS ====================

    @Post('profile/company-contacts')
    @ApiOperation({ summary: 'Add a company contact' })
    async addCompanyContact(@Req() req: any, @Body() dto: CreateCompanyContactDto) {
        return this.vendorService.addCompanyContact(req.user.id, dto);
    }

    @Patch('profile/company-contacts/:id')
    @ApiOperation({ summary: 'Update a company contact' })
    async updateCompanyContact(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCompanyContactDto) {
        return this.vendorService.updateCompanyContact(req.user.id, id, dto);
    }

    @Delete('profile/company-contacts/:id')
    @ApiOperation({ summary: 'Delete a company contact' })
    async deleteCompanyContact(@Req() req: any, @Param('id') id: string) {
        return this.vendorService.deleteCompanyContact(req.user.id, id);
    }

    // ==================== DEPARTMENT CONTACTS ====================

    @Post('profile/department-contacts')
    @ApiOperation({ summary: 'Add a department contact' })
    async addDepartmentContact(@Req() req: any, @Body() dto: CreateDepartmentContactDto) {
        return this.vendorService.addDepartmentContact(req.user.id, dto);
    }

    @Patch('profile/department-contacts/:id')
    @ApiOperation({ summary: 'Update a department contact' })
    async updateDepartmentContact(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDepartmentContactDto) {
        return this.vendorService.updateDepartmentContact(req.user.id, id, dto);
    }

    @Delete('profile/department-contacts/:id')
    @ApiOperation({ summary: 'Delete a department contact' })
    async deleteDepartmentContact(@Req() req: any, @Param('id') id: string) {
        return this.vendorService.deleteDepartmentContact(req.user.id, id);
    }

    // ==================== BANKING INFO ====================

    @Post('profile/banking-info')
    @ApiOperation({ summary: 'Add banking info' })
    async addBankingInfo(@Req() req: any, @Body() dto: CreateBankingInfoDto) {
        return this.vendorService.addBankingInfo(req.user.id, dto);
    }

    @Patch('profile/banking-info/:id')
    @ApiOperation({ summary: 'Update banking info' })
    async updateBankingInfo(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBankingInfoDto) {
        return this.vendorService.updateBankingInfo(req.user.id, id, dto);
    }

    @Delete('profile/banking-info/:id')
    @ApiOperation({ summary: 'Delete banking info' })
    async deleteBankingInfo(@Req() req: any, @Param('id') id: string) {
        return this.vendorService.deleteBankingInfo(req.user.id, id);
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
