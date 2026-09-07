import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ApiError, UnauthorizedError } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { randomToken, sha256 } from './otp.util';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  platformRole?: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async issueAccessToken(user: {
    id: string;
    email: string;
    name: string;
    platformRole?: string | null;
  }): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      platformRole: user.platformRole ?? null,
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.config.get<string>('JWT_ACCESS_TTL') ?? '15m') as JwtSignOptions['expiresIn'],
    });
  }

  async issueRefreshToken(userId: string): Promise<string> {
    const raw = randomToken(48);
    const ttlDays = Number(this.config.get<string>('JWT_REFRESH_TTL_DAYS') ?? 30);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
      },
    });
    return raw;
  }

  async issueTokenPair(
    user: { id: string; email: string; name: string; platformRole?: string | null },
  ): Promise<TokenPair> {
    const accessToken = await this.issueAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id);
    const expiresInSeconds = this.parseTtlSeconds(this.config.get<string>('JWT_ACCESS_TTL') ?? '15m');
    return { accessToken, refreshToken, expiresInSeconds };
  }

  async rotateRefreshToken(rawRefreshToken: string): Promise<TokenPair> {
    const hashed = sha256(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hashed } });

    if (!stored || stored.revokedAt) {
      throw new UnauthorizedError('Invalid or revoked refresh token.');
    }
    if (stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Refresh token has expired.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) {
      throw new ApiError('ACCOUNT_DISABLED', 'This account is disabled.', 403);
    }

    const rawNew = randomToken(48);
    const accessToken = await this.issueAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.id);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedById: refreshToken },
    });

    const expiresInSeconds = this.parseTtlSeconds(this.config.get<string>('JWT_ACCESS_TTL') ?? '15m');
    return { accessToken, refreshToken, expiresInSeconds };
  }

  async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    const hashed = sha256(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashed, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private parseTtlSeconds(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) {
      return 900;
    }
    const value = Number(match[1]);
    switch (match[2]) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }
}