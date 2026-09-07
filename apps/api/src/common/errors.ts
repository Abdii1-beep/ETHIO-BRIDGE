import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends HttpException {
  constructor(code: string, message: string, status: HttpStatus = HttpStatus.BAD_REQUEST, details?: unknown) {
    super({ code, message, details } as ApiErrorPayload, status);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'You do not have permission to perform this action.') {
    super('FORBIDDEN', message, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication is required.') {
    super('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found.') {
    super('NOT_FOUND', message, HttpStatus.NOT_FOUND);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'The request conflicts with the current state.') {
    super('CONFLICT', message, HttpStatus.CONFLICT);
  }
}

export class ValidationFailedError extends ApiError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_FAILED', message, HttpStatus.BAD_REQUEST, details);
  }
}

export class FeatureNotEnabledError extends ApiError {
  constructor(featureCode: string) {
    super(
      'FEATURE_NOT_ENABLED',
      `The feature "${featureCode}" is not enabled for your organization.`,
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message = 'The requested service is temporarily unavailable.', code = 'SERVICE_UNAVAILABLE') {
    super(code, message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class AIProviderNotConfiguredError extends ServiceUnavailableError {
  constructor(service: string) {
    super(
      `No AI provider is configured for "${service}". Configure a provider before enabling this service.`,
      'AI_PROVIDER_NOT_CONFIGURED',
    );
  }
}