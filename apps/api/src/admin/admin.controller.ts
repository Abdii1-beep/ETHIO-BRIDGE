import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { AdminService, ApproveFeatureRequestDto, SmtpTestDto } from './admin.service';
import {
  CurrentPlatformUser,
  PlatformUser,
} from '../common/decorators/current-platform-user.decorator';
import {
  RequirePlatformRoles,
} from '../common/guards/platform-role.guard';
import { PlatformRoleCodes } from '../shared';
import { ApiError } from '../common/errors';
import { OTP_TRANSPORT, OtpTransport, otpRuntime } from '../auth/otp-transport';
import { randomDigits } from '../auth/otp.util';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    @Inject(OTP_TRANSPORT) private readonly otpTransport: OtpTransport,
  ) {}

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN, PlatformRoleCodes.PLATFORM_SUPPORT_ADMIN)
  @Get('smtp/status')
  smtpStatus() {
    return {
      transport: otpRuntime.kind,
      smtpConfigured: otpRuntime.smtpConfigured,
      ethereal: otpRuntime.ethereal ?? { configured: false },
      bootError: otpRuntime.bootError,
    };
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN, PlatformRoleCodes.PLATFORM_SUPPORT_ADMIN)
  @Post('smtp/test')
  async smtpTest(@Body() dto: SmtpTestDto): Promise<Record<string, unknown>> {
    const code = randomDigits(6);
    try {
      await this.otpTransport.send({ to: dto.to, purpose: 'SMTP_TEST', code });
    } catch (e) {
      throw new ApiError(
        'OTP_DELIVERY_FAILED',
        `SMTP test delivery failed: ${(e as Error).message}`,
        502,
      );
    }
    return {
      transport: otpRuntime.kind,
      to: dto.to,
      delivered: true,
      ethereal: otpRuntime.ethereal?.configured ? { previewUrl: otpRuntime.ethereal.previewUrl } : null,
    };
  }

  @RequirePlatformRoles(...Object.values(PlatformRoleCodes))
  @Get('me')
  me(@CurrentPlatformUser() user: PlatformUser) {
    return user;
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN)
  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN, PlatformRoleCodes.PLATFORM_FINANCE_ADMIN)
  @Get('revenue')
  revenue() {
    return this.admin.getRevenueAnalytics();
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN)
  @Get('organizations')
  listOrganizations(
    @Query('q') q?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.listOrganizations({
      q,
      offset: offset ? Number(offset) : 0,
      limit: limit ? Number(limit) : 20,
    });
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN)
  @Get('users')
  listUsers(@Query('q') q?: string, @Query('status') status?: string, @Query('offset') offset?: string, @Query('limit') limit?: string) {
    return this.admin.listUsers({
      q,
      status,
      offset: offset ? Number(offset) : 0,
      limit: limit ? Number(limit) : 20,
    });
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN)
  @Post('users/:id/approve')
  approveUser(@Param('id') id: string, @CurrentPlatformUser() reviewer?: PlatformUser) {
    return this.admin.approveUser(id, reviewer?.id);
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN)
  @Post('users/:id/reject')
  rejectUser(@Param('id') id: string, @CurrentPlatformUser() reviewer?: PlatformUser) {
    return this.admin.rejectUser(id, reviewer?.id);
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN, PlatformRoleCodes.PLATFORM_SUPPORT_ADMIN)
  @Get('feature-requests')
  listFeatureRequests(@Query('status') status?: string) {
    return this.admin.listFeatureRequests({ status });
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN, PlatformRoleCodes.PLATFORM_SUPPORT_ADMIN)
  @Post('feature-requests/:id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveFeatureRequestDto,
    @CurrentPlatformUser() reviewer: PlatformUser,
  ) {
    return this.admin.reviewFeatureRequest(id, true, dto.note, reviewer.id);
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN, PlatformRoleCodes.PLATFORM_SUPPORT_ADMIN)
  @Post('feature-requests/:id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: ApproveFeatureRequestDto,
    @CurrentPlatformUser() reviewer: PlatformUser,
  ) {
    return this.admin.reviewFeatureRequest(id, false, dto.note, reviewer.id);
  }

  @RequirePlatformRoles(PlatformRoleCodes.PLATFORM_SUPER_ADMIN, PlatformRoleCodes.PLATFORM_FINANCE_ADMIN)
  @Get('audit-logs')
  auditLogs(
    @Query('action') action?: string,
    @Query('organizationId') organizationId?: string,
    @Query('userId') userId?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    return this.admin.auditLogs({
      action,
      organizationId,
      userId,
      offset: offset ? Number(offset) : 0,
      limit: limit ? Number(limit) : 50,
    });
  }
}