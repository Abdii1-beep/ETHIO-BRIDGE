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
exports.DepartmentsService = exports.DepartmentDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../common/errors");
const shared_1 = require("../shared");
class DepartmentDto {
    name;
    description;
}
exports.DepartmentDto = DepartmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], DepartmentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], DepartmentDto.prototype, "description", void 0);
let DepartmentsService = class DepartmentsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(member, dto) {
        const department = await this.prisma.department.create({
            data: {
                organizationId: member.organizationId,
                name: dto.name,
                description: dto.description,
            },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.CREATE_DEPARTMENT,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Department',
            entityId: department.id,
            newValue: dto,
        });
        return department;
    }
    async list(member) {
        return this.prisma.department.findMany({
            where: { organizationId: member.organizationId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getById(member, id) {
        const department = await this.prisma.department.findUnique({ where: { id } });
        if (!department) {
            throw new errors_1.NotFoundError('Department not found.');
        }
        if (department.organizationId !== member.organizationId) {
            throw new errors_1.ApiError('FORBIDDEN', 'You cannot access resources of another organization.', 403);
        }
        return department;
    }
    async update(member, id, dto) {
        const before = await this.requireOwn(member, id);
        const updated = await this.prisma.department.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
            },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.UPDATE_DEPARTMENT,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Department',
            entityId: id,
            oldValue: before,
            newValue: updated,
        });
        return updated;
    }
    async remove(member, id) {
        const department = await this.requireOwn(member, id);
        const updated = await this.prisma.department.update({
            where: { id },
            data: { isActive: false },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.DELETE_DEPARTMENT,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Department',
            entityId: id,
            oldValue: { name: department.name, isActive: department.isActive },
            reason: 'Soft-delete: department deactivated',
        });
        return updated;
    }
    async requireOwn(member, id) {
        const department = await this.prisma.department.findUnique({ where: { id } });
        if (!department) {
            throw new errors_1.NotFoundError('Department not found.');
        }
        if (department.organizationId !== member.organizationId) {
            throw new errors_1.ApiError('FORBIDDEN', 'You cannot access resources of another organization.', 403);
        }
        return department;
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map