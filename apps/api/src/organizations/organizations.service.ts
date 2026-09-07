import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiError, ConflictError, NotFoundError } from '../common/errors';
import { MemberContext } from '../common/guards/org-member.guard';
import { AUDIT_ACTIONS, ORGANIZATION_BUSINESS_TYPES } from '../shared';
import { provisionOrganization } from './provision';
import { CreateOrganizationDto, UpdateOrganizationDto } from '../auth/auth.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async directory(q?: string, limit?: number) {
    const take = Math.min(Math.max(limit ?? 20, 1), 50);
    const keyword = (q ?? '').trim();
    const where = {
      status: 'ACTIVE' as const,
      ...(keyword.length > 0
        ? {
            OR: [
              { legalName: { contains: keyword, mode: 'insensitive' as const } },
              { tradingName: { contains: keyword, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const orgs = await this.prisma.organization.findMany({
      where,
      take,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        legalName: true,
        tradingName: true,
        businessType: true,
        country: true,
        verificationLevel: true,
        preferredLanguage: true,
        createdAt: true,
      },
    });

    return orgs.map((o) => ({
      ...o,
      displayName: o.tradingName ?? o.legalName,
    }));
  }

  async create(userId: string, dto: CreateOrganizationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    // Email confirmation is only mandatory while the OTP phase (OTP_REQUIRED="true") is on.
    if (this.config.get<string>('OTP_REQUIRED') === 'true' && !user.isEmailVerified) {
      throw new ApiError(
        'EMAIL_NOT_VERIFIED',
        'Verify your email address before creating an organization.',
        403,
      );
    }
    if (!ORGANIZATION_BUSINESS_TYPES.includes(dto.businessType as never)) {
      throw new ApiError(
        'VALIDATION_FAILED',
        `businessType must be one of: ${ORGANIZATION_BUSINESS_TYPES.join(', ')}`,
        400,
      );
    }

    const existing = await this.prisma.organization.findFirst({
      where: {
        ownerUserId: userId,
        legalName: { equals: dto.legalName, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError(
        `You already own an organization named "${dto.legalName}".`,
      );
    }

    const { organizationId } = await provisionOrganization(this.prisma, {
      ownerUserId: userId,
      legalName: dto.legalName,
      tradingName: dto.tradingName,
      businessType: dto.businessType,
      industry: dto.industry,
      yearEstablished: dto.yearEstablished,
      description: dto.description,
      country: dto.country,
      region: dto.region,
      city: dto.city,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      website: dto.website,
      registrationNumber: dto.registrationNumber,
      tin: dto.tin,
      preferredLanguage: dto.preferredLanguage,
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.CREATE_ORGANIZATION,
      organizationId,
      userId,
      entity: 'Organization',
      entityId: organizationId,
      newValue: { legalName: dto.legalName, businessType: dto.businessType },
    });

    return this.prisma.organization.findUnique({ where: { id: organizationId } });
  }

  async myOrganizations(userId: string) {
    return this.prisma.organizationMember.findMany({
      where: { userId },
      orderBy: { joinedAt: 'asc' },
      select: {
        status: true,
        title: true,
        organization: {
          select: {
            id: true,
            legalName: true,
            tradingName: true,
            businessType: true,
            country: true,
            city: true,
            verificationLevel: true,
            status: true,
            preferredLanguage: true,
          },
        },
      },
    });
  }

  async getById(member: MemberContext, id: string) {
    if (id !== member.organizationId) {
      throw new ApiError('FORBIDDEN', 'You cannot access another organization.', 403);
    }
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { branches: true, departments: true, members: true } },
      },
    });
    if (!org) {
      throw new NotFoundError('Organization not found.');
    }
    return org;
  }

  async update(member: MemberContext, id: string, dto: UpdateOrganizationDto) {
    if (id !== member.organizationId) {
      throw new ApiError('FORBIDDEN', 'You cannot access another organization.', 403);
    }
    const before = await this.prisma.organization.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundError('Organization not found.');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.tradingName !== undefined ? { tradingName: dto.tradingName } : {}),
        ...(dto.legalName !== undefined ? { legalName: dto.legalName } : {}),
        ...(dto.industry !== undefined ? { industry: dto.industry } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.country !== undefined ? { country: dto.country } : {}),
        ...(dto.region !== undefined ? { region: dto.region } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.website !== undefined ? { website: dto.website } : {}),
        ...(dto.registrationNumber !== undefined ? { registrationNumber: dto.registrationNumber } : {}),
        ...(dto.tin !== undefined ? { tin: dto.tin } : {}),
        ...(dto.yearEstablished !== undefined ? { yearEstablished: dto.yearEstablished } : {}),
        ...(dto.preferredLanguage !== undefined ? { preferredLanguage: dto.preferredLanguage } : {}),
      },
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.EDIT_ORGANIZATION,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Organization',
      entityId: id,
      oldValue: { ...before },
      newValue: dto,
    });

    return updated;
  }
}