import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OTP_TRANSPORT, OtpTransport } from '../auth/otp-transport';
import { randomDigits, randomToken, sha256 } from '../auth/otp.util';
import { MemberContext } from '../common/guards/org-member.guard';
import { ApiError, ForbiddenError, NotFoundError } from '../common/errors';
import { AUDIT_ACTIONS } from '../shared';

export class InviteUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];
}

export class ClaimInviteDto {
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit number' })
  otp!: string;
}

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(OTP_TRANSPORT) private readonly otpTransport: OtpTransport,
  ) {}

  async list(member: MemberContext) {
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

  async invite(member: MemberContext, dto: InviteUserDto) {
    const inviteCode = randomToken(24);
    const otpCode = randomDigits(6);
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
        claimOtpHash: sha256(otpCode),
        claimOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        invitedByUserId: member.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    try {
      await this.otpTransport.send({ to: dto.email, purpose: 'INVITE_CLAIM', code: otpCode });
    } catch (e) {
      const reason = (e as Error).message ?? 'unknown';
      this.logger.error(`Invite OTP delivery failed -> ${dto.email}: ${reason}`);
      throw new ApiError(
        'OTP_DELIVERY_FAILED',
        'Could not deliver the invitation code. Please try again.',
        502,
      );
    }

    await this.audit.record({
      action: AUDIT_ACTIONS.INVITE_USER,
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

  /**
   * Claim an invitation (authenticated user). The invitee must match the invited email.
   */
  async claim(userId: string, dto: ClaimInviteDto) {
    const invitation = await this.prisma.profileInvitation.findUnique({
      where: { inviteCode: dto.inviteCode },
    });
    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundError('This invitation is invalid or has already been used.');
    }
    if (invitation.expiresAt < new Date()) {
      throw new ApiError('INVITE_INVALID', 'This invitation has expired.', 400);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenError('This invitation was issued to a different email address.');
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

    let memberId: string;
    if (existingMember) {
      memberId = existingMember.id;
      await this.prisma.organizationMember.update({
        where: { id: existingMember.id },
        data: { status: 'ACTIVE', joinedAt: new Date() },
      });
    } else {
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
      action: AUDIT_ACTIONS.JOIN_ORGANIZATION,
      organizationId: invitation.organizationId,
      userId: user.id,
      entity: 'OrganizationMember',
      entityId: memberId,
      newValue: { email: user.email, roleId: invitation.roleId ?? null },
    });

    return { organizationId: invitation.organizationId, memberId };
  }

  async disable(member: MemberContext, targetMemberId: string, reason?: string) {
    const target = await this.prisma.organizationMember.findUnique({
      where: { id: targetMemberId },
    });
    if (!target || target.organizationId !== member.organizationId) {
      throw new NotFoundError('Member not found in this organization.');
    }
    if (target.userId === member.userId) {
      throw new ApiError('VALIDATION_FAILED', 'You cannot disable your own membership.', 400);
    }
    const updated = await this.prisma.organizationMember.update({
      where: { id: targetMemberId },
      data: { status: 'DISABLED' },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.DISABLE_USER,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'OrganizationMember',
      entityId: targetMemberId,
      reason,
    });
    return updated;
  }

  async enable(member: MemberContext, targetMemberId: string) {
    const target = await this.prisma.organizationMember.findUnique({
      where: { id: targetMemberId },
    });
    if (!target || target.organizationId !== member.organizationId) {
      throw new NotFoundError('Member not found in this organization.');
    }
    const updated = await this.prisma.organizationMember.update({
      where: { id: targetMemberId },
      data: { status: 'ACTIVE', joinedAt: new Date() },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.ENABLE_USER,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'OrganizationMember',
      entityId: targetMemberId,
    });
    return updated;
  }

  async updateAssignments(
    member: MemberContext,
    targetMemberId: string,
    dto: { title?: string; roleIds?: string[]; branchIds?: string[]; departmentIds?: string[] },
  ) {
    const target = await this.prisma.organizationMember.findUnique({
      where: { id: targetMemberId },
    });
    if (!target || target.organizationId !== member.organizationId) {
      throw new NotFoundError('Member not found in this organization.');
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
      action: AUDIT_ACTIONS.CHANGE_ROLE,
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

  private async validateRefs(member: MemberContext, dto: InviteUserDto) {
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!role || role.organizationId !== member.organizationId) {
        throw new ApiError('VALIDATION_FAILED', 'Invalid role for this organization.', 400);
      }
    }
    for (const id of dto.branchIds ?? []) {
      const branch = await this.prisma.branch.findUnique({ where: { id } });
      if (!branch || branch.organizationId !== member.organizationId) {
        throw new ApiError('VALIDATION_FAILED', 'Invalid branch for this organization.', 400);
      }
    }
    for (const id of dto.departmentIds ?? []) {
      const department = await this.prisma.department.findUnique({ where: { id } });
      if (!department || department.organizationId !== member.organizationId) {
        throw new ApiError('VALIDATION_FAILED', 'Invalid department for this organization.', 400);
      }
    }
  }

  private async verifyInviteOtp(
    invitationId: string,
    hash: string | null,
    code: string,
    maxAttempts: number,
  ): Promise<void> {
    const invitation = await this.prisma.profileInvitation.findUnique({ where: { id: invitationId } });
    if (!invitation || !hash) {
      throw new ApiError('INVALID_OTP', 'Invalid or missing verification code.', 400);
    }
    if (!invitation.claimOtpExpiresAt || invitation.claimOtpExpiresAt < new Date()) {
      throw new ApiError('OTP_EXPIRED', 'This verification code has expired.', 400);
    }
    if (invitation.claimAttempts >= maxAttempts) {
      throw new ApiError('OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect attempts.', 400);
    }
    if (hash !== sha256(code)) {
      await this.prisma.profileInvitation.update({
        where: { id: invitationId },
        data: { claimAttempts: invitation.claimAttempts + 1 },
      });
      throw new ApiError('INVALID_OTP', 'Incorrect verification code.', 400);
    }
  }

  private async ensureRole(memberId: string, roleId: string): Promise<void> {
    await this.prisma.memberRole.upsert({
      where: { memberId_roleId: { memberId, roleId } },
      create: { memberId, roleId },
      update: {},
    });
  }

  private async ensureBranch(memberId: string, branchId: string): Promise<void> {
    await this.prisma.memberBranch.upsert({
      where: { memberId_branchId: { memberId, branchId } },
      create: { memberId, branchId },
      update: {},
    });
  }

  private async ensureDepartment(memberId: string, departmentId: string): Promise<void> {
    await this.prisma.memberDepartment.upsert({
      where: { memberId_departmentId: { memberId, departmentId } },
      create: { memberId, departmentId },
      update: {},
    });
  }
}