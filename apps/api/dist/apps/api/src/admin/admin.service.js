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
exports.AdminService = exports.SmtpTestDto = exports.ApproveFeatureRequestDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../common/errors");
const shared_1 = require("../shared");
class ApproveFeatureRequestDto {
    note;
}
exports.ApproveFeatureRequestDto = ApproveFeatureRequestDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], ApproveFeatureRequestDto.prototype, "note", void 0);
class SmtpTestDto {
    to;
}
exports.SmtpTestDto = SmtpTestDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SmtpTestDto.prototype, "to", void 0);
let AdminService = class AdminService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async overview() {
        const [organizations, users, members, featureRequests, auditLogs, products, rfqs, orders] = await Promise.all([
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
        const [commissions, subscriptions, aiRequests, activeSubscriptionsCount] = await Promise.all([
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
        const totalCommissions = commissions.reduce((acc, c) => acc + Number(c.feeAmount), 0);
        const totalGrossTrade = commissions.reduce((acc, c) => acc + Number(c.grossAmount), 0);
        const totalSubscriptions = subscriptions.reduce((acc, s) => acc + Number(s.plan?.price ?? 0), 0);
        const totalAiRevenue = aiRequests.reduce((acc, a) => acc + Number(a.cost), 0);
        const grossRevenue = totalCommissions + totalSubscriptions + totalAiRevenue;
        const estimatedAiCost = totalAiRevenue * 0.25;
        const estimatedPartnerFee = totalCommissions * 0.1;
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
    async listOrganizations(query) {
        const offset = Math.max(0, Number(query.offset ?? 0));
        const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
        const q = query.q?.trim();
        const where = q
            ? {
                OR: [
                    { legalName: { contains: q, mode: 'insensitive' } },
                    { tradingName: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
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
    async listUsers(query) {
        const offset = Math.max(0, Number(query.offset ?? 0));
        const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
        const q = query.q?.trim();
        const status = query.status?.trim();
        const where = {};
        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
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
    async approveUser(userId, reviewerId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        if (user.approvalStatus === 'APPROVED') {
            throw new errors_1.ApiError('INVALID_STATUS', 'User is already approved', 400);
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
    async rejectUser(userId, reviewerId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        if (user.approvalStatus === 'REJECTED') {
            throw new errors_1.ApiError('INVALID_STATUS', 'User is already rejected', 400);
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
    async listFeatureRequests(query) {
        const where = query.status ? { status: query.status } : {};
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
    async reviewFeatureRequest(requestId, approve, note, reviewerId) {
        const request = await this.prisma.featureRequest.findUnique({
            where: { id: requestId },
            include: { feature: true },
        });
        if (!request) {
            throw new errors_1.NotFoundError('Feature request not found');
        }
        if (request.status !== 'PENDING') {
            throw new errors_1.ApiError('INVALID_STATUS', `Feature request already ${request.status.toLowerCase()}`, 400);
        }
        let status = request.status;
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
                }
                else {
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
            }
            else {
                status = 'REJECTED';
            }
            await tx.featureRequest.update({
                where: { id: requestId },
                data: { status, reviewedById: reviewerId ?? null, reviewNote: note, reviewReason: approve ? 'APPROVED' : 'REJECTED', reviewedAt: new Date() },
            });
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.FEATURE_REQUEST_REVIEW,
            organizationId: request.organizationId,
            userId: reviewerId,
            entity: 'FeatureRequest',
            entityId: requestId,
            newValue: { status, note },
        });
        return { requestId, status, note };
    }
    async auditLogs(query) {
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AdminService);
//# sourceMappingURL=admin.service.js.map