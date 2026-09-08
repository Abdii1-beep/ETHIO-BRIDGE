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
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let CrmService = class CrmService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listLeads(organizationId, stage) {
        const where = { organizationId };
        if (stage) {
            where.stage = stage;
        }
        return this.prisma.crmLead.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
        });
    }
    async createLead(organizationId, data) {
        return this.prisma.crmLead.create({
            data: {
                organizationId,
                contactName: data.contactName,
                companyName: data.companyName,
                email: data.email,
                phone: data.phone,
                stage: data.stage ?? client_1.CrmStage.NEW,
                dealValue: data.dealValue ? new library_1.Decimal(data.dealValue) : new library_1.Decimal(0),
                currency: data.currency ?? 'ETB',
                notes: data.notes,
            },
        });
    }
    async updateLeadStage(id, organizationId, stage) {
        const lead = await this.prisma.crmLead.findFirst({
            where: { id, organizationId },
        });
        if (!lead) {
            throw new common_1.NotFoundException(`Lead ${id} not found`);
        }
        return this.prisma.crmLead.update({
            where: { id },
            data: { stage },
        });
    }
    async getPipelineSummary(organizationId) {
        const leads = await this.prisma.crmLead.findMany({
            where: { organizationId },
        });
        const stages = {
            NEW: { count: 0, totalValue: 0 },
            CONTACTED: { count: 0, totalValue: 0 },
            QUALIFIED: { count: 0, totalValue: 0 },
            NEGOTIATING: { count: 0, totalValue: 0 },
            WON: { count: 0, totalValue: 0 },
            LOST: { count: 0, totalValue: 0 },
        };
        for (const lead of leads) {
            const stage = lead.stage;
            if (stages[stage]) {
                stages[stage].count += 1;
                stages[stage].totalValue += Number(lead.dealValue);
            }
        }
        return {
            stages,
            totalLeads: leads.length,
        };
    }
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrmService);
//# sourceMappingURL=crm.service.js.map