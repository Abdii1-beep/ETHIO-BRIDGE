import { Injectable } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiError, NotFoundError } from '../common/errors';
import { AUDIT_ACTIONS } from '../shared';

export class ApproveFeatureRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class SmtpTestDto {
  @IsEmail()
  to!: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async overview() {
    const [organizations, users, members, featureRequests, auditLogs, products, rfqs, orders] =
      await Promise.all([
        this.prisma.organization.count(),
        this.prisma.user.count(),
        this.prisma.organizationMember.count(),
        this.prisma.featureRequest.count({ where: { status: 'PENDING' } }),
        this.prisma.auditLog.count(),
        this.prisma.product.count(),
        this.prisma.rfq.count(),
        this.prisma.order.count(),
      ]);
    return {
      organizations,
      users,
      members,
      pendingFeatureRequests: featureRequests,
      auditLogEntries: auditLogs,
      products,
      rfqs,
      orders,
    };
  }

  async getRevenueAnalytics() {
    const [commissions, subscriptions, aiRequests, activeSubscriptionsCount] =
      await Promise.all([
        this.prisma.platformCommission.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        this.prisma.organizationSubscription.findMany({
          where: { status: 'ACTIVE' },
          include: { plan: true },
        }),
        this.prisma.aiRequestRecord.findMany({
          where: { status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        this.prisma.organizationSubscription.count({
          where: { status: 'ACTIVE' },
        }),
      ]);

    const totalCommissions = commissions.reduce(
      (acc, c) => acc + Number(c.feeAmount),
      0,
    );
    const totalGrossTrade = commissions.reduce(
      (acc, c) => acc + Number(c.grossAmount),
      0,
    );
    const totalSubscriptions = subscriptions.reduce(
      (acc, s) => acc + Number(s.plan?.price ?? 0),
      0,
    );
    const totalAiRevenue = aiRequests.reduce(
      (acc, a) => acc + Number(a.cost),
      0,
    );

    const grossRevenue = totalCommissions + totalSubscriptions + totalAiRevenue;
    const estimatedAiCost = totalAiRevenue * 0.25; // 25% model cost
    const estimatedPartnerFee = totalCommissions * 0.1; // 10% payment partner cost
    const netProfit = grossRevenue - (estimatedAiCost + estimatedPartnerFee);

    return {
      overview: {
        grossRevenue,
        netProfit,
        totalCommissions,
        totalGrossTrade,
        totalSubscriptions,
        totalAiRevenue,
        estimatedAiCost,
        estimatedPartnerFee,
        activeSubscriptionsCount,
        currency: 'ETB',
      },
      revenueByStream: [
        { name: 'B2B Trade Commissions', value: totalCommissions, percentage: grossRevenue > 0 ? (totalCommissions / grossRevenue) * 100 : 0 },
        { name: 'SaaS Subscriptions', value: totalSubscriptions, percentage: grossRevenue > 0 ? (totalSubscriptions / grossRevenue) * 100 : 0 },
        { name: 'Pay-per-use AI Services', value: totalAiRevenue, percentage: grossRevenue > 0 ? (totalAiRevenue / grossRevenue) * 100 : 0 },
      ],
      recentCommissions: commissions.slice(0, 10),
      recentAiUsage: aiRequests.slice(0, 10),
    };
  }

  async listOrganizations(query: { q?: string; offset?: number; limit?: number }) {
    const offset = Math.max(0, Number(query.offset ?? 0));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const q = query.q?.trim();
    const where = q
      ? {
          OR: [
            { legalName: { contains: q, mode: 'insensitive' as const } },
            { tradingName: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: { _count: { select: { members: true, branches: true } } },
      }),
      this.prisma.organization.count({ where }),
    ]);
    return { items, total, offset, limit };
  }

  async listUsers(query: { q?: string; status?: string; offset?: number; limit?: number }) {
    const offset = Math.max(0, Number(query.offset ?? 0));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const q = query.q?.trim();
    const status = query.status?.trim();
    const where: any = {};
    
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
      ];
    }
    
    if (status) {
      where.approvalStatus = status;
    }
    
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          platformRole: true,
          approvalStatus: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, offset, limit };
  }

  async approveUser(userId: string, reviewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    if (user.approvalStatus === 'APPROVED') {
      throw new ApiError('INVALID_STATUS', 'User is already approved', 400);
    }
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: 'APPROVED' },
    });
    
    if (reviewerId) {
      await this.audit.record({
        action: 'USER_APPROVAL',
        userId: reviewerId,
        entity: 'User',
        entityId: userId,
        newValue: { approvalStatus: 'APPROVED' },
      });
    }
    
    return { userId, status: 'APPROVED' };
  }

  async rejectUser(userId: string, reviewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    if (user.approvalStatus === 'REJECTED') {
      throw new ApiError('INVALID_STATUS', 'User is already rejected', 400);
    }
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: 'REJECTED' },
    });
    
    if (reviewerId) {
      await this.audit.record({
        action: 'USER_REJECTION',
        userId: reviewerId,
        entity: 'User',
        entityId: userId,
        newValue: { approvalStatus: 'REJECTED' },
      });
    }
    
    return { userId, status: 'REJECTED' };
  }

  async listFeatureRequests(query: { status?: string }) {
    const where = query.status ? { status: query.status as any } : {};
    const items = await this.prisma.featureRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { id: true, legalName: true } },
        feature: { select: { id: true, code: true, nameKey: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
      },
    });
    return { items, total: items.length, offset: 0, limit: items.length };
  }

  async reviewFeatureRequest(
    requestId: string,
    approve: boolean,
    note?: string,
    reviewerId?: string,
  ) {
    const request = await this.prisma.featureRequest.findUnique({
      where: { id: requestId },
      include: { feature: true },
    });
    if (!request) {
      throw new NotFoundError('Feature request not found');
    }
    if (request.status !== 'PENDING') {
      throw new ApiError(
        'INVALID_STATUS',
        `Feature request already ${request.status.toLowerCase()}`,
        400,
      );
    }

    let status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' = request.status;
    await this.prisma.$transaction(async (tx) => {
      if (approve) {
        const existing = await tx.organizationFeature.findUnique({
          where: {
            organizationId_featureId: {
              organizationId: request.organizationId,
              featureId: request.featureId,
            },
          },
        });
        if (existing) {
          await tx.organizationFeature.update({
            where: { id: existing.id },
            data: { status: 'ACTIVE', activationDate: new Date() },
          });
        } else {
          await tx.organizationFeature.create({
            data: {
              organizationId: request.organizationId,
              featureId: request.featureId,
              status: 'ACTIVE',
              activationDate: new Date(),
            },
          });
        }
        status = 'APPROVED';
      } else {
        status = 'REJECTED';
      }
      await tx.featureRequest.update({
        where: { id: requestId },
        data: { status, reviewedById: reviewerId ?? null, reviewNote: note, reviewReason: approve ? 'APPROVED' : 'REJECTED', reviewedAt: new Date() },
      });
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.FEATURE_REQUEST_REVIEW,
      organizationId: request.organizationId,
      userId: reviewerId,
      entity: 'FeatureRequest',
      entityId: requestId,
      newValue: { status, note },
    });

    return { requestId, status, note };
  }

  async auditLogs(query: {
    action?: string;
    organizationId?: string;
    userId?: string;
    offset?: number;
    limit?: number;
  }) {
    const offset = Math.max(0, Number(query.offset ?? 0));
    const limit = Math.min(200, Math.max(1, Number(query.limit ?? 50)));
    const where = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, offset, limit };
  }
}