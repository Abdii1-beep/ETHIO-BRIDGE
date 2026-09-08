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
exports.MembersController = void 0;
const common_1 = require("@nestjs/common");
const members_service_1 = require("./members.service");
const org_member_guard_1 = require("../common/guards/org-member.guard");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
let MembersController = class MembersController {
    members;
    constructor(members) {
        this.members = members;
    }
    list(member) {
        return this.members.list(member);
    }
    invite(member, dto) {
        return this.members.invite(member, dto);
    }
    claim(user, dto) {
        return this.members.claim(user.sub, dto);
    }
    update(member, memberId, dto) {
        return this.members.updateAssignments(member, memberId, dto);
    }
    disable(member, memberId, body = {}) {
        return this.members.disable(member, memberId, body.reason);
    }
    enable(member, memberId) {
        return this.members.enable(member, memberId);
    }
};
exports.MembersController = MembersController;
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('users.view'),
    (0, common_1.Get)(),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "list", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('users.invite'),
    (0, common_1.Post)('invite'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, members_service_1.InviteUserDto]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)('invitations/claim'),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, members_service_1.ClaimInviteDto]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "claim", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('users.edit'),
    (0, common_1.Put)(':memberId'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "update", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('users.disable'),
    (0, common_1.Post)(':memberId/disable'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "disable", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('users.edit'),
    (0, common_1.Post)(':memberId/enable'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "enable", null);
exports.MembersController = MembersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [members_service_1.MembersService])
], MembersController);
//# sourceMappingURL=members.controller.js.map