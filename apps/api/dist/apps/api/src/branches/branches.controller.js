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
exports.BranchesController = void 0;
const common_1 = require("@nestjs/common");
const branches_service_1 = require("./branches.service");
const org_member_guard_1 = require("../common/guards/org-member.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
let BranchesController = class BranchesController {
    branches;
    constructor(branches) {
        this.branches = branches;
    }
    create(member, dto) {
        return this.branches.create(member, dto);
    }
    list(member) {
        return this.branches.list(member);
    }
    getById(member, id) {
        return this.branches.getById(member, id);
    }
    update(member, id, dto) {
        return this.branches.update(member, id, dto);
    }
    remove(member, id) {
        return this.branches.remove(member, id);
    }
};
exports.BranchesController = BranchesController;
__decorate([
    (0, permissions_guard_1.RequirePermissions)('branches.manage'),
    (0, common_1.Post)(),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, branches_service_1.BranchDto]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "create", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('branches.view'),
    (0, common_1.Get)(),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "list", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('branches.view'),
    (0, common_1.Get)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "getById", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('branches.manage'),
    (0, common_1.Put)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "update", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('branches.manage'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "remove", null);
exports.BranchesController = BranchesController = __decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, common_1.Controller)('branches'),
    __metadata("design:paramtypes", [branches_service_1.BranchesService])
], BranchesController);
//# sourceMappingURL=branches.controller.js.map