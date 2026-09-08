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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgMemberGuard = exports.CurrentMember = exports.ORGANIZATION_HEADER = exports.RequiresMember = exports.REQUIRES_MEMBER_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const errors_1 = require("../errors");
const request_store_1 = require("../request-store");
exports.REQUIRES_MEMBER_KEY = 'ehio_requires_member';
const RequiresMember = () => (0, common_1.SetMetadata)(exports.REQUIRES_MEMBER_KEY, true);
exports.RequiresMember = RequiresMember;
exports.ORGANIZATION_HEADER = 'x-organization-id';
exports.CurrentMember = (0, common_1.createParamDecorator)((_data, ctx) => {
    return ctx.switchToHttp().getRequest().member;
});
let OrgMemberGuard = class OrgMemberGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(ctx) {
        const requiresMember = this.reflector.getAllAndOverride(exports.REQUIRES_MEMBER_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!requiresMember) {
            return true;
        }
        const req = ctx.switchToHttp().getRequest();
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Authentication is required.');
        }
        const organizationId = req.headers[exports.ORGANIZATION_HEADER]?.trim();
        if (!organizationId) {
            throw new errors_1.ApiError('ORGANIZATION_HEADER_REQUIRED', `The "${exports.ORGANIZATION_HEADER}" header is required for this request.`, 400);
        }
        const member = await this.prisma.organizationMember.findUnique({
            where: { organizationId_userId: { organizationId, userId: req.user.sub } },
            include: {
                organization: { select: { status: true } },
                roleAssignments: {
                    include: { role: { include: { permissions: { include: { permission: true } } } } },
                },
            },
        });
        if (!member) {
            throw new errors_1.ForbiddenError('You are not a member of this organization.');
        }
        if (member.organization.status === 'SUSPENDED') {
            throw new errors_1.ApiError('ACCOUNT_SUSPENDED', 'This organization is suspended.', 403);
        }
        if (member.status !== 'ACTIVE') {
            throw new errors_1.ForbiddenError('Your membership is not active.');
        }
        const roles = member.roleAssignments.map((ra) => ra.role.code ?? ra.role.name);
        const permissions = [
            ...new Set(member.roleAssignments.flatMap((ra) => ra.role.permissions.map((rp) => rp.permission.code))),
        ];
        req.member = {
            userId: req.user.sub,
            organizationId,
            memberId: member.id,
            roles,
            permissions,
        };
        (0, request_store_1.updateRequestStore)({ userId: req.user.sub, organizationId });
        return true;
    }
};
exports.OrgMemberGuard = OrgMemberGuard;
exports.OrgMemberGuard = OrgMemberGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], OrgMemberGuard);
//# sourceMappingURL=org-member.guard.js.map