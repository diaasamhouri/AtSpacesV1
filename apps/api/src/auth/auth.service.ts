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
  BecomeVendorDto,
} from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

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
    data: BecomeVendorDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vendorProfile: { select: { id: true, status: true } } },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.vendorProfile) {
      if (user.vendorProfile.status === 'REJECTED') {
        // Allow re-apply: delete old profile and its approval requests
        await this.prisma.$transaction([
          this.prisma.approvalRequest.deleteMany({
            where: { vendorProfileId: user.vendorProfile.id },
          }),
          this.prisma.vendorProfile.delete({
            where: { id: user.vendorProfile.id },
          }),
        ]);
      } else {
        throw new ConflictException('Vendor profile already exists');
      }
    }

    const vendorProfile = await this.prisma.$transaction(async (tx) => {
      // Update user role to VENDOR
      await tx.user.update({
        where: { id: userId },
        data: { role: Role.VENDOR },
      });

      // Create vendor profile with expanded fields
      const vp = await tx.vendorProfile.create({
        data: {
          userId,
          companyName: data.companyName,
          description: data.description,
          phone: data.phone,
          website: data.website,
          images: data.images || [],
          agreedToTermsAt: data.agreedToTermsAt ? new Date(data.agreedToTermsAt) : null,
          companyLegalName: data.companyLegalName,
          companyShortName: data.companyShortName,
          companyTradeName: data.companyTradeName,
          companyNationalId: data.companyNationalId,
          companyRegistrationNumber: data.companyRegistrationNumber,
          companyRegistrationDate: data.companyRegistrationDate ? new Date(data.companyRegistrationDate) : null,
          companySalesTaxNumber: data.companySalesTaxNumber,
          registeredInCountry: data.registeredInCountry,
          hasTaxExemption: data.hasTaxExemption ?? false,
          companyDescription: data.companyDescription,
        },
      });

      // Create authorized signatories
      if (data.authorizedSignatories?.length) {
        await tx.authorizedSignatory.createMany({
          data: data.authorizedSignatories.map((s) => ({
            vendorProfileId: vp.id,
            fullName: s.fullName,
            nationality: s.nationality,
            legalDocType: s.legalDocType,
            legalDocNumber: s.legalDocNumber,
            mobile: s.mobile,
            email: s.email,
            gender: s.gender,
          })),
        });
      }

      // Create company contacts
      if (data.companyContacts?.length) {
        await tx.companyContact.createMany({
          data: data.companyContacts.map((c) => ({
            vendorProfileId: vp.id,
            contactPersonName: c.contactPersonName,
            mobile: c.mobile,
            email: c.email,
            website: c.website,
            phone: c.phone,
            fax: c.fax,
          })),
        });
      }

      // Create department contacts (optional)
      if (data.departmentContacts?.length) {
        await tx.departmentContact.createMany({
          data: data.departmentContacts.map((d) => ({
            vendorProfileId: vp.id,
            department: d.department,
            contactName: d.contactName,
            mobile: d.mobile,
            phone: d.phone,
            email: d.email,
            fax: d.fax,
          })),
        });
      }

      // Create banking info
      if (data.bankingInfo?.length) {
        await tx.bankingInfo.createMany({
          data: data.bankingInfo.map((b) => ({
            vendorProfileId: vp.id,
            bankName: b.bankName,
            bankBranch: b.bankBranch,
            accountNumber: b.accountNumber,
            iban: b.iban,
            swiftCode: b.swiftCode,
            accountantManagerName: b.accountantManagerName,
            cliq: b.cliq,
          })),
        });
      }

      // Create approval request so it appears in admin approvals queue
      await tx.approvalRequest.create({
        data: {
          vendorProfileId: vp.id,
          type: 'VENDOR_REGISTRATION',
          description: `New vendor registration: ${data.companyName}`,
          status: 'PENDING',
        },
      });

      return vp;
    });

    // Notify all admins about the new vendor application
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });
    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: 'APPROVAL_REQUEST' as const,
          title: 'New Vendor Application',
          message: `${data.companyName} has submitted a vendor application and is awaiting approval.`,
          data: { vendorProfileId: vendorProfile.id },
        })),
      });
    }

    return vendorProfile;
  }

  // ==================== PASSWORD RESET ====================

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return generic message to not leak user existence
    if (!user) {
      return { message: 'If an account with that email exists, a reset code has been sent.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.prisma.otpCode.create({
      data: {
        phone: email, // Reuse phone field for email-based OTP
        code,
        expiresAt,
        userId: user.id,
      },
    });

    // Log code to console (no email service yet)
    this.logger.log(`Password reset OTP for ${email}: ${code}`);

    return {
      message: 'If an account with that email exists, a reset code has been sent.',
      ...(process.env.NODE_ENV !== 'production' && { code }),
    };
  }

  async resetPassword(dto: { email: string; code: string; newPassword: string }) {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone: dto.email, // We stored email in phone field
        code: dto.code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Mark OTP as verified
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Update password
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Password has been reset successfully.' };
  }

  // ==================== NOTIFICATIONS ====================

  async getUnreadNotificationCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async getNotifications(userId: string, query: { page?: number; limit?: number } = {}) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = { userId };
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: notifications,
      meta: { page, limit, total, totalPages },
    };
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) {
      throw new BadRequestException('Notification not found');
    }
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
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
            rejectionReason: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { name?: string; image?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.image !== undefined && { image: data.image }),
      },
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
