import { OrganizationBusinessType, PrismaClient } from '@prisma/client';
import {
  BUILT_IN_ROLES,
  FEATURES,
  FEATURE_CODES,
  PERMISSION_CODES,
  BuiltInRoleCodes,
} from '../../../../packages/shared/src';

export interface RoleLabelMap {
  [key: string]: string;
}

export const BUILT_IN_ROLE_LABELS: RoleLabelMap = {
  COMPANY_OWNER: 'Owner',
  COMPANY_ADMIN: 'Administrator',
  COMPANY_MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
  INTERNAL_AUDITOR: 'Internal Auditor',
  EXTERNAL_AUDITOR: 'External Auditor',
};

/**
 * Core feature codes activated automatically when an organization is created (SDD §17–19).
 * Derived from the shared catalog so the seed and runtime provisioning never drift.
 */
export function coreFeatureCodes(): string[] {
  return FEATURES.filter(
    (f) => f.isOperational && f.implementationStatus !== 'NOT_IMPLEMENTED',
  ).map((f) => f.code);
}

export function allFeatureCodes(): string[] {
  return FEATURE_CODES;
}

/**
 * Provision a new company tenant: organization + owner membership + built-in roles with
 * permissions + activation of core features. Shared by the runtime service and the seed.
 */
export async function provisionOrganization(
  prisma: PrismaClient,
  input: {
    ownerUserId: string;
    legalName: string;
    tradingName?: string;
    businessType: string;
    industry?: string;
    yearEstablished?: number;
    description?: string;
    country?: string;
    region?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    registrationNumber?: string;
    tin?: string;
    preferredLanguage?: string;
  },
): Promise<{ organizationId: string }> {
  const organization = await prisma.organization.create({
    data: {
      ownerUserId: input.ownerUserId,
      legalName: input.legalName,
      tradingName: input.tradingName,
      businessType: input.businessType as OrganizationBusinessType,
      industry: input.industry,
      yearEstablished: input.yearEstablished,
      description: input.description,
      country: input.country,
      region: input.region,
      city: input.city,
      address: input.address,
      phone: input.phone,
      email: input.email,
      website: input.website,
      registrationNumber: input.registrationNumber,
      tin: input.tin,
      preferredLanguage: input.preferredLanguage ?? 'en',
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: organization.id,
      userId: input.ownerUserId,
      status: 'ACTIVE',
      title: 'Owner',
      joinedAt: new Date(),
      invitedAt: new Date(),
    },
  });

  const permissionRecords = await prisma.permission.findMany({
    where: { code: { in: PERMISSION_CODES } },
  });
  const permissionIdByCode = new Map(permissionRecords.map((p) => [p.code, p.id]));

  const builtInCodes = Object.values(BuiltInRoleCodes);
  for (const code of builtInCodes) {
    const permissionCodes = BUILT_IN_ROLES[code as keyof typeof BUILT_IN_ROLES] ?? [];
    const rolePermissions = permissionCodes
      .map((c) => permissionIdByCode.get(c))
      .filter((id): id is string => Boolean(id));

    await prisma.role.create({
      data: {
        organizationId: organization.id,
        code,
        name: BUILT_IN_ROLE_LABELS[code] ?? code,
        isBuiltIn: true,
        permissions: {
          create: rolePermissions.map((permissionId) => ({ permission: { connect: { id: permissionId } } })),
        },
      },
    });
  }

  const ownerRole = await prisma.role.findFirst({
    where: { organizationId: organization.id, code: BuiltInRoleCodes.COMPANY_OWNER },
  });
  if (ownerRole) {
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: input.ownerUserId,
        },
      },
    });
    if (member) {
      await prisma.memberRole.create({
        data: { memberId: member.id, roleId: ownerRole.id },
      });
    }
  }

  const coreFeatures = await prisma.feature.findMany({
    where: { code: { in: coreFeatureCodes() } },
  });
  if (coreFeatures.length) {
    await prisma.organizationFeature.createMany({
      data: coreFeatures.map((f) => ({
        organizationId: organization.id,
        featureId: f.id,
        status: 'ACTIVE',
        activationDate: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  return { organizationId: organization.id };
}