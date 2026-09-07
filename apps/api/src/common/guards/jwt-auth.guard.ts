import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UnauthorizedError } from '../errors';
import { updateRequestStore } from '../request-store';

export const IS_PUBLIC_KEY = 'ehio_is_public';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface JwtUser {
  sub: string;
  email: string;
  name: string;
  platformRole?: string | null;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtUser | undefined => {
  return ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>().user;
});

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const token = this.extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedError('Missing bearer token.');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtUser>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      req.user = payload;
      updateRequestStore({ userId: payload.sub });
      return true;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token.');
    }
  }

  private extractBearerToken(header?: string): string | undefined {
    if (!header) {
      return undefined;
    }
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return undefined;
    }
    return token;
  }
}