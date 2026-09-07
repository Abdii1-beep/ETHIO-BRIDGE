import { Global, Injectable, Module } from '@nestjs/common';
import { getRequestStore } from '../common/request-store';
import { AUDIT_ACTIONS } from '../shared';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditRecordInput {
  action: (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | string;
  organizationId?: string;
  userId?: string;
  entity?: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append-only sensitive action log (SDD §58, §114).
   */
  async record(input: AuditRecordInput): Promise<void> {
    const store = getRequestStore();
    await this.prisma.auditLog.create({
      data: {
        requestId: store.requestId,
        organizationId: input.organizationId ?? store.organizationId,
        userId: input.userId ?? store.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        ip: store.ip,
        device: store.device,
        userAgent: store.userAgent,
        oldValue: input.oldValue === undefined ? undefined : (input.oldValue as object),
        newValue: input.newValue === undefined ? undefined : (input.newValue as object),
        reason: input.reason,
        metadata: input.metadata as object | undefined,
      },
    });
  }
}

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}