import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { FeatureNotEnabledError } from '../errors';
import { MemberContext } from './org-member.guard';

export const FEATURES_KEY = 'ehio_required_features';
export const RequireFeatures = (...featureCodes: string[]) =>
  SetMetadata(FEATURES_KEY, featureCodes);

/**
 * Verifies that the current organization has each required feature ACTIVE and not expired
 * (SDD §19, §166). Runs after OrgMemberGuard so `member.organizationId` is available.
 */
@Injectable()
export class FeaturesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(FEATURES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const member = ctx
      .switchToHttp()
      .getRequest<Request & { member?: MemberContext }>().member;
    if (!member) {
      throw new FeatureNotEnabledError(required[0]);
    }

    const orgFeatures = await this.prisma.organizationFeature.findMany({
      where: {
        organizationId: member.organizationId,
        feature: { code: { in: required } },
      },
      include: { feature: { select: { code: true } } },
    });

    const now = new Date();
    for (const code of required) {
      const of = orgFeatures.find((f) => f.feature?.code === code);
      const active =
        of &&
        of.status === 'ACTIVE' &&
        (!of.expirationDate || of.expirationDate > now) &&
        of.organizationId === member.organizationId;

      if (!active) {
        throw new FeatureNotEnabledError(code);
      }
    }

    return true;
  }
}