import { Injectable, ConflictException } from '@nestjs/common';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberContext } from '../common/guards/org-member.guard';
import { ConflictError, NotFoundError } from '../common/errors';
import { AUDIT_ACTIONS, CHART_ACCOUNT_TYPES, FINANCE_TRANSACTION_TYPES } from '../shared';

const ACCOUNT_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

export class CreateTransactionDto {
  @IsEnum(FINANCE_TRANSACTION_TYPES)
  type!: (typeof FINANCE_TRANSACTION_TYPES)[number];

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsString()
  @MaxLength(3)
  currency!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsString()
  occurredAt?: string;
}

export class CreateChartAccountDto {
  @IsString()
  @MaxLength(20)
  @Matches(ACCOUNT_CODE_PATTERN, { message: 'Account code must start with a letter or digit and contain only letters, digits, dots, underscores or dashes.' })
  code!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEnum(CHART_ACCOUNT_TYPES)
  type!: (typeof CHART_ACCOUNT_TYPES)[number];

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateChartAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  isActive?: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Real finance slice (Phase 1 → catalogued PARTIAL, operational):
 * chart of accounts, journal transactions, and summary reports.
 * Invoicing, approvals and budgets remain Phase 6.
 */
@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------- Chart of accounts ----------

  async listAccounts(member: MemberContext) {
    return this.prisma.chartAccount.findMany({
      where: { organizationId: member.organizationId },
      include: {
        parent: { select: { id: true, code: true, name: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: [{ code: 'asc' }],
    });
  }

  async createAccount(member: MemberContext, dto: CreateChartAccountDto) {
    if (dto.parentId) {
      const parent = await this.prisma.chartAccount.findFirst({
        where: { id: dto.parentId, organizationId: member.organizationId },
      });
      if (!parent) {
        throw new NotFoundError('Parent account not found in this organization.');
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
        action: AUDIT_ACTIONS.CREATE_ACCOUNT,
        organizationId: member.organizationId,
        userId: member.userId,
        entity: 'ChartAccount',
        entityId: account.id,
        newValue: { code: account.code, name: account.name, type: account.type },
      });
      return account;
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictError(`An account with code "${dto.code}" already exists.`);
      }
      throw err;
    }
  }

  async updateAccount(member: MemberContext, id: string, dto: UpdateChartAccountDto) {
    const existing = await this.prisma.chartAccount.findFirst({
      where: { id, organizationId: member.organizationId },
    });
    if (!existing) {
      throw new NotFoundError('Account not found.');
    }
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictError('An account cannot be its own parent.');
      }
      const parent = await this.prisma.chartAccount.findFirst({
        where: { id: dto.parentId, organizationId: member.organizationId },
      });
      if (!parent) {
        throw new NotFoundError('Parent account not found in this organization.');
      }
    }
    const update: Record<string, string | null | boolean> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.parentId !== undefined) update.parentId = dto.parentId;
    if (dto.isActive !== undefined) update.isActive = dto.isActive === 'true';
    const account = await this.prisma.chartAccount.update({
      where: { id },
      data: update,
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.UPDATE_ACCOUNT,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'ChartAccount',
      entityId: id,
      oldValue: { name: existing.name, isActive: existing.isActive },
      newValue: { name: account.name, isActive: account.isActive },
    });
    return account;
  }

  // ---------- Transactions ----------

  async create(member: MemberContext, dto: CreateTransactionDto) {
    if (dto.accountId) {
      const account = await this.prisma.chartAccount.findFirst({
        where: { id: dto.accountId, organizationId: member.organizationId },
      });
      if (!account) {
        throw new NotFoundError('Account not found in this organization.');
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
      action: AUDIT_ACTIONS.CREATE_TRANSACTION,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'FinanceTransaction',
      entityId: tx.id,
      newValue: { type: tx.type, amount: tx.amount, currency: tx.currency, accountId: tx.accountId },
    });
    return tx;
  }

  async list(
    member: MemberContext,
    query: { page?: number; limit?: number; type?: string; accountId?: string },
  ) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const where = {
      organizationId: member.organizationId,
      deletedAt: null,
      ...(query.type ? { type: query.type as never } : {}),
      ...(query.accountId ? { accountId: query.accountId as never } : {}),
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

  async getById(member: MemberContext, id: string) {
    const tx = await this.prisma.financeTransaction.findFirst({
      where: { id, organizationId: member.organizationId, deletedAt: null },
      include: { account: { select: { id: true, code: true, name: true } } },
    });
    if (!tx) {
      throw new NotFoundError('Transaction not found.');
    }
    return tx;
  }

  async remove(member: MemberContext, id: string) {
    const tx = await this.prisma.financeTransaction.findFirst({
      where: { id, organizationId: member.organizationId },
    });
    if (!tx) {
      throw new NotFoundError('Transaction not found.');
    }
    if (tx.deletedAt) {
      throw new NotFoundError('Transaction already deleted.');
    }
    const updated = await this.prisma.financeTransaction.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: member.userId },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.DELETE_TRANSACTION,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'FinanceTransaction',
      entityId: id,
      oldValue: { type: tx.type, amount: tx.amount },
      reason: 'Soft-delete by authorized member',
    });
    return updated;
  }

  // ---------- Reports ----------

  async summary(member: MemberContext) {
    const groups = await this.prisma.financeTransaction.groupBy({
      by: ['type'],
      where: { organizationId: member.organizationId, deletedAt: null },
      _count: { _all: true },
      _sum: { amount: true },
    });
    const byType: Record<string, { count: number; amount: number }> = {};
    let incoming = 0;
    let outgoing = 0;
    let totalCount = 0;
    for (const g of groups) {
      const amount = Number(g._sum.amount ?? 0);
      byType[g.type] = { count: g._count._all, amount: round2(amount) };
      totalCount += g._count._all;
      if (g.type === 'INCOME' || g.type === 'RECEIPT') incoming += amount;
      if (g.type === 'EXPENSE' || g.type === 'PAYMENT') outgoing += amount;
    }
    const accountGroups = await this.prisma.financeTransaction.groupBy({
      by: ['accountId'],
      where: { organizationId: member.organizationId, deletedAt: null, accountId: { not: null } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });
    const accountIds = accountGroups.map((g) => g.accountId).filter(Boolean) as string[];
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
}