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
exports.CrmController = void 0;
const common_1 = require("@nestjs/common");
const crm_service_1 = require("./crm.service");
const org_member_guard_1 = require("../common/guards/org-member.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const client_1 = require("@prisma/client");
let CrmController = class CrmController {
    crmService;
    constructor(crmService) {
        this.crmService = crmService;
    }
    async listLeads(member, stage) {
        return this.crmService.listLeads(member.organizationId, stage);
    }
    async createLead(member, body) {
        return this.crmService.createLead(member.organizationId, body);
    }
    async updateStage(member, id, body) {
        return this.crmService.updateLeadStage(id, member.organizationId, body.stage);
    }
    async getSummary(member) {
        return this.crmService.getPipelineSummary(member.organizationId);
    }
};
exports.CrmController = CrmController;
__decorate([
    (0, permissions_guard_1.RequirePermissions)('crm.view'),
    (0, common_1.Get)('leads'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Query)('stage')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "listLeads", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('crm.manage'),
    (0, common_1.Post)('leads'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "createLead", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('crm.manage'),
    (0, common_1.Patch)('leads/:id/stage'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "updateStage", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('crm.view'),
    (0, common_1.Get)('summary'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CrmController.prototype, "getSummary", null);
exports.CrmController = CrmController = __decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, common_1.Controller)('crm'),
    __metadata("design:paramtypes", [crm_service_1.CrmService])
], CrmController);
//# sourceMappingURL=crm.controller.js.map