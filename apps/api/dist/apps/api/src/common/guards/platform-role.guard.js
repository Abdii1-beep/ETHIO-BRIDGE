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
exports.PlatformRoleGuard = exports.RequirePlatformRoles = exports.PLATFORM_ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const errors_1 = require("../errors");
exports.PLATFORM_ROLES_KEY = 'ehio_required_platform_roles';
const RequirePlatformRoles = (...roles) => (0, common_1.SetMetadata)(exports.PLATFORM_ROLES_KEY, roles);
exports.RequirePlatformRoles = RequirePlatformRoles;
let PlatformRoleGuard = class PlatformRoleGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(ctx) {
        const required = this.reflector.getAllAndOverride(exports.PLATFORM_ROLES_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!required || required.length === 0) {
            return true;
        }
        const req = ctx.switchToHttp().getRequest();
        if (!req.user) {
            throw new errors_1.ForbiddenError('Authentication is required.');
        }
        const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
        if (!user || !user.isActive || !user.platformRole) {
            throw new errors_1.ForbiddenError('Platform administration access is required.');
        }
        if (!required.includes(user.platformRole)) {
            throw new errors_1.ForbiddenError('Insufficient platform role.');
        }
        req.platformUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            platformRole: user.platformRole,
        };
        return true;
    }
};
exports.PlatformRoleGuard = PlatformRoleGuard;
exports.PlatformRoleGuard = PlatformRoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], PlatformRoleGuard);
//# sourceMappingURL=platform-role.guard.js.map