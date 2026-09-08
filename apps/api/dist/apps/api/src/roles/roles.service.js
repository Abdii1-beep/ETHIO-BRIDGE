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
exports.RolesService = exports.UpdateRoleDto = exports.CreateRoleDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../common/errors");
const shared_1 = require("../shared");
class CreateRoleDto {
    name;
    description;
    permissionCodes;
}
exports.CreateRoleDto = CreateRoleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateRoleDto.prototype, "permissionCodes", void 0);
class UpdateRoleDto {
    name;
    description;
    permissionCodes;
}
exports.UpdateRoleDto = UpdateRoleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateRoleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateRoleDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateRoleDto.prototype, "permissionCodes", void 0);
let RolesService = class RolesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async list(member) {
        return this.prisma.role.findMany({
            where: { organizationId: member.organizationId },
            include: {
                _count: { select: { memberRoles: true } },
                permissions: { include: { permission: { select: { code: true, category: true } } } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    catalog() {
        return shared_1.PermissionCategories.map((category) => ({
            category,
            permissions: shared_1.PERMISSIONS.filter((p) => p.category === category).map((p) => ({
                code: p.code,
                nameKey: p.nameKey,
                descriptionKey: p.descriptionKey,
            })),
        }));
    }
    async getById(member, id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: { include: { permission: true } },
                memberRoles: { include: { member: { include: { user: { select: { name: true, email: true } } } } } },
            },
        });
        if (!role || role.organizationId !== member.organizationId) {
            throw new errors_1.NotFoundError('Role not found in this organization.');
        }
        return role;
    }
    async create(member, dto) {
        await this.validatePermissionCodes(dto.permissionCodes);
        const role = await this.prisma.role.create({
            data: {
                organizationId: member.organizationId,
                name: dto.name,
                description: dto.description,
                isBuiltIn: false,
                permissions: {
                    create: (await this.resolvePermissionIds(dto.permissionCodes)).map((permissionId) => ({
                        permission: { connect: { id: permissionId } },
                    })),
                },
            },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.CREATE_ROLE,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Role',
            entityId: role.id,
            newValue: { name: dto.name, permissionCodes: dto.permissionCodes },
        });
        return role;
    }
    async update(member, id, dto) {
        const existing = await this.prisma.role.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== member.organizationId) {
            throw new errors_1.NotFoundError('Role not found in this organization.');
        }
        if (existing.isBuiltIn && dto.permissionCodes) {
            throw new errors_1.ApiError('VALIDATION_FAILED', 'Built-in role permissions cannot be modified.', 400);
        }
        if (dto.permissionCodes !== undefined) {
            dto.permissionCodes = await this.validatePermissionCodes(dto.permissionCodes);
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const role = await tx.role.update({
                where: { id },
                data: {
                    ...(dto.name !== undefined ? { name: dto.name } : {}),
                    ...(dto.description !== undefined ? { description: dto.description } : {}),
                },
            });
            if (dto.permissionCodes) {
                await tx.rolePermission.deleteMany({ where: { roleId: id } });
                const ids = await this.resolvePermissionIds(dto.permissionCodes, tx);
                await tx.rolePermission.createMany({
                    data: ids.map((permissionId) => ({ roleId: id, permissionId })),
                });
            }
            return role;
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.UPDATE_ROLE,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Role',
            entityId: id,
            oldValue: { name: existing.name },
            newValue: dto,
        });
        return updated;
    }
    async remove(member, id) {
        const existing = await this.prisma.role.findUnique({ where: { id } });
        if (!existing || existing.organizationId !== member.organizationId) {
            throw new errors_1.NotFoundError('Role not found in this organization.');
        }
        if (existing.isBuiltIn) {
            throw new errors_1.ApiError('VALIDATION_FAILED', 'Built-in roles cannot be deleted.', 400);
        }
        const memberCount = await this.prisma.memberRole.count({ where: { roleId: id } });
        if (memberCount > 0) {
            throw new errors_1.ApiError('CONFLICT', 'Cannot delete a role that is assigned to members.', 409);
        }
        await this.prisma.role.delete({ where: { id } });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.DELETE_ROLE,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Role',
            entityId: id,
            oldValue: { name: existing.name },
        });
        return { deleted: true };
    }
    async validatePermissionCodes(codes) {
        const unknown = codes.filter((c) => !shared_1.PERMISSION_CODES.includes(c));
        if (unknown.length > 0) {
            throw new errors_1.ApiError('VALIDATION_FAILED', `Unknown permission codes: ${unknown.join(', ')}`, 400);
        }
        return codes;
    }
    async resolvePermissionIds(codes, tx) {
        const client = tx ?? this.prisma;
        const records = await client.permission.findMany({ where: { code: { in: codes } } });
        const byCode = new Map(records.map((p) => [p.code, p.id]));
        return codes.map((c) => byCode.get(c)).filter((id) => Boolean(id));
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], RolesService);
//# sourceMappingURL=roles.service.js.map