import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

interface PrismaErrorMapping {
  status: HttpStatus;
  code: string;
  message: string;
}

/**
 * Maps known Prisma errors to canonical platform error codes (SDD §113).
 */
export const PRISMA_ERROR_MAP: Record<string, PrismaErrorMapping> = {
  P2002: {
    status: HttpStatus.CONFLICT,
    code: 'CONFLICT',
    message: 'A resource with the same unique value already exists.',
  },
  P2003: {
    status: HttpStatus.CONFLICT,
    code: 'CONFLICT',
    message: 'The request references a resource that does not exist.',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    code: 'NOT_FOUND',
    message: 'Resource not found.',
  },
};

export function isPrismaUniqueError(e: unknown): e is Prisma.PrismaClientKnownRequestError {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}