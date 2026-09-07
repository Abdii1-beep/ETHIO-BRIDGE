import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './common/guards/jwt-auth.guard';
import { HealthService } from './common/services/health.service';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly healthService: HealthService,
  ) {}

  @Public()
  @Get('health')
  async health(): Promise<Record<string, unknown>> {
    return this.healthService.check();
  }
}