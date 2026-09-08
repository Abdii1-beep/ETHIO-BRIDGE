"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const current_platform_user_decorator_1 = require("../common/decorators/current-platform-user.decorator");
const platform_role_guard_1 = require("../common/guards/platform-role.guard");
const shared_1 = require("../shared");
const errors_1 = require("../common/errors");
const otp_transport_1 = require("../auth/otp-transport");
const otp_util_1 = require("../auth/otp.util");
let AdminController = class AdminController {
    admin;
    otpTransport;
    constructor(admin, otpTransport) {
        this.admin = admin;
        this.otpTransport = otpTransport;
    }
    smtpStatus() {
        return {
            transport: otp_transport_1.otpRuntime.kind,
            smtpConfigured: otp_transport_1.otpRuntime.smtpConfigured,
            ethereal: otp_transport_1.otpRuntime.ethereal ?? { configured: false },
            bootError: otp_transport_1.otpRuntime.bootError,
        };
    }
    async smtpTest(dto) {
        const code = (0, otp_util_1.randomDigits)(6);
        try {
            await this.otpTransport.send({ to: dto.to, purpose: 'SMTP_TEST', code });
        }
        catch (e) {
            throw new errors_1.ApiError('OTP_DELIVERY_FAILED', `SMTP test delivery failed: ${e.message}`, 502);
        }
        return {
            transport: otp_transport_1.otpRuntime.kind,
            to: dto.to,
            delivered: true,
            ethereal: otp_transport_1.otpRuntime.ethereal?.configured ? { previewUrl: otp_transport_1.otpRuntime.ethereal.previewUrl } : null,
        };
    }
    me(user) {
        return user;
    }
    overview() {
        return this.admin.overview();
    }
    revenue() {
        return this.admin.getRevenueAnalytics();
    }
    listOrganizations(q, offset, limit) {
        return this.admin.listOrganizations({
            q,
            offset: offset ? Number(offset) : 0,
            limit: limit ? Number(limit) : 20,
        });
    }
    listUsers(q, status, offset, limit) {
        return this.admin.listUsers({
            q,
            status,
            offset: offset ? Number(offset) : 0,
            limit: limit ? Number(limit) : 20,
        });
    }
    approveUser(id, reviewer) {
        return this.admin.approveUser(id, reviewer?.id);
    }
    rejectUser(id, reviewer) {
        return this.admin.rejectUser(id, reviewer?.id);
    }
    listFeatureRequests(status) {
        return this.admin.listFeatureRequests({ status });
    }
    approve(id, dto, reviewer) {
        return this.admin.reviewFeatureRequest(id, true, dto.note, reviewer.id);
    }
    reject(id, dto, reviewer) {
        return this.admin.reviewFeatureRequest(id, false, dto.note, reviewer.id);
    }
    auditLogs(action, organizationId, userId, offset, limit) {
        return this.admin.auditLogs({
            action,
            organizationId,
            userId,
            offset: offset ? Number(offset) : 0,
            limit: limit ? Number(limit) : 50,
        });
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN, shared_1.PlatformRoleCodes.PLATFORM_SUPPORT_ADMIN),
    (0, common_1.Get)('smtp/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "smtpStatus", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN, shared_1.PlatformRoleCodes.PLATFORM_SUPPORT_ADMIN),
    (0, common_1.Post)('smtp/test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_service_1.SmtpTestDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "smtpTest", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(...Object.values(shared_1.PlatformRoleCodes)),
    (0, common_1.Get)('me'),
    __param(0, (0, current_platform_user_decorator_1.CurrentPlatformUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "me", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN),
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "overview", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN, shared_1.PlatformRoleCodes.PLATFORM_FINANCE_ADMIN),
    (0, common_1.Get)('revenue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "revenue", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN),
    (0, common_1.Get)('organizations'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('offset')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listOrganizations", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN),
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN),
    (0, common_1.Post)('users/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_platform_user_decorator_1.CurrentPlatformUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "approveUser", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN),
    (0, common_1.Post)('users/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_platform_user_decorator_1.CurrentPlatformUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "rejectUser", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN, shared_1.PlatformRoleCodes.PLATFORM_SUPPORT_ADMIN),
    (0, common_1.Get)('feature-requests'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "listFeatureRequests", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN, shared_1.PlatformRoleCodes.PLATFORM_SUPPORT_ADMIN),
    (0, common_1.Post)('feature-requests/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_platform_user_decorator_1.CurrentPlatformUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_service_1.ApproveFeatureRequestDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "approve", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN, shared_1.PlatformRoleCodes.PLATFORM_SUPPORT_ADMIN),
    (0, common_1.Post)('feature-requests/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_platform_user_decorator_1.CurrentPlatformUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_service_1.ApproveFeatureRequestDto, Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "reject", null);
__decorate([
    (0, platform_role_guard_1.RequirePlatformRoles)(shared_1.PlatformRoleCodes.PLATFORM_SUPER_ADMIN, shared_1.PlatformRoleCodes.PLATFORM_FINANCE_ADMIN),
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)('action')),
    __param(1, (0, common_1.Query)('organizationId')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('offset')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "auditLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __param(1, (0, common_1.Inject)(otp_transport_1.OTP_TRANSPORT)),
    __metadata("design:paramtypes", [admin_service_1.AdminService, Object])
], AdminController);
//# sourceMappingURL=admin.controller.js.map