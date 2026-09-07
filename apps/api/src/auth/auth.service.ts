import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { OtpService } from './otp.service';
import { OTP_TRANSPORT, OtpTransport } from './otp-transport';
import { TokensService, TokenPair } from './tokens.service';
import { AuditService } from '../audit/audit.service';
import {
  ApiError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../common/errors';
import { AUDIT_ACTIONS } from '../shared';
import {
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
  ResendOtpDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly otp: OtpService,
    private readonly tokens: TokensService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    @Inject(OTP_TRANSPORT) private readonly otpTransport: OtpTransport,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ userId: string; devOtpCode?: string } | (TokenPair & { user: unknown })> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await this.password.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        passwordHash,
        preferredLanguage: dto.preferredLanguage ?? 'en',
        // OTP phase (OTP_REQUIRED="true"): the account starts unverified and email
        // confirmation is mandatory. Until then, registration signs the user in directly.
        isEmailVerified: !this.isOtpRequired(),
      },
    });

    await this.audit.record({ action: AUDIT_ACTIONS.REGISTER, userId: user.id });

    if (this.isOtpRequired()) {
      const code = await this.otp.generateForUser(user.id, 'REGISTER_EMAIL', user.email);
      await this.deliverOtp('REGISTER_EMAIL', user.email, code);
      return { userId: user.id, ...(this.devOtp(code) as object) };
    }

    await this.recordLoginAttempt(user.email, user.id, true, undefined);
    const pair = await this.tokens.issueTokenPair(user);
    return { ...pair, user: this.publicUser(user) };
  }

  async verifyEmail(dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new NotFoundError('No account found for this email.');
    }
    await this.otp.verifyForUser(user.id, 'REGISTER_EMAIL', dto.code, user.email);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });
    return { verified: true };
  }

  async resendOtp(dto: ResendOtpDto): Promise<{ sent: boolean; devOtpCode?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new NotFoundError('No account found for this email.');
    }
    const code = await this.otp.generateForUser(user.id, 'REGISTER_EMAIL', user.email);
    await this.deliverOtp('REGISTER_EMAIL', user.email, code);
    return { sent: true, ...(this.devOtp(code) as object) };
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: unknown }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      await this.recordLoginAttempt(dto.email, null, false, 'no_such_account');
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new ApiError('ACCOUNT_DISABLED', 'This account is disabled.', 403);
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ApiError('ACCOUNT_LOCKED', 'This account is temporarily locked. Try again later.', 403);
    }

    // Check approval status (platform admins bypass this check)
    if (user.approvalStatus !== 'APPROVED' && !user.platformRole) {
      throw new ApiError('ACCOUNT_PENDING_APPROVAL', 'Your account is pending approval from the platform administrator.', 403);
    }

    const ok = await this.password.compare(dto.password, user.passwordHash);
    if (!ok) {
      const failed = user.failedLoginCount + 1;
      const lockedUntil = failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: failed, lockedUntil },
      });
      await this.recordLoginAttempt(dto.email, user.id, false, 'wrong_password');
      throw new UnauthorizedError('Invalid email or password.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.recordLoginAttempt(dto.email, user.id, true, undefined);
    await this.audit.record({ action: AUDIT_ACTIONS.LOGIN, userId: user.id, metadata: { email: user.email } });

    const pair = await this.tokens.issueTokenPair(user);
    return { ...pair, user: this.publicUser(user) };
  }

  async refresh(dto: RefreshDto): Promise<TokenPair> {
    return this.tokens.rotateRefreshToken(dto.refreshToken);
  }

  async logout(dto: LogoutDto): Promise<{ loggedOut: boolean }> {
    await this.tokens.revokeRefreshToken(dto.refreshToken);
    return { loggedOut: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedError();
    }
    const rows = await this.prisma.organizationMember.findMany({
      where: { userId: user.id },
      include: {
        organization: {
          select: { id: true, legalName: true, tradingName: true, verificationLevel: true, status: true },
        },
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  where: { permission: { isActive: true } },
                  include: { permission: { select: { id: true, code: true, category: true, nameKey: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
    const memberships = rows.map((m) => ({
      status: m.status,
      title: m.title,
      organization: m.organization,
      roles: m.roleAssignments.map((ra) => ({
        id: ra.role.id,
        name: ra.role.name,
        code: ra.role.code,
        isBuiltIn: ra.role.isBuiltIn,
        permissions: ra.role.permissions.map((rp) => rp.permission),
      })),
    }));
    return { ...this.publicUser(user), memberships };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.preferredLanguage !== undefined ? { preferredLanguage: dto.preferredLanguage } : {}),
      },
    });
  }

  private async deliverOtp(purpose: string, to: string, code: string): Promise<void> {
    try {
      await this.otpTransport.send({ to, purpose, code });
    } catch (e) {
      const message = (e as Error).message ?? 'unknown';
      this.logger.error(`OTP delivery failed [${purpose}] -> ${to}: ${message}`);
      throw new ApiError(
        'OTP_DELIVERY_FAILED',
        'Could not deliver the verification code. Please try again.',
        502,
      );
    }
  }

  private devOtp(code: string): { devOtpCode?: string } {
    if (process.env.NODE_ENV === 'production') {
      return {};
    }
    return { devOtpCode: code };
  }

  private isOtpRequired(): boolean {
    return this.config.get<string>('OTP_REQUIRED') === 'true';
  }

  private async recordLoginAttempt(
    email: string,
    userId: string | null,
    success: boolean,
    reason?: string,
  ): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: { email, userId, success, reason },
    });
  }

  private publicUser(user: {
    id: string;
    email: string;
    name: string;
    preferredLanguage: string;
    platformRole?: string | null;
    isEmailVerified: boolean;
    isPhoneVerified?: boolean;
  }): Record<string, unknown> {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
      platformRole: user.platformRole ?? null,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified ?? false,
    };
  }
}