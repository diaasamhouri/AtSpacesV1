import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  EmailSignupDto,
  PhoneSignupDto,
  EmailLoginDto,
  SendOtpDto,
  VerifyOtpDto,
  UpdateProfileDto,
  BecomeVendorDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) { }

  // ==================== EMAIL AUTH ====================

  @Post('signup/email')
  @ApiOperation({ summary: 'Sign up with email and password' })
  async signupEmail(@Body() dto: EmailSignupDto) {
    return this.authService.signupWithEmail(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login/email')
  @ApiOperation({ summary: 'Login with email and password' })
  async loginEmail(@Body() dto: EmailLoginDto) {
    return this.authService.loginWithEmail(dto);
  }

  // ==================== PHONE OTP ====================

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP code to phone number' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP code and login/signup' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  // ==================== GOOGLE OAUTH ====================

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleLogin() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.handleGoogleLogin(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }

  // ==================== PASSWORD RESET ====================

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset OTP' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with OTP code' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ==================== PROTECTED ROUTES ====================

  @Get('notifications/unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadNotificationCount(@Req() req: any) {
    return this.authService.getUnreadNotificationCount(req.user.id);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated notifications for current user' })
  async getNotifications(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.authService.getNotifications(req.user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('notifications/read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllNotificationsRead(@Req() req: any) {
    return this.authService.markAllNotificationsRead(req.user.id);
  }

  @Patch('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markNotificationRead(@Req() req: any, @Param('id') id: string) {
    return this.authService.markNotificationRead(req.user.id, id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  // ==================== VENDOR REGISTRATION ====================

  @Post('become-vendor')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register as a vendor (requires login)' })
  async becomeVendor(
    @Req() req: any,
    @Body() dto: BecomeVendorDto,
  ) {
    return this.authService.registerVendor(req.user.id, dto);
  }
}
