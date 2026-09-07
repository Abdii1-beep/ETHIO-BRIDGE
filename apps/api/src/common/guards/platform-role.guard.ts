import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenError } from '../errors';
import { JwtUser } from './jwt-auth.guard';

export const PLATFORM_ROLES_KEY = 'ehio_required_platform_roles';
export const RequirePlatformRoles = (...roles: string[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);

/**
 * Verifies the authenticated user holds a platform-side role (SDD §5, §141) and is active.
 * Reads the user from the database so disable/platform-role changes take effect immediately.
 */
@Injectable()
export class PlatformRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PLATFORM_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    if (!req.user) {
      throw new ForbiddenError('Authentication is required.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user || !user.isActive || !user.platformRole) {
      throw new ForbiddenError('Platform administration access is required.');
    }
    if (!required.includes(user.platformRole)) {
      throw new ForbiddenError('Insufficient platform role.');
    }

    req.platformUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      platformRole: user.platformRole,
    };

    return true;
  }
}

declare module 'express' {
  interface Request {
    platformUser?: {
      id: string;
      email: string;
      name: string;
      platformRole: string;
    };
  }
}