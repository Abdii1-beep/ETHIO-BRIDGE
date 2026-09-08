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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const chapa_service_1 = require("./chapa.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const jwt_auth_guard_2 = require("../common/guards/jwt-auth.guard");
let PaymentsController = class PaymentsController {
    chapaService;
    constructor(chapaService) {
        this.chapaService = chapaService;
    }
    async initializeLotteryPayment(data) {
        const ticket = await this.chapaService['prisma'].ticket.findUnique({
            where: { id: data.ticketId },
            include: { lottery: true },
        });
        if (!ticket) {
            throw new Error('Ticket not found');
        }
        const amount = Number(ticket.lottery.ticketPrice) || 100;
        return this.chapaService.initializeLotteryTicketPayment({
            ticketId: data.ticketId,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            userPhone: data.userPhone,
            amount: amount,
        });
    }
    async handleCallback(txRef, res) {
        try {
            const paymentAttempt = await this.chapaService.processCallback(txRef);
            if (!paymentAttempt) {
                throw new Error('Payment attempt not found');
            }
            const returnUrl = process.env.CHAPA_RETURN_URL || process.env.WEB_URL || 'http://localhost:3003/payment/success';
            const redirectUrl = `${returnUrl}?payment_attempt_id=${paymentAttempt.id}&status=${paymentAttempt.status}`;
            return res.redirect(redirectUrl);
        }
        catch (error) {
            const cancelUrl = process.env.CHAPA_CANCEL_URL || process.env.WEB_URL || 'http://localhost:3003/payment/failed';
            return res.redirect(`${cancelUrl}?error=${encodeURIComponent(error.message || 'Unknown error')}`);
        }
    }
    async handleWebhook(webhookData) {
        const txRef = webhookData.tx_ref;
        if (!txRef) {
            return { status: 'error', message: 'Missing tx_ref' };
        }
        const paymentAttempt = await this.chapaService.processWebhook(txRef, webhookData);
        return { status: 'success', data: paymentAttempt };
    }
    async getPaymentStatus(paymentAttemptId, userId) {
        const status = await this.chapaService.getPaymentStatus(paymentAttemptId);
        if (status.ticket && status.ticket.userId !== userId) {
            throw new Error('Unauthorized');
        }
        return status;
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('chapa/initialize-lottery'),
    (0, jwt_auth_guard_2.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "initializeLotteryPayment", null);
__decorate([
    (0, common_1.Get)('chapa/callback'),
    (0, jwt_auth_guard_2.Public)(),
    __param(0, (0, common_1.Query)('tx_ref')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Post)('chapa/webhook'),
    (0, jwt_auth_guard_2.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)('status/:paymentAttemptId'),
    __param(0, (0, common_1.Param)('paymentAttemptId')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPaymentStatus", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [chapa_service_1.ChapaService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map