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
exports.BranchesService = exports.BranchDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../common/errors");
const shared_1 = require("../shared");
class BranchDto {
    name;
    city;
    address;
}
exports.BranchDto = BranchDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], BranchDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], BranchDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], BranchDto.prototype, "address", void 0);
let BranchesService = class BranchesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(member, dto) {
        const branch = await this.prisma.branch.create({
            data: {
                organizationId: member.organizationId,
                name: dto.name,
                city: dto.city,
                address: dto.address,
            },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.CREATE_BRANCH,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Branch',
            entityId: branch.id,
            newValue: dto,
        });
        return branch;
    }
    async list(member) {
        return this.prisma.branch.findMany({
            where: { organizationId: member.organizationId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getById(member, id) {
        const branch = await this.prisma.branch.findUnique({ where: { id } });
        if (!branch) {
            throw new errors_1.NotFoundError('Branch not found.');
        }
        if (branch.organizationId !== member.organizationId) {
            throw new errors_1.ApiError('FORBIDDEN', 'You cannot access resources of another organization.', 403);
        }
        return branch;
    }
    async update(member, id, dto) {
        const before = await this.requireOwnBranch(member, id);
        const updated = await this.prisma.branch.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.city !== undefined ? { city: dto.city } : {}),
                ...(dto.address !== undefined ? { address: dto.address } : {}),
            },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.UPDATE_BRANCH,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Branch',
            entityId: id,
            oldValue: before,
            newValue: updated,
        });
        return updated;
    }
    async remove(member, id) {
        const branch = await this.requireOwnBranch(member, id);
        const updated = await this.prisma.branch.update({
            where: { id },
            data: { isActive: false },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.DELETE_BRANCH,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Branch',
            entityId: id,
            oldValue: { name: branch.name, isActive: branch.isActive },
            reason: 'Soft-delete: branch deactivated',
        });
        return updated;
    }
    async requireOwnBranch(member, id) {
        const branch = await this.prisma.branch.findUnique({ where: { id } });
        if (!branch) {
            throw new errors_1.NotFoundError('Branch not found.');
        }
        if (branch.organizationId !== member.organizationId) {
            throw new errors_1.ApiError('FORBIDDEN', 'You cannot access resources of another organization.', 403);
        }
        return branch;
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map