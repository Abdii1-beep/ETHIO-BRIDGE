"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditModule = exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const request_store_1 = require("../common/request-store");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(input) {
        const store = (0, request_store_1.getRequestStore)();
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
                oldValue: input.oldValue === undefined ? undefined : input.oldValue,
                newValue: input.newValue === undefined ? undefined : input.newValue,
                reason: input.reason,
                metadata: input.metadata,
            },
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
let AuditModule = class AuditModule {
};
exports.AuditModule = AuditModule;
exports.AuditModule = AuditModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [AuditService],
        exports: [AuditService],
    })
], AuditModule);
//# sourceMappingURL=audit.service.js.map