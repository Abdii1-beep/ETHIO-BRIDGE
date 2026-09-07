import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ApiError } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { randomDigits } from './otp.util';

export type OtpPurpose = 'REGISTER_EMAIL' | 'INVITE_CLAIM';

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates an OTP for a user, stores only its hash, and returns the plain code so the
   * transport layer can deliver it. Never persists the plain code (SDD §110).
   */
  async generateForUser(
    userId: string,
    purpose: OtpPurpose,
    target: string,
    channel: 'EMAIL' | 'PHONE' = 'EMAIL',
  ): Promise<string> {
    const code = randomDigits(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.otpCode.create({
      data: {
        userId,
        purpose,
        channel,
        target,
        codeHash: this.hash(code),
        expiresAt,
      },
    });
    return code;
  }

  async verifyForUser(
    userId: string,
    purpose: OtpPurpose,
    code: string,
    target: string,
  ): Promise<boolean> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { userId, purpose, target, consumedAt: null, verifiedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new ApiError('INVALID_OTP', 'Invalid or missing verification code.', 400);
    }
    if (otp.expiresAt < new Date()) {
      throw new ApiError('OTP_EXPIRED', 'This verification code has expired.', 400);
    }
    if (otp.attempts >= otp.maxAttempts) {
      throw new ApiError('OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect attempts. Request a new code.', 400);
    }

    if (otp.codeHash !== this.hash(code)) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 },
      });
      throw new ApiError('INVALID_OTP', 'Incorrect verification code.', 400);
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date(), verifiedAt: new Date() },
    });
    return true;
  }

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}