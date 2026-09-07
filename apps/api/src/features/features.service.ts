import { Injectable } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberContext } from '../common/guards/org-member.guard';
import { ApiError, NotFoundError } from '../common/errors';
import { AUDIT_ACTIONS } from '../shared';

export class FeatureRequestDto {
  @IsString()
  @IsNotEmpty()
  featureCode!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  note?: string;
}

@Injectable()
export class FeaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Catalog + the requesting organization's entitlement state for each feature.
   */
  async catalog(member: MemberContext) {
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

  /**
   * Grouped entitlement for the UI navigation (SDD §18): only ACTIVE features appear in navigation.
   */
  async myFeatures(member: MemberContext) {
    const features = await this.prisma.feature.findMany({ orderBy: { sortOrder: 'asc' } });
    const orgFeatures = await this.prisma.organizationFeature.findMany({
      where: { organizationId: member.organizationId, status: 'ACTIVE' },
    });
    const activeIds = new Set(orgFeatures.map((of) => of.featureId));

    const active: typeof features = [];
    const available: typeof features = [];

    for (const f of features) {
      if (!f.isActive) {
        continue;
      }
      if (activeIds.has(f.id)) {
        active.push(f);
      } else {
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

  /**
   * Self-service activation. FREE + IMPLEMENTED + OPERATIONAL features activate immediately.
   * Paid or partial features are raised as a PENDING platform request (no fake payment).
   */
  async request(member: MemberContext, dto: FeatureRequestDto) {
    const feature = await this.prisma.feature.findUnique({ where: { code: dto.featureCode } });
    if (!feature) {
      throw new NotFoundError('Feature not found.');
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
      throw new ApiError('CONFLICT', 'This feature is already active for your organization.', 409);
    }

    if (feature.billingType === 'FREE' && feature.isOperational && feature.implementationStatus === 'IMPLEMENTED') {
      if (existing) {
        await this.prisma.organizationFeature.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE', activationDate: new Date(), expirationDate: null },
        });
      } else {
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
        action: AUDIT_ACTIONS.FEATURE_ACTIVATION,
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
      throw new ApiError('CONFLICT', 'A request for this feature is already pending platform review.', 409);
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
      action: AUDIT_ACTIONS.FEATURE_REQUEST,
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
      reason:
        'This feature requires platform review. It will not appear as operational until approved and activated.',
    };
  }

  /**
   * Alternative activation entrypoint by feature id. Delegates to request().
   */
  async activate(member: MemberContext, featureId: string, note?: string) {
    const feature = await this.prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) {
      throw new NotFoundError('Feature not found.');
    }
    return this.request(member, { featureCode: feature.code, note });
  }

  async deactivate(member: MemberContext, featureId: string) {
    const feature = await this.prisma.feature.findUnique({ where: { id: featureId } });
    if (!feature) {
      throw new NotFoundError('Feature not found.');
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
      throw new NotFoundError('This feature is not activated for your organization.');
    }
    const updated = await this.prisma.organizationFeature.update({
      where: { id: existing.id },
      data: { status: 'DISABLED' },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.FEATURE_DEACTIVATION,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Feature',
      entityId: featureId,
      oldValue: { status: existing.status },
      newValue: { status: 'DISABLED', code: feature.code },
    });
    return updated;
  }
}