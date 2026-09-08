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
exports.FeaturesService = exports.FeatureRequestDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../common/errors");
const shared_1 = require("../shared");
class FeatureRequestDto {
    featureCode;
    note;
}
exports.FeatureRequestDto = FeatureRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FeatureRequestDto.prototype, "featureCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], FeatureRequestDto.prototype, "note", void 0);
let FeaturesService = class FeaturesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async catalog(member) {
        const features = await this.prisma.feature.findMany({
            orderBy: { sortOrder: 'asc' },
        });
        const orgFeatures = await this.prisma.organizationFeature.findMany({
            where: { organizationId: member.organizationId },
        });
        const pendingRequests = await this.prisma.featureRequest.findMany({
            where: { organizationId: member.organizationId, status: 'PENDING' },
        });
        const byFeatureId = new Map(orgFeatures.map((of) => [of.featureId, of]));
        const pendingByFeatureId = new Map(pendingRequests.map((r) => [r.featureId, r]));
        return features.map((f) => ({
            id: f.id,
            code: f.code,
            nameKey: f.nameKey,
            descriptionKey: f.descriptionKey,
            category: f.category,
            billingType: f.billingType,
            implementationStatus: f.implementationStatus,
            isOperational: f.isOperational,
            sortOrder: f.sortOrder,
            entitlement: byFeatureId.get(f.id) ?? null,
            pendingRequest: pendingByFeatureId.get(f.id) ?? null,
        }));
    }
    async myFeatures(member) {
        const features = await this.prisma.feature.findMany({ orderBy: { sortOrder: 'asc' } });
        const orgFeatures = await this.prisma.organizationFeature.findMany({
            where: { organizationId: member.organizationId, status: 'ACTIVE' },
        });
        const activeIds = new Set(orgFeatures.map((of) => of.featureId));
        const active = [];
        const available = [];
        for (const f of features) {
            if (!f.isActive) {
                continue;
            }
            if (activeIds.has(f.id)) {
                active.push(f);
            }
            else {
                available.push(f);
            }
        }
        return {
            active: active.map((f) => ({
                id: f.id,
                code: f.code,
                nameKey: f.nameKey,
                descriptionKey: f.descriptionKey,
                category: f.category,
                billingType: f.billingType,
                implementationStatus: f.implementationStatus,
                isOperational: f.isOperational,
            })),
            available: available.map((f) => ({
                id: f.id,
                code: f.code,
                nameKey: f.nameKey,
                descriptionKey: f.descriptionKey,
                category: f.category,
                billingType: f.billingType,
                implementationStatus: f.implementationStatus,
                isOperational: f.isOperational,
            })),
        };
    }
    async request(member, dto) {
        const feature = await this.prisma.feature.findUnique({ where: { code: dto.featureCode } });
        if (!feature) {
            throw new errors_1.NotFoundError('Feature not found.');
        }
        const existing = await this.prisma.organizationFeature.findUnique({
            where: {
                organizationId_featureId: {
                    organizationId: member.organizationId,
                    featureId: feature.id,
                },
            },
        });
        if (existing && existing.status === 'ACTIVE') {
            throw new errors_1.ApiError('CONFLICT', 'This feature is already active for your organization.', 409);
        }
        if (feature.billingType === 'FREE' && feature.isOperational && feature.implementationStatus === 'IMPLEMENTED') {
            if (existing) {
                await this.prisma.organizationFeature.update({
                    where: { id: existing.id },
                    data: { status: 'ACTIVE', activationDate: new Date(), expirationDate: null },
                });
            }
            else {
                await this.prisma.organizationFeature.create({
                    data: {
                        organizationId: member.organizationId,
                        featureId: feature.id,
                        status: 'ACTIVE',
                        activationDate: new Date(),
                        usageLimit: feature.defaultUsageLimit,
                        billingType: 'FREE',
                    },
                });
            }
            await this.audit.record({
                action: shared_1.AUDIT_ACTIONS.FEATURE_ACTIVATION,
                organizationId: member.organizationId,
                userId: member.userId,
                entity: 'Feature',
                entityId: feature.id,
                newValue: { code: feature.code, mode: 'self_service' },
            });
            return { activated: true, featureCode: feature.code, status: 'ACTIVE' };
        }
        const pending = await this.prisma.featureRequest.findFirst({
            where: { organizationId: member.organizationId, featureId: feature.id, status: 'PENDING' },
        });
        if (pending) {
            throw new errors_1.ApiError('CONFLICT', 'A request for this feature is already pending platform review.', 409);
        }
        const request = await this.prisma.featureRequest.create({
            data: {
                organizationId: member.organizationId,
                featureId: feature.id,
                requestedByUserId: member.userId,
                note: dto.note,
                status: 'PENDING',
            },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.FEATURE_REQUEST,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'FeatureRequest',
            entityId: request.id,
            newValue: { code: feature.code, billingType: feature.billingType },
        });
        return {
            activated: false,
            featureCode: feature.code,
            status: 'REQUESTED',
            reason: 'This feature requires platform review. It will not appear as operational until approved and activated.',
        };
    }
    async activate(member, featureId, note) {
        const feature = await this.prisma.feature.findUnique({ where: { id: featureId } });
        if (!feature) {
            throw new errors_1.NotFoundError('Feature not found.');
        }
        return this.request(member, { featureCode: feature.code, note });
    }
    async deactivate(member, featureId) {
        const feature = await this.prisma.feature.findUnique({ where: { id: featureId } });
        if (!feature) {
            throw new errors_1.NotFoundError('Feature not found.');
        }
        const existing = await this.prisma.organizationFeature.findUnique({
            where: {
                organizationId_featureId: {
                    organizationId: member.organizationId,
                    featureId,
                },
            },
        });
        if (!existing) {
            throw new errors_1.NotFoundError('This feature is not activated for your organization.');
        }
        const updated = await this.prisma.organizationFeature.update({
            where: { id: existing.id },
            data: { status: 'DISABLED' },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.FEATURE_DEACTIVATION,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Feature',
            entityId: featureId,
            oldValue: { status: existing.status },
            newValue: { status: 'DISABLED', code: feature.code },
        });
        return updated;
    }
};
exports.FeaturesService = FeaturesService;
exports.FeaturesService = FeaturesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], FeaturesService);
//# sourceMappingURL=features.service.js.map