import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ForbiddenError } from '../errors';
import { MemberContext } from './org-member.guard';

export const PERMISSIONS_KEY = 'ehio_required_permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const member = ctx
      .switchToHttp()
      .getRequest<Request & { member?: MemberContext }>().member;
    if (!member) {
      throw new ForbiddenError('Organization context is required to evaluate permissions.');
    }

    const missing = required.filter((p) => !member.permissions.includes(p));
    if (missing.length > 0) {
      throw new ForbiddenError(`Missing permission(s): ${missing.join(', ')}`);
    }

    return true;
  }
}