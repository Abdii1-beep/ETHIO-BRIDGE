import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberContext } from '../common/guards/org-member.guard';
import { ApiError, NotFoundError } from '../common/errors';
import { AUDIT_ACTIONS, PERMISSIONS, PERMISSION_CODES, PermissionCategories } from '../shared';

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionCodes!: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionCodes?: string[];
}

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(member: MemberContext) {
    return this.prisma.role.findMany({
      where: { organizationId: member.organizationId },
      include: {
        _count: { select: { memberRoles: true } },
        permissions: { include: { permission: { select: { code: true, category: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Full permission catalog (grouped by category) for the role permission editor. */
  catalog() {
    return PermissionCategories.map((category) => ({
      category,
      permissions: PERMISSIONS.filter((p) => p.category === category).map((p) => ({
        code: p.code,
        nameKey: p.nameKey,
        descriptionKey: p.descriptionKey,
      })),
    }));
  }

  async getById(member: MemberContext, id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        memberRoles: { include: { member: { include: { user: { select: { name: true, email: true } } } } } },
      },
    });
    if (!role || role.organizationId !== member.organizationId) {
      throw new NotFoundError('Role not found in this organization.');
    }
    return role;
  }

  async create(member: MemberContext, dto: CreateRoleDto) {
    await this.validatePermissionCodes(dto.permissionCodes);
    const role = await this.prisma.role.create({
      data: {
        organizationId: member.organizationId,
        name: dto.name,
        description: dto.description,
        isBuiltIn: false,
        permissions: {
          create: (await this.resolvePermissionIds(dto.permissionCodes)).map((permissionId) => ({
            permission: { connect: { id: permissionId } },
          })),
        },
      },
    });
    await this.audit.record({
      action: AUDIT_ACTIONS.CREATE_ROLE,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Role',
      entityId: role.id,
      newValue: { name: dto.name, permissionCodes: dto.permissionCodes },
    });
    return role;
  }

  async update(member: MemberContext, id: string, dto: UpdateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== member.organizationId) {
      throw new NotFoundError('Role not found in this organization.');
    }
    if (existing.isBuiltIn && dto.permissionCodes) {
      throw new ApiError('VALIDATION_FAILED', 'Built-in role permissions cannot be modified.', 400);
    }

    if (dto.permissionCodes !== undefined) {
      dto.permissionCodes = await this.validatePermissionCodes(dto.permissionCodes);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
        },
      });
      if (dto.permissionCodes) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        const ids = await this.resolvePermissionIds(dto.permissionCodes, tx);
        await tx.rolePermission.createMany({
          data: ids.map((permissionId) => ({ roleId: id, permissionId })),
        });
      }
      return role;
    });

    await this.audit.record({
      action: AUDIT_ACTIONS.UPDATE_ROLE,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Role',
      entityId: id,
      oldValue: { name: existing.name },
      newValue: dto,
    });
    return updated;
  }

  async remove(member: MemberContext, id: string) {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== member.organizationId) {
      throw new NotFoundError('Role not found in this organization.');
    }
    if (existing.isBuiltIn) {
      throw new ApiError('VALIDATION_FAILED', 'Built-in roles cannot be deleted.', 400);
    }
    const memberCount = await this.prisma.memberRole.count({ where: { roleId: id } });
    if (memberCount > 0) {
      throw new ApiError('CONFLICT', 'Cannot delete a role that is assigned to members.', 409);
    }
    await this.prisma.role.delete({ where: { id } });
    await this.audit.record({
      action: AUDIT_ACTIONS.DELETE_ROLE,
      organizationId: member.organizationId,
      userId: member.userId,
      entity: 'Role',
      entityId: id,
      oldValue: { name: existing.name },
    });
    return { deleted: true };
  }

  private async validatePermissionCodes(codes: string[]): Promise<string[]> {
    const unknown = codes.filter((c) => !PERMISSION_CODES.includes(c));
    if (unknown.length > 0) {
      throw new ApiError('VALIDATION_FAILED', `Unknown permission codes: ${unknown.join(', ')}`, 400);
    }
    return codes;
  }

  private async resolvePermissionIds(
    codes: string[],
    tx?: Prisma.TransactionClient,
  ): Promise<string[]> {
    const client = tx ?? this.prisma;
    const records = await client.permission.findMany({ where: { code: { in: codes } } });
    const byCode = new Map(records.map((p) => [p.code, p.id]));
    return codes.map((c) => byCode.get(c)).filter((id): id is string => Boolean(id));
  }
}