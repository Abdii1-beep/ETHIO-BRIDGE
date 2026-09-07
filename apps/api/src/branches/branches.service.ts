import { Injectable } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberContext } from '../common/guards/org-member.guard';
import { ApiError, NotFoundError } from '../common/errors';
import { AUDIT_ACTIONS } from '../shared';

export class BranchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;
}

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(member: MemberContext, dto: BranchDto) {
    const branch = await this.prisma.branch.create({
      data: {
        organizationId: member.organizationId,
        name: dto.name,
        city: dto.city,
        address: dto.address,
      },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.CREATE_BRANCH,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Branch',
      entityId: branch.id,
      newValue: dto,
    });
    return branch;
  }

  async list(member: MemberContext) {
    return this.prisma.branch.findMany({
      where: { organizationId: member.organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getById(member: MemberContext, id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundError('Branch not found.');
    }
    if (branch.organizationId !== member.organizationId) {
      throw new ApiError('FORBIDDEN', 'You cannot access resources of another organization.', 403);
    }
    return branch;
  }

  async update(member: MemberContext, id: string, dto: Partial<BranchDto>) {
    const before = await this.requireOwnBranch(member, id);
    const updated = await this.prisma.branch.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
      },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.UPDATE_BRANCH,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Branch',
      entityId: id,
      oldValue: before,
      newValue: updated,
    });
    return updated;
  }

  async remove(member: MemberContext, id: string) {
    const branch = await this.requireOwnBranch(member, id);
    const updated = await this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.DELETE_BRANCH,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Branch',
      entityId: id,
      oldValue: { name: branch.name, isActive: branch.isActive },
      reason: 'Soft-delete: branch deactivated',
    });
    return updated;
  }

  private async requireOwnBranch(member: MemberContext, id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new NotFoundError('Branch not found.');
    }
    if (branch.organizationId !== member.organizationId) {
      throw new ApiError('FORBIDDEN', 'You cannot access resources of another organization.', 403);
    }
    return branch;
  }
}