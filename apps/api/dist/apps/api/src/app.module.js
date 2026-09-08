"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const audit_service_1 = require("./audit/audit.service");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const org_member_guard_1 = require("./common/guards/org-member.guard");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const response_envelope_interceptor_1 = require("./common/interceptors/response-envelope.interceptor");
const language_interceptor_1 = require("./common/interceptors/language.interceptor");
const auth_module_1 = require("./auth/auth.module");
const organizations_module_1 = require("./organizations/organizations.module");
const branches_module_1 = require("./branches/branches.module");
const departments_module_1 = require("./departments/departments.module");
const members_module_1 = require("./members/members.module");
const roles_module_1 = require("./roles/roles.module");
const features_module_1 = require("./features/features.module");
const finance_module_1 = require("./finance/finance.module");
const ai_module_1 = require("./ai/ai.module");
const monetization_module_1 = require("./monetization/monetization.module");
const marketplace_module_1 = require("./marketplace/marketplace.module");
const crm_module_1 = require("./crm/crm.module");
const admin_module_1 = require("./admin/admin.module");
const lottery_module_1 = require("./lottery/lottery.module");
const payments_module_1 = require("./payments/payments.module");
const health_service_1 = require("./common/services/health.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                envFilePath: ['.env', '../.env', '../../.env', (0, path_1.resolve)(process.cwd(), '.env'), (0, path_1.resolve)(process.cwd(), '../../.env')],
            }),
            jwt_1.JwtModule.register({}),
            prisma_module_1.PrismaModule,
            audit_service_1.AuditModule,
            auth_module_1.AuthModule,
            organizations_module_1.OrganizationsModule,
            branches_module_1.BranchesModule,
            departments_module_1.DepartmentsModule,
            members_module_1.MembersModule,
            roles_module_1.RolesModule,
            features_module_1.FeaturesModule,
            finance_module_1.FinanceModule,
            monetization_module_1.MonetizationModule,
            marketplace_module_1.MarketplaceModule,
            crm_module_1.CrmModule,
            ai_module_1.AiModule,
            admin_module_1.AdminModule,
            lottery_module_1.LotteryModule,
            payments_module_1.PaymentsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            health_service_1.HealthService,
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: org_member_guard_1.OrgMemberGuard },
            { provide: core_1.APP_FILTER, useClass: all_exceptions_filter_1.AllExceptionsFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: response_envelope_interceptor_1.ResponseEnvelopeInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: language_interceptor_1.LanguageInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map