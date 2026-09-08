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
exports.DepartmentsController = void 0;
const common_1 = require("@nestjs/common");
const departments_service_1 = require("./departments.service");
const org_member_guard_1 = require("../common/guards/org-member.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
let DepartmentsController = class DepartmentsController {
    departments;
    constructor(departments) {
        this.departments = departments;
    }
    create(member, dto) {
        return this.departments.create(member, dto);
    }
    list(member) {
        return this.departments.list(member);
    }
    getById(member, id) {
        return this.departments.getById(member, id);
    }
    update(member, id, dto) {
        return this.departments.update(member, id, dto);
    }
    remove(member, id) {
        return this.departments.remove(member, id);
    }
};
exports.DepartmentsController = DepartmentsController;
__decorate([
    (0, permissions_guard_1.RequirePermissions)('departments.manage'),
    (0, common_1.Post)(),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, departments_service_1.DepartmentDto]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "create", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('departments.view'),
    (0, common_1.Get)(),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "list", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('departments.view'),
    (0, common_1.Get)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "getById", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('departments.manage'),
    (0, common_1.Put)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "update", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('departments.manage'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DepartmentsController.prototype, "remove", null);
exports.DepartmentsController = DepartmentsController = __decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, common_1.Controller)('departments'),
    __metadata("design:paramtypes", [departments_service_1.DepartmentsService])
], DepartmentsController);
//# sourceMappingURL=departments.controller.js.map