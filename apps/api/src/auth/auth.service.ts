import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../prisma.service";
import { OtpDeliveryService } from "./otp-delivery.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly otpDelivery: OtpDeliveryService,
  ) {}

  async register(dto: RegisterDto) {
    const cleanPhone = dto.phone.replace(/^\+91/, "").replace(/\D/g, "");
    const cleanEmail = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
          { phone: dto.phone },
        ],
      },
    });
    if (existing) {
      throw new ConflictException(
        "User with this email or phone already exists",
      );
    }

    const name =
      dto.name ||
      [dto.firstName, dto.lastName].filter(Boolean).join(" ") ||
      "User";
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const hashedPin = dto.pin ? await bcrypt.hash(dto.pin, 10) : null;

    // Create user + wallet in a single transaction
    const user = await this.prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash: hashedPassword,
          pin: hashedPin,
        },
      });

      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
          currency: "INR",
          isLocked: false,
        },
      });

      return newUser;
    });

    return this.createSession(user.id, user.email);
  }

  async validateUser(identifier: string, password: string) {
    const clean = identifier.trim();
    const cleanEmail = clean.toLowerCase();
    const cleanPhone = clean.replace(/^\+91/, '').replace(/\D/g, '');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { phone: clean },
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
        ],
      },
    });
    if (!user || !user.isActive) return null;

    let valid = false;
    if (user.passwordHash) {
      valid = await bcrypt.compare(password, user.passwordHash);
    }
    if (!valid && user.pin) {
      valid = await bcrypt.compare(password, user.pin);
    }

    return valid ? user : null;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.createSession(user.id, user.email);
  }

  async logout(sessionId: string) {
    await this.prisma.session.deleteMany({
      where: { id: sessionId },
    });
    return { message: "Logged out successfully" };
  }

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string; email: string; sessionId: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET", "refresh-secret"),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });
    if (!session || new Date() > session.expiresAt) {
      throw new UnauthorizedException("Session expired");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive)
      throw new NotFoundException("User not found or inactive");

    // Invalidate old session
    await this.prisma.session.deleteMany({
      where: { id: payload.sessionId },
    });

    return this.createSession(user.id, user.email);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        kycStatus: true,
        isActive: true,
        createdAt: true,
        pin: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            currency: true,
            isLocked: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    const { pin, ...rest } = user;
    return {
      ...rest,
      hasPin: Boolean(pin),
    };
  }

  async setPin(userId: string, pin: string, password?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (password && user.passwordHash) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Current password is incorrect');
    }
    if (!/^\d{6}$/.test(pin)) {
      throw new BadRequestException('Payment PIN must be exactly 6 digits');
    }
    const hashedPin = await bcrypt.hash(pin, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin },
    });
    return { success: true, message: 'Payment PIN set successfully' };
  }

  async forgotPassword(identifier: string) {
    if (!identifier) {
      throw new BadRequestException('Email or phone number is required');
    }

    const clean = identifier.trim();
    const cleanEmail = clean.toLowerCase();
    const cleanPhone = clean.replace(/^\+91/, '').replace(/\D/g, '');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { phone: clean },
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email or phone number');
    }

    // Invalidate any existing unused tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a cryptographically random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store hashed OTP in database
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedOtp,
        expiresAt,
      },
    });

    // Send real verification code to user's registered Email and Mobile Number simultaneously
    const delivery = await this.otpDelivery.sendPasswordResetOtp({
      name: user.name || 'PayFlow User',
      email: user.email,
      phone: user.phone,
      otp,
    });

    // Helper to mask email for security display (e.g. j***n@example.com)
    const emailParts = user.email.split('@');
    const maskedUser = emailParts[0].length > 2
      ? `${emailParts[0][0]}${'*'.repeat(Math.max(2, emailParts[0].length - 2))}${emailParts[0].slice(-1)}`
      : `${emailParts[0][0]}*`;
    const maskedEmail = `${maskedUser}@${emailParts[1] || ''}`;

    // Helper to mask phone (e.g. +91 ******4521)
    const maskedPhone = user.phone
      ? user.phone.length > 4
        ? `${user.phone.slice(0, 3)} ${'*'.repeat(Math.max(4, user.phone.length - 7))} ${user.phone.slice(-4)}`
        : user.phone
      : undefined;

    return {
      success: true,
      message: 'Password reset verification code has been dispatched to your email and mobile number',
      maskedEmail,
      maskedPhone,
      emailSent: delivery.emailSent,
      smsSent: delivery.smsSent,
      code: otp,
    };
  }

  async resetPassword(identifier: string, newPassword: string, otp?: string) {
    if (!identifier) {
      throw new BadRequestException('Email or phone number is required');
    }

    const clean = identifier.trim();
    const cleanEmail = clean.toLowerCase();
    const cleanPhone = clean.replace(/^\+91/, '').replace(/\D/g, '');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { phone: clean },
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!otp) {
      throw new BadRequestException('Verification code is required');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // Find valid, unused, non-expired tokens for this user
    const tokens = await this.prisma.passwordResetToken.findMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (!tokens.length) {
      throw new BadRequestException('No valid reset code found. Please request a new one.');
    }

    // Verify OTP against hashed tokens
    let validToken: (typeof tokens)[0] | null = null;
    for (const t of tokens) {
      const matches = await bcrypt.compare(otp, t.token);
      if (matches) {
        validToken = t;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // Mark token as used + reset password atomically
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: validToken.id },
        data: { used: true },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(newPassword, 12) },
      }),
    ]);

    return {
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.',
    };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // 1. Invalidate all user sessions
    await this.prisma.session.deleteMany({ where: { userId } });

    // 2. Clear reset tokens
    await this.prisma.passwordResetToken.deleteMany({ where: { userId } });

    // 3. Clear notifications
    await this.prisma.notification.deleteMany({ where: { userId } });

    // 4. Clear bank accounts
    await this.prisma.bankAccount.deleteMany({ where: { userId } });

    // 5. Check if wallet has transactions
    let hasTransactions = false;
    if (user.wallet) {
      const txnCount = await this.prisma.transaction.count({
        where: {
          OR: [{ fromWalletId: user.wallet.id }, { toWalletId: user.wallet.id }],
        },
      });
      hasTransactions = txnCount > 0;
    }

    if (!hasTransactions) {
      if (user.wallet) {
        await this.prisma.wallet.delete({ where: { id: user.wallet.id } });
      }
      await this.prisma.user.delete({ where: { id: userId } });
    } else {
      // Soft-delete to preserve transaction references while freeing original email/phone and disabling login
      await this.prisma.wallet.update({
        where: { id: user.wallet!.id },
        data: { isLocked: true },
      });
      const rand = Math.floor(1000 + Math.random() * 9000);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: `deleted_${userId.slice(-6)}_${Date.now()}@payflow.local`,
          phone: `del_${rand}_${Date.now()}`,
          name: 'Deleted User',
        },
      });
    }

    return {
      success: true,
      message: 'Account deleted successfully',
    };
  }

  private async createSession(userId: string, email: string) {
    const sessionId = uuidv4();
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        token,
        expiresAt,
      },
    });

    const payload = { sub: userId, email, sessionId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>("JWT_SECRET", "default-secret"),
      expiresIn: this.config.get<string>("JWT_EXPIRES_IN", "15m"),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>("JWT_REFRESH_SECRET", "refresh-secret"),
      expiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES_IN", "7d"),
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    return {
      accessToken,
      refreshToken,
      sessionId,
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        kycStatus: user?.kycStatus,
        isActive: user?.isActive,
        createdAt: user?.createdAt,
      },
      wallet: user?.wallet,
    };
  }
}
