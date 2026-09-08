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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MembersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = exports.ClaimInviteDto = exports.InviteUserDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const otp_transport_1 = require("../auth/otp-transport");
const otp_util_1 = require("../auth/otp.util");
const errors_1 = require("../common/errors");
const shared_1 = require("../shared");
class InviteUserDto {
    email;
    name;
    roleId;
    branchIds;
    departmentIds;
}
exports.InviteUserDto = InviteUserDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], InviteUserDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InviteUserDto.prototype, "roleId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], InviteUserDto.prototype, "branchIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], InviteUserDto.prototype, "departmentIds", void 0);
class ClaimInviteDto {
    inviteCode;
    otp;
}
exports.ClaimInviteDto = ClaimInviteDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ClaimInviteDto.prototype, "inviteCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: 'otp must be a 6-digit number' }),
    __metadata("design:type", String)
], ClaimInviteDto.prototype, "otp", void 0);
let MembersService = MembersService_1 = class MembersService {
    prisma;
    audit;
    otpTransport;
    logger = new common_1.Logger(MembersService_1.name);
    constructor(prisma, audit, otpTransport) {
        this.prisma = prisma;
        this.audit = audit;
        this.otpTransport = otpTransport;
    }
    async list(member) {
        const [members, invitations] = await Promise.all([
            this.prisma.organizationMember.findMany({
                where: { organizationId: member.organizationId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            preferredLanguage: true,
                            isEmailVerified: true,
                            lastLoginAt: true,
                        },
                    },
                    roleAssignments: { include: { role: { select: { id: true, name: true, code: true } } } },
                    branchAssignments: { include: { branch: { select: { id: true, name: true } } } },
                    departmentAssignments: {
                        include: { department: { select: { id: true, name: true } } },
                    },
                },
                orderBy: { joinedAt: 'asc' },
            }),
            this.prisma.profileInvitation.findMany({
                where: { organizationId: member.organizationId, status: { in: ['PENDING', 'CLAIMED'] } },
                orderBy: { invitedAt: 'desc' },
            }),
        ]);
        return { members, invitations };
    }
    async invite(member, dto) {
        const inviteCode = (0, otp_util_1.randomToken)(24);
        const otpCode = (0, otp_util_1.randomDigits)(6);
        await this.validateRefs(member, dto);
        const invitation = await this.prisma.profileInvitation.create({
            data: {
                organizationId: member.organizationId,
                email: dto.email,
                name: dto.name,
                roleId: dto.roleId ?? null,
                branchIds: dto.branchIds ?? [],
                departmentIds: dto.departmentIds ?? [],
                inviteCode,
                claimOtpHash: (0, otp_util_1.sha256)(otpCode),
                claimOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
                invitedByUserId: member.userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        try {
            await this.otpTransport.send({ to: dto.email, purpose: 'INVITE_CLAIM', code: otpCode });
        }
        catch (e) {
            const reason = e.message ?? 'unknown';
            this.logger.error(`Invite OTP delivery failed -> ${dto.email}: ${reason}`);
            throw new errors_1.ApiError('OTP_DELIVERY_FAILED', 'Could not deliver the invitation code. Please try again.', 502);
        }
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.INVITE_USER,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'ProfileInvitation',
            entityId: invitation.id,
            newValue: { email: dto.email, roleId: dto.roleId ?? null },
        });
        return {
            invitationId: invitation.id,
            email: dto.email,
            expiresAt: invitation.expiresAt,
            ...(process.env.NODE_ENV === 'production' ? {} : { devInviteCode: inviteCode, devOtp: otpCode }),
        };
    }
    async claim(userId, dto) {
        const invitation = await this.prisma.profileInvitation.findUnique({
            where: { inviteCode: dto.inviteCode },
        });
        if (!invitation || invitation.status !== 'PENDING') {
            throw new errors_1.NotFoundError('This invitation is invalid or has already been used.');
        }
        if (invitation.expiresAt < new Date()) {
            throw new errors_1.ApiError('INVITE_INVALID', 'This invitation has expired.', 400);
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new errors_1.NotFoundError('User not found.');
        }
        if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
            throw new errors_1.ForbiddenError('This invitation was issued to a different email address.');
        }
        await this.verifyInviteOtp(invitation.id, invitation.claimOtpHash, dto.otp, invitation.maxClaimAttempts);
        const existingMember = await this.prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: invitation.organizationId,
                    userId: user.id,
                },
            },
        });
        let memberId;
        if (existingMember) {
            memberId = existingMember.id;
            await this.prisma.organizationMember.update({
                where: { id: existingMember.id },
                data: { status: 'ACTIVE', joinedAt: new Date() },
            });
        }
        else {
            const created = await this.prisma.organizationMember.create({
                data: {
                    organizationId: invitation.organizationId,
                    userId: user.id,
                    status: 'ACTIVE',
                    invitedAt: invitation.invitedAt,
                    joinedAt: new Date(),
                },
            });
            memberId = created.id;
        }
        if (invitation.roleId) {
            await this.ensureRole(memberId, invitation.roleId);
        }
        for (const branchId of invitation.branchIds) {
            await this.ensureBranch(memberId, branchId);
        }
        for (const departmentId of invitation.departmentIds) {
            await this.ensureDepartment(memberId, departmentId);
        }
        await this.prisma.profileInvitation.update({
            where: { id: invitation.id },
            data: { status: 'CLAIMED', claimedAt: new Date() },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.JOIN_ORGANIZATION,
            organizationId: invitation.organizationId,
            userId: user.id,
            entity: 'OrganizationMember',
            entityId: memberId,
            newValue: { email: user.email, roleId: invitation.roleId ?? null },
        });
        return { organizationId: invitation.organizationId, memberId };
    }
    async disable(member, targetMemberId, reason) {
        const target = await this.prisma.organizationMember.findUnique({
            where: { id: targetMemberId },
        });
        if (!target || target.organizationId !== member.organizationId) {
            throw new errors_1.NotFoundError('Member not found in this organization.');
        }
        if (target.userId === member.userId) {
            throw new errors_1.ApiError('VALIDATION_FAILED', 'You cannot disable your own membership.', 400);
        }
        const updated = await this.prisma.organizationMember.update({
            where: { id: targetMemberId },
            data: { status: 'DISABLED' },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.DISABLE_USER,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'OrganizationMember',
            entityId: targetMemberId,
            reason,
        });
        return updated;
    }
    async enable(member, targetMemberId) {
        const target = await this.prisma.organizationMember.findUnique({
            where: { id: targetMemberId },
        });
        if (!target || target.organizationId !== member.organizationId) {
            throw new errors_1.NotFoundError('Member not found in this organization.');
        }
        const updated = await this.prisma.organizationMember.update({
            where: { id: targetMemberId },
            data: { status: 'ACTIVE', joinedAt: new Date() },
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.ENABLE_USER,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'OrganizationMember',
            entityId: targetMemberId,
        });
        return updated;
    }
    async updateAssignments(member, targetMemberId, dto) {
        const target = await this.prisma.organizationMember.findUnique({
            where: { id: targetMemberId },
        });
        if (!target || target.organizationId !== member.organizationId) {
            throw new errors_1.NotFoundError('Member not found in this organization.');
        }
        await this.prisma.$transaction(async (tx) => {
            if (dto.title !== undefined) {
                await tx.organizationMember.update({ where: { id: targetMemberId }, data: { title: dto.title } });
            }
            if (dto.roleIds) {
                await tx.memberRole.deleteMany({ where: { memberId: targetMemberId } });
                for (const roleId of dto.roleIds) {
                    const role = await tx.role.findUnique({ where: { id: roleId } });
                    if (role && role.organizationId === member.organizationId) {
                        await tx.memberRole.upsert({
                            where: { memberId_roleId: { memberId: targetMemberId, roleId } },
                            create: { memberId: targetMemberId, roleId },
                            update: {},
                        });
                    }
                }
            }
            if (dto.branchIds) {
                await tx.memberBranch.deleteMany({ where: { memberId: targetMemberId } });
                for (const branchId of dto.branchIds) {
                    const branch = await tx.branch.findUnique({ where: { id: branchId } });
                    if (branch && branch.organizationId === member.organizationId) {
                        await tx.memberBranch.create({
                            data: { memberId: targetMemberId, branchId },
                        });
                    }
                }
            }
            if (dto.departmentIds) {
                await tx.memberDepartment.deleteMany({ where: { memberId: targetMemberId } });
                for (const departmentId of dto.departmentIds) {
                    const department = await tx.department.findUnique({ where: { id: departmentId } });
                    if (department && department.organizationId === member.organizationId) {
                        await tx.memberDepartment.create({
                            data: { memberId: targetMemberId, departmentId },
                        });
                    }
                }
            }
        });
        await this.audit.record({
            action: shared_1.AUDIT_ACTIONS.CHANGE_ROLE,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'OrganizationMember',
            entityId: targetMemberId,
            newValue: dto,
        });
        return this.prisma.organizationMember.findUnique({
            where: { id: targetMemberId },
            include: {
                roleAssignments: { include: { role: { select: { id: true, name: true, code: true } } } },
                branchAssignments: { include: { branch: { select: { id: true, name: true } } } },
                departmentAssignments: {
                    include: { department: { select: { id: true, name: true } } },
                },
            },
        });
    }
    async validateRefs(member, dto) {
        if (dto.roleId) {
            const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
            if (!role || role.organizationId !== member.organizationId) {
                throw new errors_1.ApiError('VALIDATION_FAILED', 'Invalid role for this organization.', 400);
            }
        }
        for (const id of dto.branchIds ?? []) {
            const branch = await this.prisma.branch.findUnique({ where: { id } });
            if (!branch || branch.organizationId !== member.organizationId) {
                throw new errors_1.ApiError('VALIDATION_FAILED', 'Invalid branch for this organization.', 400);
            }
        }
        for (const id of dto.departmentIds ?? []) {
            const department = await this.prisma.department.findUnique({ where: { id } });
            if (!department || department.organizationId !== member.organizationId) {
                throw new errors_1.ApiError('VALIDATION_FAILED', 'Invalid department for this organization.', 400);
            }
        }
    }
    async verifyInviteOtp(invitationId, hash, code, maxAttempts) {
        const invitation = await this.prisma.profileInvitation.findUnique({ where: { id: invitationId } });
        if (!invitation || !hash) {
            throw new errors_1.ApiError('INVALID_OTP', 'Invalid or missing verification code.', 400);
        }
        if (!invitation.claimOtpExpiresAt || invitation.claimOtpExpiresAt < new Date()) {
            throw new errors_1.ApiError('OTP_EXPIRED', 'This verification code has expired.', 400);
        }
        if (invitation.claimAttempts >= maxAttempts) {
            throw new errors_1.ApiError('OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect attempts.', 400);
        }
        if (hash !== (0, otp_util_1.sha256)(code)) {
            await this.prisma.profileInvitation.update({
                where: { id: invitationId },
                data: { claimAttempts: invitation.claimAttempts + 1 },
            });
            throw new errors_1.ApiError('INVALID_OTP', 'Incorrect verification code.', 400);
        }
    }
    async ensureRole(memberId, roleId) {
        await this.prisma.memberRole.upsert({
            where: { memberId_roleId: { memberId, roleId } },
            create: { memberId, roleId },
            update: {},
        });
    }
    async ensureBranch(memberId, branchId) {
        await this.prisma.memberBranch.upsert({
            where: { memberId_branchId: { memberId, branchId } },
            create: { memberId, branchId },
            update: {},
        });
    }
    async ensureDepartment(memberId, departmentId) {
        await this.prisma.memberDepartment.upsert({
            where: { memberId_departmentId: { memberId, departmentId } },
            create: { memberId, departmentId },
            update: {},
        });
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = MembersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(otp_transport_1.OTP_TRANSPORT)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService, Object])
], MembersService);
//# sourceMappingURL=members.service.js.map