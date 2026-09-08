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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../common/errors");
const shared_1 = require("../shared");
const provision_1 = require("./provision");
let OrganizationsService = class OrganizationsService {
    prisma;
    audit;
    config;
    constructor(prisma, audit, config) {
        this.prisma = prisma;
        this.audit = audit;
        this.config = config;
    }
    async directory(q, limit) {
        const take = Math.min(Math.max(limit ?? 20, 1), 50);
        const keyword = (q ?? '').trim();
        const where = {
            status: 'ACTIVE',
            ...(keyword.length > 0
                ? {
                    OR: [
                        { legalName: { contains: keyword, mode: 'insensitive' } },
                        { tradingName: { contains: keyword, mode: 'insensitive' } },
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
    async create(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new errors_1.NotFoundError('User not found.');
        }
        if (this.config.get('OTP_REQUIRED') === 'true' && !user.isEmailVerified) {
            throw new errors_1.ApiError('EMAIL_NOT_VERIFIED', 'Verify your email address before creating an organization.', 403);
        }
        if (!shared_1.ORGANIZATION_BUSINESS_TYPES.includes(dto.businessType)) {
            throw new errors_1.ApiError('VALIDATION_FAILED', `businessType must be one of: ${shared_1.ORGANIZATION_BUSINESS_TYPES.join(', ')}`, 400);
        }
        const existing = await this.prisma.organization.findFirst({
            where: {
                ownerUserId: userId,
                legalName: { equals: dto.legalName, mode: 'insensitive' },
            },
            select: { id: true },
        });
        if (existing) {
            throw new errors_1.ConflictError(`You already own an organization named "${dto.legalName}".`);
        }
        const { organizationId } = await (0, provision_1.provisionOrganization)(this.prisma, {
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
            action: shared_1.AUDIT_ACTIONS.CREATE_ORGANIZATION,
            organizationId,
            userId,
            entity: 'Organization',
            entityId: organizationId,
            newValue: { legalName: dto.legalName, businessType: dto.businessType },
        });
        return this.prisma.organization.findUnique({ where: { id: organizationId } });
    }
    async myOrganizations(userId) {
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
    async getById(member, id) {
        if (id !== member.organizationId) {
            throw new errors_1.ApiError('FORBIDDEN', 'You cannot access another organization.', 403);
        }
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                _count: { select: { branches: true, departments: true, members: true } },
            },
        });
        if (!org) {
            throw new errors_1.NotFoundError('Organization not found.');
        }
        return org;
    }
    async update(member, id, dto) {
        if (id !== member.organizationId) {
            throw new errors_1.ApiError('FORBIDDEN', 'You cannot access another organization.', 403);
        }
        const before = await this.prisma.organization.findUnique({ where: { id } });
        if (!before) {
            throw new errors_1.NotFoundError('Organization not found.');
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
            action: shared_1.AUDIT_ACTIONS.EDIT_ORGANIZATION,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'Organization',
            entityId: id,
            oldValue: { ...before },
            newValue: dto,
        });
        return updated;
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        config_1.ConfigService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map