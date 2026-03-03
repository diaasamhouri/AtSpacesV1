import { Controller, Get, Post, Param, Patch, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, RequireSection, AdminSection } from '../auth/decorators/roles.decorator';
import { Role, BookingStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import {
    UpdateVendorStatusDto,
    CreateTeamUserDto,
    AdminVendorsQueryDto,
    AdminUsersQueryDto,
    AdminBookingsQueryDto,
    AdminPaymentsQueryDto,
    AdminBranchesQueryDto,
    AdminApprovalsQueryDto,
    VerifyVendorDto,
    SendNotificationDto,
    UpdateSystemSettingsDto,
} from './dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR, Role.ACCOUNTANT)
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // ==================== DASHBOARD ====================

    @Get('stats')
    @RequireSection(AdminSection.DASHBOARD)
    @ApiOperation({ summary: 'Get platform-wide statistics' })
    async getSystemStats() {
        return this.adminService.getSystemStats();
    }

    // ==================== VENDORS ====================

    @Get('vendors')
    @RequireSection(AdminSection.VENDORS)
    @ApiOperation({ summary: 'List all vendors' })
    async listVendors(@Query() query: AdminVendorsQueryDto) {
        return this.adminService.listVendors(query);
    }

    @Get('vendors/:id')
    @RequireSection(AdminSection.VENDORS)
    @ApiOperation({ summary: 'Get vendor by ID' })
    async getVendorById(@Param('id') id: string) {
        return this.adminService.getVendorById(id);
    }

    @Patch('vendors/:id/status')
    @RequireSection(AdminSection.VENDORS)
    @ApiOperation({ summary: 'Update a vendor status' })
    async updateVendorStatus(
        @Param('id') id: string,
        @Body() dto: UpdateVendorStatusDto,
    ) {
        return this.adminService.updateVendorStatus(id, dto.status, dto.reason);
    }

    // ==================== USERS ====================

    @Patch('vendors/:id/verify')
    @RequireSection(AdminSection.VENDORS)
    @ApiOperation({ summary: 'Toggle vendor verified badge' })
    async verifyVendor(
        @Param('id') id: string,
        @Body() dto: VerifyVendorDto,
    ) {
        return this.adminService.verifyVendor(id, dto.verified, dto.note);
    }


    @Get('users')
    @RequireSection(AdminSection.USERS)
    @ApiOperation({ summary: 'List all users' })
    async listUsers(@Query() query: AdminUsersQueryDto) {
        return this.adminService.listUsers(query);
    }

    @Post('users')
    @Roles(Role.ADMIN) // Only super-admin can create team users
    @RequireSection(AdminSection.USERS)
    @ApiOperation({ summary: 'Create a team user (MODERATOR or ACCOUNTANT)' })
    async createTeamUser(@Body() dto: CreateTeamUserDto) {
        return this.adminService.createTeamUser(dto);
    }

    @Patch('users/:id/toggle-active')
    @Roles(Role.ADMIN)
    @RequireSection(AdminSection.USERS)
    @ApiOperation({ summary: 'Enable or disable a user account' })
    async toggleUserActive(@Param('id') id: string) {
        return this.adminService.toggleUserActive(id);
    }

    // ==================== BOOKINGS ====================

    @Get('bookings')
    @RequireSection(AdminSection.BOOKINGS)
    @ApiOperation({ summary: 'List all bookings' })
    async listBookings(@Query() query: AdminBookingsQueryDto) {
        return this.adminService.listBookings(query);
    }

    @Get('bookings/:id')
    @RequireSection(AdminSection.BOOKINGS)
    @ApiOperation({ summary: 'Get booking by ID' })
    async getBookingById(@Param('id') id: string) {
        return this.adminService.getBookingById(id);
    }

    @Patch('bookings/:id/status')
    @RequireSection(AdminSection.BOOKINGS)
    @ApiOperation({ summary: 'Update booking status (cancel, no-show)' })
    async updateBookingStatus(
        @Param('id') id: string,
        @Body('status') status: BookingStatus,
    ) {
        return this.adminService.updateBookingStatus(id, status);
    }

    // ==================== PAYMENTS ====================

    @Get('payments')
    @RequireSection(AdminSection.PAYMENTS)
    @ApiOperation({ summary: 'List all payments' })
    async listPayments(@Query() query: AdminPaymentsQueryDto) {
        return this.adminService.listPayments(query);
    }

    @Patch('payments/:id/refund')
    @RequireSection(AdminSection.PAYMENTS)
    @ApiOperation({ summary: 'Refund a completed payment' })
    async refundPayment(@Param('id') id: string) {
        return this.adminService.refundPayment(id);
    }

    // ==================== BRANCHES ====================

    @Get('branches')
    @RequireSection(AdminSection.BRANCHES)
    @ApiOperation({ summary: 'List all branches' })
    async listBranches(@Query() query: AdminBranchesQueryDto) {
        return this.adminService.listBranches(query);
    }

    @Get('branches/:id')
    @RequireSection(AdminSection.BRANCHES)
    @ApiOperation({ summary: 'Get branch by ID' })
    async getBranchById(@Param('id') id: string) {
        return this.adminService.getBranchById(id);
    }

    @Patch('branches/:id/status')
    @RequireSection(AdminSection.BRANCHES)
    @ApiOperation({ summary: 'Update branch status' })
    async updateBranchStatus(
        @Param('id') id: string,
        @Body('status') status: 'ACTIVE' | 'SUSPENDED' | 'UNDER_REVIEW',
    ) {
        return this.adminService.updateBranchStatus(id, status);
    }

    // ==================== APPROVALS ====================

    @Get('approvals')
    @RequireSection(AdminSection.APPROVALS)
    @ApiOperation({ summary: 'List approval requests' })
    async listApprovalRequests(@Query() query: AdminApprovalsQueryDto) {
        return this.adminService.listApprovalRequests(query);
    }

    @Patch('approvals/:id')
    @RequireSection(AdminSection.APPROVALS)
    @ApiOperation({ summary: 'Process an approval request' })
    async processApproval(
        @Param('id') id: string,
        @Body('status') status: 'APPROVED' | 'REJECTED',
        @Body('reason') reason?: string,
        @Req() req?: any,
    ) {
        return this.adminService.processApproval(id, status, reason, req?.user?.id);
    }

    // ==================== NOTIFICATIONS ====================

    @Get('notifications')
    @RequireSection(AdminSection.NOTIFICATIONS)
    @ApiOperation({ summary: 'List recent notifications' })
    async listNotifications() {
        return this.adminService.listNotifications();
    }

    @Post('notifications/send')
    @RequireSection(AdminSection.NOTIFICATIONS)
    @ApiOperation({ summary: 'Send a notification' })
    async sendNotification(
        @Body() dto: SendNotificationDto,
    ) {
        return this.adminService.sendNotification(dto);
    }

    // ==================== ANALYTICS ====================

    @Get('analytics/revenue')
    @RequireSection(AdminSection.ANALYTICS)
    @ApiOperation({ summary: 'Revenue analytics' })
    async getRevenueAnalytics() {
        return this.adminService.getRevenueAnalytics();
    }

    @Get('analytics/bookings')
    @RequireSection(AdminSection.ANALYTICS)
    @ApiOperation({ summary: 'Booking analytics' })
    async getBookingAnalytics() {
        return this.adminService.getBookingAnalytics();
    }

    @Get('analytics/users')
    @RequireSection(AdminSection.ANALYTICS)
    @ApiOperation({ summary: 'User growth analytics' })
    async getUserGrowthAnalytics() {
        return this.adminService.getUserGrowthAnalytics();
    }

    // ==================== SYSTEM SETTINGS ====================

    @Get('settings')
    @RequireSection(AdminSection.DASHBOARD)
    @ApiOperation({ summary: 'Get system settings' })
    async getSystemSettings() {
        return this.adminService.getSystemSettings();
    }

    @Patch('settings')
    @RequireSection(AdminSection.DASHBOARD)
    @ApiOperation({ summary: 'Update system settings' })
    async updateSystemSettings(@Req() req: any, @Body() dto: UpdateSystemSettingsDto) {
        return this.adminService.updateSystemSettings(req.user.id, dto.settings);
    }

    // ==================== VENDOR COMMISSIONS ====================

    @Patch('vendors/:id/commission')
    @RequireSection(AdminSection.VENDORS)
    @ApiOperation({ summary: 'Update custom vendor commission rate' })
    async updateVendorCommission(
        @Req() req: any,
        @Param('id') vendorId: string,
        @Body('commissionRate') commissionRate: number | null,
    ) {
        return this.adminService.updateVendorCommission(req.user.id, vendorId, commissionRate);
    }

    // ==================== EXPORTS ====================

    @Get('export/revenue')
    @RequireSection(AdminSection.ANALYTICS)
    @ApiOperation({ summary: 'Export revenue to CSV' })
    async exportRevenueCSV() {
        const csv = await this.adminService.exportRevenueCSV();
        return { data: csv };
    }
}
