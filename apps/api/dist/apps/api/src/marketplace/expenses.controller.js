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
exports.ExpensesController = void 0;
const common_1 = require("@nestjs/common");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const org_member_guard_1 = require("../common/guards/org-member.guard");
let ExpensesController = class ExpensesController {
    async listExpenses(member, query) {
        return {
            success: true,
            data: {
                expenses: [],
                total: 0,
                summary: {
                    today: 0,
                    week: 0,
                    month: 0,
                    year: 0,
                    byCategory: {}
                }
            }
        };
    }
    async createExpense(member, data) {
        return {
            success: true,
            data: {
                id: 'expense-id',
                ...data,
                createdAt: new Date().toISOString()
            }
        };
    }
    async getExpense(member, id) {
        return {
            success: true,
            data: {
                id,
                amount: 0,
                currency: 'ETB',
                category: '',
                description: '',
                status: 'PENDING'
            }
        };
    }
    async updateExpense(member, id, data) {
        return {
            success: true,
            data: {
                id,
                ...data,
                updatedAt: new Date().toISOString()
            }
        };
    }
    async deleteExpense(member, id) {
        return {
            success: true,
            data: { id }
        };
    }
    async approveExpense(member, id, data) {
        return {
            success: true,
            data: {
                id,
                status: 'APPROVED',
                approvedBy: member.userId,
                approvedAt: new Date().toISOString()
            }
        };
    }
};
exports.ExpensesController = ExpensesController;
__decorate([
    (0, permissions_guard_1.RequirePermissions)('expenses.view'),
    (0, common_1.Get)(),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ExpensesController.prototype, "listExpenses", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('expenses.create'),
    (0, common_1.Post)(),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ExpensesController.prototype, "createExpense", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('expenses.view'),
    (0, common_1.Get)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExpensesController.prototype, "getExpense", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('expenses.manage'),
    (0, common_1.Put)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExpensesController.prototype, "updateExpense", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('expenses.manage'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExpensesController.prototype, "deleteExpense", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('expenses.manage'),
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ExpensesController.prototype, "approveExpense", null);
exports.ExpensesController = ExpensesController = __decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, common_1.Controller)('expenses')
], ExpensesController);
//# sourceMappingURL=expenses.controller.js.map