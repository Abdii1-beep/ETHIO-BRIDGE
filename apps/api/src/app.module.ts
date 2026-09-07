import { resolve } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { OrgMemberGuard } from './common/guards/org-member.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { FeaturesGuard } from './common/guards/features.guard';
import { PlatformRoleGuard } from './common/guards/platform-role.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { LanguageInterceptor } from './common/interceptors/language.interceptor';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { BranchesModule } from './branches/branches.module';
import { DepartmentsModule } from './departments/departments.module';
import { MembersModule } from './members/members.module';
import { RolesModule } from './roles/roles.module';
import { FeaturesModule } from './features/features.module';
import { FinanceModule } from './finance/finance.module';
import { AiModule } from './ai/ai.module';
import { MonetizationModule } from './monetization/monetization.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { CrmModule } from './crm/crm.module';
import { AdminModule } from './admin/admin.module';
import { LotteryModule } from './lottery/lottery.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthService } from './common/services/health.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '../.env', '../../.env', resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')],
    }),
    JwtModule.register({}),
    PrismaModule,
    AuditModule,
    AuthModule,
    OrganizationsModule,
    BranchesModule,
    DepartmentsModule,
    MembersModule,
    RolesModule,
    FeaturesModule,
    FinanceModule,
    MonetizationModule,
    MarketplaceModule,
    CrmModule,
    AiModule,
    AdminModule,
    LotteryModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    HealthService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: OrgMemberGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LanguageInterceptor },
  ],
})
export class AppModule {}