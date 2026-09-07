import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { PRISMA_ERROR_MAP } from './prisma-error-map';
import { getRequestStore } from '../request-store';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const store = getRequestStore();

    let status: HttpStatus;
    let code: string;
    let message: string;
    let details: unknown;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      status = exception.getStatus();

      if (typeof response === 'object' && response !== null) {
        const body = response as Record<string, unknown>;
        if (typeof body.code === 'string') {
          code = body.code;
          message = typeof body.message === 'string' ? body.message : exception.message;
          details = body.details;
        } else {
          code = httpStatusToCode(status);
          if (status === HttpStatus.BAD_REQUEST && Array.isArray(body.message)) {
            code = 'VALIDATION_FAILED';
            message = 'Validation failed.';
            details = body.message;
          } else {
            message = (messageFromResponse(body) ?? exception.message) as string;
          }
        }
      } else {
        code = httpStatusToCode(status);
        message = response as string;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        status = mapped.status;
        code = mapped.code;
        message = mapped.message;
        details = exception.meta;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        code = 'INTERNAL_ERROR';
        message = 'An internal error occurred.';
        this.logger.error(exception, exception.stack, store.requestId);
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = 'An internal error occurred.';
      this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : String(exception), undefined, store.requestId);
    }

    res.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
        requestId: store.requestId,
      },
    });
  }
}

function messageFromResponse(body: Record<string, unknown>): string | unknown {
  return body.message;
}

function httpStatusToCode(status: HttpStatus): string {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMITED';
    default:
      return 'VALIDATION_FAILED';
  }
}