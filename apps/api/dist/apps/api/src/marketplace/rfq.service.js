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
exports.RfqService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const commission_service_1 = require("../monetization/commission.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let RfqService = class RfqService {
    prisma;
    commissionService;
    constructor(prisma, commissionService) {
        this.prisma = prisma;
        this.commissionService = commissionService;
    }
    async listRfqs(query) {
        const where = {
            status: query.status ?? client_1.RfqStatus.PUBLISHED,
        };
        if (query.category) {
            where.targetCategory = { contains: query.category, mode: 'insensitive' };
        }
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.rfq.findMany({
            where,
            include: {
                buyerOrg: {
                    select: {
                        id: true,
                        legalName: true,
                        tradingName: true,
                        country: true,
                        verificationLevel: true,
                    },
                },
                _count: {
                    select: { quotations: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async getRfqById(id) {
        const rfq = await this.prisma.rfq.findUnique({
            where: { id },
            include: {
                buyerOrg: {
                    select: {
                        id: true,
                        legalName: true,
                        tradingName: true,
                        country: true,
                        verificationLevel: true,
                        email: true,
                        phone: true,
                    },
                },
                quotations: {
                    include: {
                        sellerOrg: {
                            select: {
                                id: true,
                                legalName: true,
                                tradingName: true,
                                country: true,
                                verificationLevel: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!rfq) {
            throw new common_1.NotFoundException(`RFQ ${id} not found`);
        }
        return rfq;
    }
    async createRfq(buyerOrgId, data) {
        return this.prisma.rfq.create({
            data: {
                buyerOrgId,
                title: data.title,
                description: data.description,
                targetCategory: data.targetCategory,
                quantity: data.quantity,
                unit: data.unit ?? 'pcs',
                targetBudget: data.targetBudget ? new library_1.Decimal(data.targetBudget) : null,
                currency: data.currency ?? 'USD',
                destination: data.destination ?? 'Ethiopia',
                deliveryDate: data.deliveryDate,
                status: client_1.RfqStatus.PUBLISHED,
            },
        });
    }
    async createQuotation(sellerOrgId, data) {
        const rfq = await this.prisma.rfq.findUnique({
            where: { id: data.rfqId },
        });
        if (!rfq) {
            throw new common_1.NotFoundException(`RFQ ${data.rfqId} not found`);
        }
        if (data.productId) {
            const product = await this.prisma.product.findUnique({
                where: { id: data.productId },
            });
            if (!product || product.organizationId !== sellerOrgId) {
                throw new common_1.ForbiddenException('You can only quote your own products.');
            }
        }
        const shipping = data.shippingCost ?? 0;
        const totalPrice = data.unitPrice * data.quantity + shipping;
        return this.prisma.quotation.create({
            data: {
                rfqId: data.rfqId,
                sellerOrgId,
                productId: data.productId,
                unitPrice: new library_1.Decimal(data.unitPrice),
                quantity: data.quantity,
                totalPrice: new library_1.Decimal(totalPrice),
                shippingCost: new library_1.Decimal(shipping),
                currency: data.currency ?? rfq.currency,
                moq: data.moq ?? 1,
                deliveryDays: data.deliveryDays ?? 15,
                paymentTerms: data.paymentTerms,
                validityDays: data.validityDays ?? 30,
                notes: data.notes,
                status: client_1.QuotationStatus.PENDING,
            },
        });
    }
    async acceptQuotation(quotationId, buyerOrgId) {
        const quotation = await this.prisma.quotation.findUnique({
            where: { id: quotationId },
            include: { rfq: true },
        });
        if (!quotation) {
            throw new common_1.NotFoundException(`Quotation ${quotationId} not found`);
        }
        if (quotation.rfq.buyerOrgId !== buyerOrgId) {
            throw new common_1.ForbiddenException('Only the buyer organization can accept this quotation');
        }
        await this.prisma.quotation.update({
            where: { id: quotationId },
            data: { status: client_1.QuotationStatus.ACCEPTED },
        });
        await this.prisma.rfq.update({
            where: { id: quotation.rfqId },
            data: { status: client_1.RfqStatus.CLOSED },
        });
        const totalAmount = Number(quotation.totalPrice);
        const comm = await this.commissionService.calculateCommission(totalAmount, quotation.currency, 'B2B_TRADE');
        const order = await this.prisma.order.create({
            data: {
                buyerOrgId,
                sellerOrgId: quotation.sellerOrgId,
                rfqId: quotation.rfqId,
                quotationId,
                totalAmount: new library_1.Decimal(totalAmount),
                commissionAmount: new library_1.Decimal(comm.effectiveFee),
                currency: quotation.currency,
                status: client_1.OrderStatus.PENDING,
            },
        });
        await this.commissionService.recordCommission({
            orderId: order.id,
            organizationId: quotation.sellerOrgId,
            grossAmount: totalAmount,
            feeAmount: comm.effectiveFee,
            netAmount: comm.netAmount,
            currency: quotation.currency,
        });
        return {
            order,
            commission: comm,
        };
    }
    async listOrders(organizationId) {
        return this.prisma.order.findMany({
            where: {
                OR: [{ buyerOrgId: organizationId }, { sellerOrgId: organizationId }],
            },
            include: {
                buyerOrg: {
                    select: { id: true, legalName: true, tradingName: true, country: true },
                },
                sellerOrg: {
                    select: { id: true, legalName: true, tradingName: true, country: true },
                },
                rfq: { select: { title: true, targetCategory: true } },
                quotation: true,
                payments: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getOrderById(orderId, organizationId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                buyerOrg: true,
                sellerOrg: true,
                rfq: true,
                quotation: true,
                payments: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order ${orderId} not found`);
        }
        if (order.buyerOrgId !== organizationId && order.sellerOrgId !== organizationId) {
            throw new common_1.ForbiddenException('Access denied to this order');
        }
        return order;
    }
};
exports.RfqService = RfqService;
exports.RfqService = RfqService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        commission_service_1.CommissionService])
], RfqService);
//# sourceMappingURL=rfq.service.js.map