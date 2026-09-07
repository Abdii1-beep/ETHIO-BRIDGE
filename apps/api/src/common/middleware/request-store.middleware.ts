import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { runWithRequestStore } from '../request-store';

@Injectable()
export class RequestStoreMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    res.setHeader('X-Request-Id', requestId);
    const store = {
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      device: req.headers['user-agent'],
    };
    runWithRequestStore(store, next);
  }
}