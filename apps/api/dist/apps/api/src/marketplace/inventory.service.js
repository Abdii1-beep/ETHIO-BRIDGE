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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(memberContext, query) {
        const organizationId = memberContext.membership.organizationId;
        return {
            items: [],
            total: 0,
            totalValue: 0,
            lowStock: [],
            categories: []
        };
    }
    async create(memberContext, data) {
        return {
            id: `inventory-${Date.now()}`,
            ...data,
            organizationId: memberContext.organizationId,
            createdBy: memberContext.userId,
            createdAt: new Date().toISOString()
        };
    }
    async getById(memberContext, id) {
        return {
            id,
            quantity: 0,
            unitPrice: 0,
            location: '',
            status: 'IN_STOCK'
        };
    }
    async update(memberContext, id, data) {
        return {
            id,
            ...data,
            updatedBy: memberContext.userId,
            updatedAt: new Date().toISOString()
        };
    }
    async remove(memberContext, id) {
        return { id };
    }
    async adjustStock(memberContext, id, data) {
        return {
            id,
            adjustment: data.quantity,
            newQuantity: 0,
            reason: data.reason,
            adjustedBy: memberContext.user.id,
            adjustedAt: new Date().toISOString()
        };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map