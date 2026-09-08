"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILT_IN_ROLE_LABELS = void 0;
exports.coreFeatureCodes = coreFeatureCodes;
exports.allFeatureCodes = allFeatureCodes;
exports.provisionOrganization = provisionOrganization;
const src_1 = require("../../../../packages/shared/src");
exports.BUILT_IN_ROLE_LABELS = {
    COMPANY_OWNER: 'Owner',
    COMPANY_ADMIN: 'Administrator',
    COMPANY_MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
    INTERNAL_AUDITOR: 'Internal Auditor',
    EXTERNAL_AUDITOR: 'External Auditor',
};
function coreFeatureCodes() {
    return src_1.FEATURES.filter((f) => f.isOperational && f.implementationStatus !== 'NOT_IMPLEMENTED').map((f) => f.code);
}
function allFeatureCodes() {
    return src_1.FEATURE_CODES;
}
async function provisionOrganization(prisma, input) {
    const organization = await prisma.organization.create({
        data: {
            ownerUserId: input.ownerUserId,
            legalName: input.legalName,
            tradingName: input.tradingName,
            businessType: input.businessType,
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
        where: { code: { in: src_1.PERMISSION_CODES } },
    });
    const permissionIdByCode = new Map(permissionRecords.map((p) => [p.code, p.id]));
    const builtInCodes = Object.values(src_1.BuiltInRoleCodes);
    for (const code of builtInCodes) {
        const permissionCodes = src_1.BUILT_IN_ROLES[code] ?? [];
        const rolePermissions = permissionCodes
            .map((c) => permissionIdByCode.get(c))
            .filter((id) => Boolean(id));
        await prisma.role.create({
            data: {
                organizationId: organization.id,
                code,
                name: exports.BUILT_IN_ROLE_LABELS[code] ?? code,
                isBuiltIn: true,
                permissions: {
                    create: rolePermissions.map((permissionId) => ({ permission: { connect: { id: permissionId } } })),
                },
            },
        });
    }
    const ownerRole = await prisma.role.findFirst({
        where: { organizationId: organization.id, code: src_1.BuiltInRoleCodes.COMPANY_OWNER },
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
//# sourceMappingURL=provision.js.map