import { CanActivate, ExecutionContext, Injectable, SetMetadata, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiError, ForbiddenError, UnauthorizedError } from '../errors';
import { JwtUser } from './jwt-auth.guard';
import { updateRequestStore } from '../request-store';

export const REQUIRES_MEMBER_KEY = 'ehio_requires_member';
export const RequiresMember = () => SetMetadata(REQUIRES_MEMBER_KEY, true);

export const ORGANIZATION_HEADER = 'x-organization-id';

export interface MemberContext {
  userId: string;
  organizationId: string;
  memberId: string;
  roles: string[];
  permissions: string[];
}

export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MemberContext | undefined => {
    return ctx.switchToHttp().getRequest<Request & { member?: MemberContext }>().member;
  },
);

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiresMember = this.reflector.getAllAndOverride<boolean>(REQUIRES_MEMBER_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiresMember) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser; member?: MemberContext }>();
    if (!req.user) {
      throw new UnauthorizedError('Authentication is required.');
    }

    const organizationId = (req.headers[ORGANIZATION_HEADER] as string | undefined)?.trim();
    if (!organizationId) {
      throw new ApiError(
        'ORGANIZATION_HEADER_REQUIRED',
        `The "${ORGANIZATION_HEADER}" header is required for this request.`,
        400,
      );
    }

    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: req.user.sub } },
      include: {
        organization: { select: { status: true } },
        roleAssignments: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });

    if (!member) {
      throw new ForbiddenError('You are not a member of this organization.');
    }
    if (member.organization.status === 'SUSPENDED') {
      throw new ApiError('ACCOUNT_SUSPENDED', 'This organization is suspended.', 403);
    }
    if (member.status !== 'ACTIVE') {
      throw new ForbiddenError('Your membership is not active.');
    }

    const roles = member.roleAssignments.map((ra) => ra.role.code ?? ra.role.name);
    const permissions = [
      ...new Set(
        member.roleAssignments.flatMap((ra) =>
          ra.role.permissions.map((rp) => rp.permission.code),
        ),
      ),
    ];

    req.member = {
      userId: req.user.sub,
      organizationId,
      memberId: member.id,
      roles,
      permissions,
    };
    updateRequestStore({ userId: req.user.sub, organizationId });

    return true;
  }
}