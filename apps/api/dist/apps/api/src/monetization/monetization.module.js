"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonetizationModule = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
const commission_service_1 = require("./commission.service");
const subscription_service_1 = require("./subscription.service");
const payment_partner_service_1 = require("./payment-partner.service");
const monetization_controller_1 = require("./monetization.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let MonetizationModule = class MonetizationModule {
};
exports.MonetizationModule = MonetizationModule;
exports.MonetizationModule = MonetizationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [monetization_controller_1.MonetizationController],
        providers: [
            wallet_service_1.WalletService,
            commission_service_1.CommissionService,
            subscription_service_1.SubscriptionService,
            payment_partner_service_1.PaymentPartnerService,
        ],
        exports: [
            wallet_service_1.WalletService,
            commission_service_1.CommissionService,
            subscription_service_1.SubscriptionService,
            payment_partner_service_1.PaymentPartnerService,
        ],
    })
], MonetizationModule);
//# sourceMappingURL=monetization.module.js.map