import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import {
  EmailSignupDto,
  PhoneSignupDto,
  EmailLoginDto,
  SendOtpDto,
  VerifyOtpDto,
} from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ==================== EMAIL AUTH ====================

  async signupWithEmail(dto: EmailSignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: Role.CUSTOMER,
      },
    });

    return this.generateTokenResponse(user);
  }

  async loginWithEmail(dto: EmailLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses a different login method',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is suspended');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokenResponse(user);
  }

  // ==================== PHONE OTP AUTH ====================

  async sendOtp(dto: SendOtpDto) {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Find existing user or null
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    // Store OTP in database
    await this.prisma.otpCode.create({
      data: {
        phone: dto.phone,
        code,
        expiresAt,
        userId: existingUser?.id,
      },
    });

    // TODO: Send OTP via Twilio SMS
    // For development, log the OTP
    this.logger.log(`OTP for ${dto.phone}: ${code}`);

    return {
      message: 'OTP sent successfully',
      // Only include in development
      ...(process.env.NODE_ENV !== 'production' && { code }),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone: dto.phone,
        code: dto.code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    if (otpRecord.attempts >= 5) {
      throw new BadRequestException(
        'Too many attempts. Please request a new OTP',
      );
    }

    // Mark OTP as verified
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          role: Role.CUSTOMER,
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is suspended');
    }

    return this.generateTokenResponse(user);
  }

  // ==================== GOOGLE OAUTH ====================

  async handleGoogleLogin(googleUser: {
    providerAccountId: string;
    email: string;
    name: string;
    image: string;
    accessToken: string;
    refreshToken: string;
  }) {
    // Check if account link exists
    const existingAccount = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleUser.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      if (!existingAccount.user.isActive) {
        throw new UnauthorizedException('Account is suspended');
      }
      return this.generateTokenResponse(existingAccount.user);
    }

    // Check if user exists with this email
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      // Link Google account to existing user
      await this.prisma.account.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: googleUser.providerAccountId,
          accessToken: googleUser.accessToken,
          refreshToken: googleUser.refreshToken,
        },
      });
    } else {
      // Create new user with Google account
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.image,
          emailVerified: new Date(),
          role: Role.CUSTOMER,
          accounts: {
            create: {
              provider: 'google',
              providerAccountId: googleUser.providerAccountId,
              accessToken: googleUser.accessToken,
              refreshToken: googleUser.refreshToken,
            },
          },
        },
      });
    }

    return this.generateTokenResponse(user);
  }

  // ==================== VENDOR REGISTRATION ====================

  async registerVendor(
    userId: string,
    data: { companyName: string; description?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vendorProfile: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.vendorProfile) {
      throw new ConflictException('Vendor profile already exists');
    }

    const vendorProfile = await this.prisma.$transaction(async (tx) => {
      // Update user role to VENDOR
      await tx.user.update({
        where: { id: userId },
        data: { role: Role.VENDOR },
      });

      // Create vendor profile
      return tx.vendorProfile.create({
        data: {
          userId,
          companyName: data.companyName,
          description: data.description,
        },
      });
    });

    return vendorProfile;
  }

  // ==================== HELPERS ====================

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        vendorProfile: {
          select: {
            id: true,
            companyName: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  private generateTokenResponse(user: {
    id: string;
    email?: string | null;
    role: Role;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
