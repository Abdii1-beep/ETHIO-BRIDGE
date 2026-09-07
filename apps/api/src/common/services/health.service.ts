import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { otpRuntime } from '../../auth/otp-transport';

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private readonly redis: Redis | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const url = this.config.get<string>('REDIS_URL');
    if (url) {
      this.redis = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        reconnectOnError: () => false,
        enableOfflineQueue: false,
      });
      this.redis.on('error', () => {});
    } else {
      this.redis = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
    }
  }

  async check(): Promise<Record<string, unknown>> {
    const db = await this.checkDb();
    const redis = await this.checkRedis();
    const otp: Record<string, unknown> = {
      transport: otpRuntime.kind,
      smtpConfigured: otpRuntime.smtpConfigured,
      ethereal: otpRuntime.ethereal ? { configured: true, previewUrl: otpRuntime.ethereal.previewUrl } : { configured: false },
      ...(otpRuntime.bootError ? { bootError: otpRuntime.bootError } : {}),
    };
    return {
      status: db === 'up' && redis !== 'down' ? 'ok' : 'degraded',
      db,
      redis,
      otp,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDb(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<'up' | 'down' | 'disabled'> {
    if (!this.redis) {
      return 'disabled';
    }
    try {
      if (this.redis.status === 'wait' || this.redis.status === 'end') {
        await this.redis.connect();
      }
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch (e) {
      this.logger.debug(`Redis unavailable: ${(e as Error).message}`);
      return 'down';
    }
  }
}