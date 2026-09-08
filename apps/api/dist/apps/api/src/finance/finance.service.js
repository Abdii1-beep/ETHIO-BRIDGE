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
exports.FinanceService = exports.UpdateChartAccountDto = exports.CreateChartAccountDto = exports.CreateTransactionDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../common/errors");
const shared_1 = require("../shared");
const ACCOUNT_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;
class CreateTransactionDto {
    type;
    accountId;
    amount;
    currency;
    description;
    occurredAt;
}
exports.CreateTransactionDto = CreateTransactionDto;
__decorate([
    (0, class_validator_1.IsEnum)(shared_1.FINANCE_TRANSACTION_TYPES),
    __metadata("design:type", Object)
], CreateTransactionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "accountId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(3),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "occurredAt", void 0);
class CreateChartAccountDto {
    code;
    name;
    type;
    parentId;
    description;
}
exports.CreateChartAccountDto = CreateChartAccountDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    (0, class_validator_1.Matches)(ACCOUNT_CODE_PATTERN, { message: 'Account code must start with a letter or digit and contain only letters, digits, dots, underscores or dashes.' }),
    __metadata("design:type", String)
], CreateChartAccountDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateChartAccountDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(shared_1.CHART_ACCOUNT_TYPES),
    __metadata("design:type", Object)
], CreateChartAccountDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChartAccountDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateChartAccountDto.prototype, "description", void 0);
class UpdateChartAccountDto {
    name;
    description;
    parentId;
    isActive;
}
exports.UpdateChartAccountDto = UpdateChartAccountDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateChartAccountDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateChartAccountDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateChartAccountDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateChartAccountDto.prototype, "isActive", void 0);
const round2 = (n) => Math.round(n * 100) / 100;
let FinanceService = class FinanceService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async listAccounts(member) {
        return this.prisma.chartAccount.findMany({
            where: { organizationId: member.organizationId },
            include: {
                parent: { select: { id: true, code: true, name: true } },
                _count: { select: { transactions: true } },
            },
            orderBy: [{ code: 'asc' }],
        });
    }
    async createAccount(member, dto) {
        if (dto.parentId) {
            const parent = await this.prisma.chartAccount.findFirst({
                where: { id: dto.parentId, organizationId: member.organizationId },
            });
            if (!parent) {
                throw new errors_1.NotFoundError('Parent account not found in this organization.');
            }
        }
        try {
            const account = await this.prisma.chartAccount.create({
                data: {
                    organizationId: member.organizationId,
                    code: dto.code,
                    name: dto.name,
                    type: dto.type,
                    parentId: dto.parentId ?? null,
                    description: dto.description,
                },
            });
            await this.audit.record({
                action: shared_1.AUDIT_ACTIONS.CREATE_ACCOUNT,
                organizationId: member.organizationId,
                userId: member.userId,
                entity: 'ChartAccount',
                entityId: account.id,
                newValue: { code: account.code, name: account.name, type: account.type },
            });
            return account;
        }
        catch (err) {
            if (err instanceof common_1.ConflictException)
                throw err;
            if (err.code === 'P2002') {
                throw new errors_1.ConflictError(`An account with code "${dto.code}" already exists.`);
            }
            throw err;
        }
    }
    async updateAccount(member, id, dto) {
        const existing = await this.prisma.chartAccount.findFirst({
            where: { id, organizationId: member.organizationId },
        });
        if (!existing) {
            throw new errors_1.NotFoundError('Account not found.');
        }
        if (dto.parentId) {
            if (dto.parentId === id) {
                throw new errors_1.ConflictError('An account cannot be its own parent.');
            }
            const parent = await this.prisma.chartAccount.findFirst({
                where: { id: dto.parentId, organizationId: member.organizationId },
            });
            if (!parent) {
                throw new errors_1.NotFoundError('Parent account not found in this organization.');
            }
        }
        const update = {};
        if (dto.name !== undefined)
            update.name = dto.name;
        if (dto.description !== undefined)
            update.description = dto.description;
        if (dto.parentId !== undefined)
            update.parentId = dto.parentId;
        if (dto.isActive !== undefined)
            update.isActive = dto.isActive === 'true';
        const account = await this.prisma.chartAccount.update({
            where: { id },
            data: update,
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.UPDATE_ACCOUNT,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'ChartAccount',
            entityId: id,
            oldValue: { name: existing.name, isActive: existing.isActive },
            newValue: { name: account.name, isActive: account.isActive },
        });
        return account;
    }
    async create(member, dto) {
        if (dto.accountId) {
            const account = await this.prisma.chartAccount.findFirst({
                where: { id: dto.accountId, organizationId: member.organizationId },
            });
            if (!account) {
                throw new errors_1.NotFoundError('Account not found in this organization.');
            }
        }
        const tx = await this.prisma.financeTransaction.create({
            data: {
                organizationId: member.organizationId,
                type: dto.type,
                accountId: dto.accountId ?? null,
                amount: dto.amount,
                currency: dto.currency.toUpperCase(),
                description: dto.description,
                occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
                createdById: member.userId,
            },
            include: { account: { select: { id: true, code: true, name: true } } },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.CREATE_TRANSACTION,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'FinanceTransaction',
            entityId: tx.id,
            newValue: { type: tx.type, amount: tx.amount, currency: tx.currency, accountId: tx.accountId },
        });
        return tx;
    }
    async list(member, query) {
        const page = Math.max(1, Number(query.page ?? 1));
        const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
        const where = {
            organizationId: member.organizationId,
            deletedAt: null,
            ...(query.type ? { type: query.type } : {}),
            ...(query.accountId ? { accountId: query.accountId } : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.financeTransaction.findMany({
                where,
                include: { account: { select: { id: true, code: true, name: true } } },
                orderBy: { occurredAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.financeTransaction.count({ where }),
        ]);
        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }
    async getById(member, id) {
        const tx = await this.prisma.financeTransaction.findFirst({
            where: { id, organizationId: member.organizationId, deletedAt: null },
            include: { account: { select: { id: true, code: true, name: true } } },
        });
        if (!tx) {
            throw new errors_1.NotFoundError('Transaction not found.');
        }
        return tx;
    }
    async remove(member, id) {
        const tx = await this.prisma.financeTransaction.findFirst({
            where: { id, organizationId: member.organizationId },
        });
        if (!tx) {
            throw new errors_1.NotFoundError('Transaction not found.');
        }
        if (tx.deletedAt) {
            throw new errors_1.NotFoundError('Transaction already deleted.');
        }
        const updated = await this.prisma.financeTransaction.update({
            where: { id },
            data: { deletedAt: new Date(), deletedById: member.userId },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.DELETE_TRANSACTION,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'FinanceTransaction',
            entityId: id,
            oldValue: { type: tx.type, amount: tx.amount },
            reason: 'Soft-delete by authorized member',
        });
        return updated;
    }
    async summary(member) {
        const groups = await this.prisma.financeTransaction.groupBy({
            by: ['type'],
            where: { organizationId: member.organizationId, deletedAt: null },
            _count: { _all: true },
            _sum: { amount: true },
        });
        const byType = {};
        let incoming = 0;
        let outgoing = 0;
        let totalCount = 0;
        for (const g of groups) {
            const amount = Number(g._sum.amount ?? 0);
            byType[g.type] = { count: g._count._all, amount: round2(amount) };
            totalCount += g._count._all;
            if (g.type === 'INCOME' || g.type === 'RECEIPT')
                incoming += amount;
            if (g.type === 'EXPENSE' || g.type === 'PAYMENT')
                outgoing += amount;
        }
        const accountGroups = await this.prisma.financeTransaction.groupBy({
            by: ['accountId'],
            where: { organizationId: member.organizationId, deletedAt: null, accountId: { not: null } },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 5,
        });
        const accountIds = accountGroups.map((g) => g.accountId).filter(Boolean);
        const accounts = await this.prisma.chartAccount.findMany({
            where: { id: { in: accountIds } },
            select: { id: true, code: true, name: true },
        });
        const topAccounts = accountGroups.map((g) => {
            const account = accounts.find((a) => a.id === g.accountId);
            return {
                accountId: g.accountId,
                code: account?.code ?? null,
                name: account?.name ?? null,
                amount: round2(Number(g._sum.amount ?? 0)),
            };
        });
        return {
            currency: 'ETB',
            incoming: round2(incoming),
            outgoing: round2(outgoing),
            net: round2(incoming - outgoing),
            transactionCount: totalCount,
            accountCount: await this.prisma.chartAccount.count({
                where: { organizationId: member.organizationId },
            }),
            byType,
            topAccounts,
        };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map