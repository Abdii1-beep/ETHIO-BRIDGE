import { Injectable } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberContext } from '../common/guards/org-member.guard';
import { ApiError, NotFoundError } from '../common/errors';
import { AUDIT_ACTIONS } from '../shared';

export class DepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(member: MemberContext, dto: DepartmentDto) {
    const department = await this.prisma.department.create({
      data: {
        organizationId: member.organizationId,
        name: dto.name,
        description: dto.description,
      },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.CREATE_DEPARTMENT,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Department',
      entityId: department.id,
      newValue: dto,
    });
    return department;
  }

  async list(member: MemberContext) {
    return this.prisma.department.findMany({
      where: { organizationId: member.organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getById(member: MemberContext, id: string) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new NotFoundError('Department not found.');
    }
    if (department.organizationId !== member.organizationId) {
      throw new ApiError('FORBIDDEN', 'You cannot access resources of another organization.', 403);
    }
    return department;
  }

  async update(member: MemberContext, id: string, dto: Partial<DepartmentDto>) {
    const before = await this.requireOwn(member, id);
    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.UPDATE_DEPARTMENT,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Department',
      entityId: id,
      oldValue: before,
      newValue: updated,
    });
    return updated;
  }

  async remove(member: MemberContext, id: string) {
    const department = await this.requireOwn(member, id);
    const updated = await this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.DELETE_DEPARTMENT,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Department',
      entityId: id,
      oldValue: { name: department.name, isActive: department.isActive },
      reason: 'Soft-delete: department deactivated',
    });
    return updated;
  }

  private async requireOwn(member: MemberContext, id: string) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new NotFoundError('Department not found.');
    }
    if (department.organizationId !== member.organizationId) {
      throw new ApiError('FORBIDDEN', 'You cannot access resources of another organization.', 403);
    }
    return department;
  }
}