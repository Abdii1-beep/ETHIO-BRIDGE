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
exports.ProcurementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProcurementService = class ProcurementService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(memberContext, query) {
        const organizationId = memberContext.membership.organizationId;
        return {
            procurements: [],
            total: 0,
            pending: 0,
            approved: 0,
            budget: {
                allocated: 0,
                spent: 0,
                remaining: 0
            }
        };
    }
    async create(memberContext, data) {
        return {
            id: `procurement-${Date.now()}`,
            ...data,
            organizationId: memberContext.membership.organizationId,
            requestedBy: memberContext.user.id,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };
    }
    async getById(memberContext, id) {
        return {
            id,
            items: [],
            totalAmount: 0,
            currency: 'ETB',
            status: 'PENDING'
        };
    }
    async update(memberContext, id, data) {
        return {
            id,
            ...data,
            updatedBy: memberContext.user.id,
            updatedAt: new Date().toISOString()
        };
    }
    async approve(memberContext, id, data) {
        return {
            id,
            status: 'APPROVED',
            approvedBy: memberContext.userId,
            approvedAt: new Date().toISOString()
        };
    }
    async remove(memberContext, id) {
        return { id };
    }
};
exports.ProcurementService = ProcurementService;
exports.ProcurementService = ProcurementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProcurementService);
//# sourceMappingURL=procurement.service.js.map