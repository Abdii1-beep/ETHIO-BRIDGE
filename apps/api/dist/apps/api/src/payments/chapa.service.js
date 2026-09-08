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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ChapaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChapaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const axios_1 = __importDefault(require("axios"));
let ChapaService = ChapaService_1 = class ChapaService {
    config;
    prisma;
    logger = new common_1.Logger(ChapaService_1.name);
    axios;
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        const secretKey = this.config.get('CHAPA_SECRET_KEY');
        const baseUrl = this.config.get('CHAPA_BASE_URL', 'https://api.chapa.co');
        if (!secretKey) {
            this.logger.warn('CHAPA_SECRET_KEY not configured. Payment integration will not work.');
        }
        this.axios = axios_1.default.create({
            baseURL: baseUrl,
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
        });
    }
    generateTxRef(prefix = 'GECHO') {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }
    async initializeLotteryTicketPayment(data) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: data.ticketId },
            include: { lottery: true },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Ticket not found');
        }
        if (ticket.status !== client_1.TicketStatus.PENDING) {
            throw new common_1.BadRequestException('Ticket is not available for purchase');
        }
        if (ticket.lottery.status !== client_1.LotteryStatus.ACTIVE) {
            throw new common_1.BadRequestException('Lottery is not active');
        }
        const existingPayment = await this.prisma.paymentAttempt.findFirst({
            where: {
                ticketId: data.ticketId,
                status: { in: [client_1.PaymentAttemptStatus.INITIATED, client_1.PaymentAttemptStatus.PENDING] },
            },
        });
        if (existingPayment) {
            const metadata = existingPayment.metadata;
            return {
                paymentAttemptId: existingPayment.id,
                providerRef: existingPayment.providerRef,
                checkoutUrl: metadata?.chapaData?.checkout_url,
                amount: Number(existingPayment.amount),
                currency: existingPayment.currency,
                status: existingPayment.status,
            };
        }
        const txRef = this.generateTxRef('LOTTERY');
        const callbackUrl = this.config.get('CHAPA_CALLBACK_URL');
        const returnUrl = this.config.get('CHAPA_RETURN_URL');
        const cancelUrl = this.config.get('CHAPA_CANCEL_URL');
        if (!callbackUrl || !returnUrl) {
            throw new common_1.BadRequestException('Payment callback URLs not configured');
        }
        const chapaRequest = {
            amount: data.amount.toString(),
            currency: data.currency || 'ETB',
            email: data.userEmail,
            first_name: data.userName.split(' ')[0] || data.userName,
            last_name: data.userName.split(' ').slice(1).join(' ') || '',
            phone_number: data.userPhone,
            tx_ref: txRef,
            callback_url: `${callbackUrl}?tx_ref=${txRef}`,
            return_url: `${returnUrl}?tx_ref=${txRef}`,
            customization: {
                title: 'GECHO Yemekina Equb - Lottery Ticket',
                description: `Purchase ticket #${ticket.ticketNumber} for ${ticket.lottery.title}`,
            },
            meta: {
                ticketId: data.ticketId,
                userId: data.userId,
                lotteryId: ticket.lotteryId,
            },
        };
        try {
            const response = await this.axios.post('/v1/transaction/initialize', chapaRequest);
            if (response.data.status !== 'success') {
                throw new common_1.BadRequestException('Failed to initialize payment with Chapa');
            }
            const paymentAttempt = await this.prisma.paymentAttempt.create({
                data: {
                    ticketId: data.ticketId,
                    userId: data.userId,
                    provider: client_1.PaymentProvider.CHAPA,
                    providerRef: txRef,
                    amount: new library_1.Decimal(data.amount),
                    currency: data.currency || 'ETB',
                    status: client_1.PaymentAttemptStatus.INITIATED,
                    metadata: {
                        chapaData: response.data.data,
                        ticketId: data.ticketId,
                        lotteryId: ticket.lotteryId,
                        checkoutUrl: response.data.data.checkout_url,
                    },
                },
            });
            this.logger.log(`Payment initialized: ${txRef} for ticket ${data.ticketId}`);
            return {
                paymentAttemptId: paymentAttempt.id,
                providerRef: txRef,
                checkoutUrl: response.data.data.checkout_url,
                amount: Number(paymentAttempt.amount),
                currency: paymentAttempt.currency,
                status: paymentAttempt.status,
            };
        }
        catch (error) {
            this.logger.error('Chapa initialization failed:', error);
            if (axios_1.default.isAxiosError(error)) {
                throw new common_1.BadRequestException(`Payment initialization failed: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async verifyTransaction(txRef) {
        try {
            const response = await this.axios.get(`/v1/transaction/verify/${txRef}`);
            const transactionData = response.data.data;
            this.logger.log(`Transaction verified: ${txRef}, status: ${transactionData.status}`);
            return transactionData;
        }
        catch (error) {
            this.logger.error(`Transaction verification failed for ${txRef}:`, error);
            if (axios_1.default.isAxiosError(error)) {
                throw new common_1.BadRequestException(`Transaction verification failed: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async processCallback(txRef) {
        const paymentAttempt = await this.prisma.paymentAttempt.findUnique({
            where: { providerRef: txRef },
        });
        if (!paymentAttempt) {
            throw new common_1.NotFoundException('Payment attempt not found');
        }
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: paymentAttempt.ticketId },
            include: { lottery: true },
        });
        await this.prisma.paymentAttempt.update({
            where: { id: paymentAttempt.id },
            data: { callbackReceived: true },
        });
        const transactionData = await this.verifyTransaction(txRef);
        if (paymentAttempt.verified && paymentAttempt.status === client_1.PaymentAttemptStatus.SUCCESS) {
            this.logger.log(`Payment ${txRef} already processed, skipping`);
            return paymentAttempt;
        }
        const expectedAmount = Number(paymentAttempt.amount);
        const actualAmount = parseFloat(transactionData.amount);
        if (Math.abs(expectedAmount - actualAmount) > 0.01) {
            this.logger.error(`Amount mismatch for ${txRef}: expected ${expectedAmount}, got ${actualAmount}`);
            throw new common_1.BadRequestException('Payment amount does not match');
        }
        if (transactionData.currency !== paymentAttempt.currency) {
            this.logger.error(`Currency mismatch for ${txRef}: expected ${paymentAttempt.currency}, got ${transactionData.currency}`);
            throw new common_1.BadRequestException('Payment currency does not match');
        }
        if (transactionData.status === 'success' && ticket) {
            await this.prisma.$transaction([
                this.prisma.paymentAttempt.update({
                    where: { id: paymentAttempt.id },
                    data: {
                        status: client_1.PaymentAttemptStatus.SUCCESS,
                        verified: true,
                        paymentMethod: transactionData.payment_method,
                        paidAt: new Date(),
                    },
                }),
                this.prisma.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        status: client_1.TicketStatus.PAID,
                        purchasedAt: new Date(),
                    },
                }),
                this.prisma.lottery.update({
                    where: { id: ticket.lotteryId },
                    data: { soldTickets: { increment: 1 } },
                }),
            ]);
            this.logger.log(`Payment successful: ${txRef}, ticket ${paymentAttempt.ticketId} activated`);
        }
        else {
            await this.prisma.paymentAttempt.update({
                where: { id: paymentAttempt.id },
                data: {
                    status: client_1.PaymentAttemptStatus.FAILED,
                    failedAt: new Date(),
                },
            });
            this.logger.log(`Payment failed: ${txRef}`);
        }
        return await this.prisma.paymentAttempt.findUnique({
            where: { id: paymentAttempt.id },
        });
    }
    async processWebhook(txRef, webhookData) {
        const paymentAttempt = await this.prisma.paymentAttempt.findUnique({
            where: { providerRef: txRef },
        });
        if (!paymentAttempt) {
            this.logger.warn(`Webhook received for unknown payment: ${txRef}`);
            return null;
        }
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: paymentAttempt.ticketId },
            include: { lottery: true },
        });
        await this.prisma.paymentAttempt.update({
            where: { id: paymentAttempt.id },
            data: { webhookReceived: true },
        });
        if (paymentAttempt.verified && paymentAttempt.status === client_1.PaymentAttemptStatus.SUCCESS) {
            this.logger.log(`Webhook for ${txRef} already processed, skipping`);
            return paymentAttempt;
        }
        const transactionData = await this.verifyTransaction(txRef);
        const expectedAmount = Number(paymentAttempt.amount);
        const actualAmount = parseFloat(transactionData.amount);
        if (Math.abs(expectedAmount - actualAmount) > 0.01) {
            this.logger.error(`Amount mismatch in webhook for ${txRef}: expected ${expectedAmount}, got ${actualAmount}`);
            return paymentAttempt;
        }
        if (transactionData.currency !== paymentAttempt.currency) {
            this.logger.error(`Currency mismatch in webhook for ${txRef}: expected ${paymentAttempt.currency}, got ${transactionData.currency}`);
            return paymentAttempt;
        }
        if (transactionData.status === 'success' && ticket) {
            await this.prisma.$transaction([
                this.prisma.paymentAttempt.update({
                    where: { id: paymentAttempt.id },
                    data: {
                        status: client_1.PaymentAttemptStatus.SUCCESS,
                        verified: true,
                        paymentMethod: transactionData.payment_method,
                        paidAt: new Date(),
                    },
                }),
                this.prisma.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        status: client_1.TicketStatus.PAID,
                        purchasedAt: new Date(),
                    },
                }),
                this.prisma.lottery.update({
                    where: { id: ticket.lotteryId },
                    data: { soldTickets: { increment: 1 } },
                }),
            ]);
            this.logger.log(`Webhook processed successfully: ${txRef}, ticket ${paymentAttempt.ticketId} activated`);
        }
        else {
            await this.prisma.paymentAttempt.update({
                where: { id: paymentAttempt.id },
                data: {
                    status: client_1.PaymentAttemptStatus.FAILED,
                    failedAt: new Date(),
                },
            });
            this.logger.log(`Webhook payment failed: ${txRef}`);
        }
        return await this.prisma.paymentAttempt.findUnique({
            where: { id: paymentAttempt.id },
        });
    }
    async getPaymentStatus(paymentAttemptId) {
        const paymentAttempt = await this.prisma.paymentAttempt.findUnique({
            where: { id: paymentAttemptId },
        });
        if (!paymentAttempt) {
            throw new common_1.NotFoundException('Payment attempt not found');
        }
        let ticket = null;
        if (paymentAttempt.ticketId) {
            ticket = await this.prisma.ticket.findUnique({
                where: { id: paymentAttempt.ticketId },
            });
        }
        return {
            id: paymentAttempt.id,
            providerRef: paymentAttempt.providerRef,
            amount: Number(paymentAttempt.amount),
            currency: paymentAttempt.currency,
            status: paymentAttempt.status,
            verified: paymentAttempt.verified,
            paymentMethod: paymentAttempt.paymentMethod,
            paidAt: paymentAttempt.paidAt,
            failedAt: paymentAttempt.failedAt,
            ticket: ticket ? {
                id: ticket.id,
                ticketNumber: ticket.ticketNumber,
                status: ticket.status,
                userId: ticket.userId,
            } : null,
        };
    }
};
exports.ChapaService = ChapaService;
exports.ChapaService = ChapaService = ChapaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], ChapaService);
//# sourceMappingURL=chapa.service.js.map