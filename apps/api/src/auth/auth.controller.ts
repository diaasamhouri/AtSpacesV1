import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  EmailSignupDto,
  PhoneSignupDto,
  EmailLoginDto,
  SendOtpDto,
  VerifyOtpDto,
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
  ) {}

  // ==================== EMAIL AUTH ====================

  @Post('signup/email')
  @ApiOperation({ summary: 'Sign up with email and password' })
  async signupEmail(@Body() dto: EmailSignupDto) {
    return this.authService.signupWithEmail(dto);
  }

  @Post('login/email')
  @ApiOperation({ summary: 'Login with email and password' })
  async loginEmail(@Body() dto: EmailLoginDto) {
    return this.authService.loginWithEmail(dto);
  }

  // ==================== PHONE OTP ====================

  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP code to phone number' })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

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

  // ==================== PROTECTED ROUTES ====================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  // ==================== VENDOR REGISTRATION ====================

  @Post('become-vendor')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register as a vendor (requires login)' })
  async becomeVendor(
    @Req() req: any,
    @Body() body: { companyName: string; description?: string },
  ) {
    return this.authService.registerVendor(req.user.id, body);
  }
}
