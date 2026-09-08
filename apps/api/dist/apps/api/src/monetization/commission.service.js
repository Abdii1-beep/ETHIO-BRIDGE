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
exports.CommissionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let CommissionService = class CommissionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveRule(transactionType = 'B2B_TRADE') {
        let rule = await this.prisma.commissionRule.findFirst({
            where: { transactionType, isActive: true },
            orderBy: { effectiveDate: 'desc' },
        });
        if (!rule) {
            rule = await this.prisma.commissionRule.create({
                data: {
                    transactionType,
                    percentage: new library_1.Decimal(2.0),
                    fixedFee: new library_1.Decimal(0),
                    minFee: new library_1.Decimal(50),
                    maxFee: new library_1.Decimal(500000),
                    currency: 'ETB',
                    isActive: true,
                },
            });
        }
        return rule;
    }
    async calculateCommission(grossAmount, currency = 'ETB', transactionType = 'B2B_TRADE') {
        const rule = await this.getActiveRule(transactionType);
        const percentage = Number(rule.percentage);
        const fixedFee = Number(rule.fixedFee);
        const minFee = Number(rule.minFee);
        const maxFee = Number(rule.maxFee);
        let rawFee = (grossAmount * percentage) / 100 + fixedFee;
        let effectiveFee = rawFee;
        if (minFee > 0 && effectiveFee < minFee) {
            effectiveFee = minFee;
        }
        if (maxFee > 0 && effectiveFee > maxFee) {
            effectiveFee = maxFee;
        }
        const netAmount = Math.max(0, grossAmount - effectiveFee);
        return {
            grossAmount,
            feePercentage: percentage,
            rawFee,
            effectiveFee,
            netAmount,
            currency,
            minFee,
            maxFee,
        };
    }
    async recordCommission(data) {
        return this.prisma.platformCommission.create({
            data: {
                orderId: data.orderId,
                organizationId: data.organizationId,
                grossAmount: new library_1.Decimal(data.grossAmount),
                feeAmount: new library_1.Decimal(data.feeAmount),
                netAmount: new library_1.Decimal(data.netAmount),
                partnerFee: new library_1.Decimal(data.partnerFee ?? 0),
                currency: data.currency ?? 'ETB',
                status: 'SETTLED',
            },
        });
    }
    async getCommissionSummary(organizationId) {
        const records = await this.prisma.platformCommission.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const totals = records.reduce((acc, curr) => {
            acc.totalGross += Number(curr.grossAmount);
            acc.totalFees += Number(curr.feeAmount);
            acc.totalNet += Number(curr.netAmount);
            return acc;
        }, { totalGross: 0, totalFees: 0, totalNet: 0 });
        return {
            records,
            totals,
        };
    }
};
exports.CommissionService = CommissionService;
exports.CommissionService = CommissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommissionService);
//# sourceMappingURL=commission.service.js.map