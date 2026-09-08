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
exports.PaymentPartnerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
let PaymentPartnerService = class PaymentPartnerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async initiatePayment(data) {
        const order = await this.prisma.order.findUnique({
            where: { id: data.orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order ${data.orderId} not found`);
        }
        const provider = data.provider ?? client_1.PaymentProvider.NBE_LICENSED_PARTNER;
        const providerRef = `PAY-${provider}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const attempt = await this.prisma.paymentAttempt.create({
            data: {
                orderId: data.orderId,
                userId: data.userId,
                provider,
                providerRef,
                amount: new library_1.Decimal(data.amount),
                currency: data.currency ?? 'ETB',
                status: client_1.PaymentAttemptStatus.INITIATED,
                metadata: {
                    checkoutUrl: `https://checkout.partner.ehio.bridge/pay?ref=${providerRef}`,
                    partnerNotice: 'Payment is securely processed through NBE-licensed National Switch / payment partner infrastructure.',
                },
            },
        });
        return {
            paymentAttemptId: attempt.id,
            provider: attempt.provider,
            providerRef: attempt.providerRef,
            amount: Number(attempt.amount),
            currency: attempt.currency,
            status: attempt.status,
            checkoutUrl: attempt.metadata?.checkoutUrl,
            partnerNotice: attempt.metadata?.partnerNotice,
        };
    }
    async confirmPayment(paymentAttemptId) {
        const attempt = await this.prisma.paymentAttempt.findUnique({
            where: { id: paymentAttemptId },
            include: { order: true },
        });
        if (!attempt) {
            throw new common_1.NotFoundException('Payment attempt not found');
        }
        const updatedAttempt = await this.prisma.paymentAttempt.update({
            where: { id: paymentAttemptId },
            data: { status: client_1.PaymentAttemptStatus.SUCCESS },
        });
        if (attempt.orderId) {
            await this.prisma.order.update({
                where: { id: attempt.orderId },
                data: { status: 'PAID' },
            });
        }
        return updatedAttempt;
    }
};
exports.PaymentPartnerService = PaymentPartnerService;
exports.PaymentPartnerService = PaymentPartnerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentPartnerService);
//# sourceMappingURL=payment-partner.service.js.map