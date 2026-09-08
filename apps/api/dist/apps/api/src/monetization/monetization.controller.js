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
exports.MonetizationController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
const commission_service_1 = require("./commission.service");
const subscription_service_1 = require("./subscription.service");
const payment_partner_service_1 = require("./payment-partner.service");
const org_member_guard_1 = require("../common/guards/org-member.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let MonetizationController = class MonetizationController {
    walletService;
    commissionService;
    subscriptionService;
    paymentPartnerService;
    constructor(walletService, commissionService, subscriptionService, paymentPartnerService) {
        this.walletService = walletService;
        this.commissionService = commissionService;
        this.subscriptionService = subscriptionService;
        this.paymentPartnerService = paymentPartnerService;
    }
    async getPlans() {
        return this.subscriptionService.getPlans();
    }
    async getSubscription(member) {
        return this.subscriptionService.getCurrentSubscription(member.organizationId);
    }
    async subscribe(member, body) {
        return this.subscriptionService.subscribe(member.organizationId, body.planCode);
    }
    async getWallet(member) {
        return this.walletService.getOrCreateWallet(member.organizationId);
    }
    async deposit(member, body) {
        return this.walletService.deposit(member.organizationId, body.amount, 'TOPUP', body.description ?? 'Wallet deposit', body.referenceId);
    }
    async getWalletTransactions(member) {
        return this.walletService.getTransactions(member.organizationId);
    }
    async getCommissionRule(type) {
        return this.commissionService.getActiveRule(type ?? 'B2B_TRADE');
    }
    async calculateCommission(body) {
        return this.commissionService.calculateCommission(body.grossAmount, body.currency ?? 'ETB', body.transactionType ?? 'B2B_TRADE');
    }
    async getCommissionSummary(member) {
        return this.commissionService.getCommissionSummary(member.organizationId);
    }
    async initiatePayment(member, body) {
        return this.paymentPartnerService.initiatePayment({
            ...body,
            userId: member.userId,
        });
    }
    async confirmPayment(body) {
        return this.paymentPartnerService.confirmPayment(body.paymentAttemptId);
    }
};
exports.MonetizationController = MonetizationController;
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('billing/plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "getPlans", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('billing.view'),
    (0, common_1.Get)('billing/subscription'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "getSubscription", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('billing.manage'),
    (0, common_1.Post)('billing/subscription'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "subscribe", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('wallet.view'),
    (0, common_1.Get)('wallet'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "getWallet", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('wallet.transact'),
    (0, common_1.Post)('wallet/deposit'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "deposit", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('wallet.view'),
    (0, common_1.Get)('wallet/transactions'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "getWalletTransactions", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('commissions/rule'),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "getCommissionRule", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Post)('commissions/calculate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "calculateCommission", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('billing.view'),
    (0, common_1.Get)('commissions/summary'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "getCommissionSummary", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('orders.manage'),
    (0, common_1.Post)('payments/initiate'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "initiatePayment", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('orders.manage'),
    (0, common_1.Post)('payments/confirm'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MonetizationController.prototype, "confirmPayment", null);
exports.MonetizationController = MonetizationController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [wallet_service_1.WalletService,
        commission_service_1.CommissionService,
        subscription_service_1.SubscriptionService,
        payment_partner_service_1.PaymentPartnerService])
], MonetizationController);
//# sourceMappingURL=monetization.controller.js.map