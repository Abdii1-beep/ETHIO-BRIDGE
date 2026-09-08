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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const finance_service_1 = require("./finance.service");
const org_member_guard_1 = require("../common/guards/org-member.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
let FinanceController = class FinanceController {
    finance;
    constructor(finance) {
        this.finance = finance;
    }
    listAccounts(member) {
        return this.finance.listAccounts(member);
    }
    createAccount(member, dto) {
        return this.finance.createAccount(member, dto);
    }
    updateAccount(member, id, dto) {
        return this.finance.updateAccount(member, id, dto);
    }
    summary(member) {
        return this.finance.summary(member);
    }
    create(member, dto) {
        return this.finance.create(member, dto);
    }
    list(member, page, limit, type, accountId) {
        return this.finance.list(member, {
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            type,
            accountId,
        });
    }
    getById(member, id) {
        return this.finance.getById(member, id);
    }
    remove(member, id) {
        return this.finance.remove(member, id);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, permissions_guard_1.RequirePermissions)('finance.view'),
    (0, common_1.Get)('accounts'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "listAccounts", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('finance.create'),
    (0, common_1.Post)('accounts'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_service_1.CreateChartAccountDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createAccount", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('finance.create'),
    (0, common_1.Put)('accounts/:id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, finance_service_1.UpdateChartAccountDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "updateAccount", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('finance.view'),
    (0, common_1.Get)('summary'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "summary", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('finance.create'),
    (0, common_1.Post)(),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_service_1.CreateTransactionDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "create", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('finance.view'),
    (0, common_1.Get)(),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "list", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('finance.view'),
    (0, common_1.Get)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getById", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('finance.delete'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "remove", null);
exports.FinanceController = FinanceController = __decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, common_1.Controller)('transactions'),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map