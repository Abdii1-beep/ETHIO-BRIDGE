import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  platformRole: string;
}

export const CurrentPlatformUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PlatformUser | undefined => {
    return ctx.switchToHttp().getRequest<Request & { platformUser?: PlatformUser }>().platformUser;
  },
);