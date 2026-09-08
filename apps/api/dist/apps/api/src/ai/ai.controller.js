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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const org_member_guard_1 = require("../common/guards/org-member.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const features_guard_1 = require("../common/guards/features.guard");
let AiController = class AiController {
    ai;
    constructor(ai) {
        this.ai = ai;
    }
    translate(member, dto) {
        return this.ai.translateText(member, dto);
    }
    generateProduct(member, dto) {
        return this.ai.generateProductContent(member, dto);
    }
    generateProductTranslations(member, dto) {
        return this.ai.generateProductTranslations(member, dto);
    }
    matchSuppliers(member, dto) {
        return this.ai.matchSuppliers(member, dto);
    }
    getMarketIntelligence(member, industry, country) {
        return this.ai.getMarketIntelligence(member, { industry, country });
    }
    audit(member, dto) {
        return this.ai.audit(member, dto);
    }
    generateMarketingCampaign(member, dto) {
        return this.ai.generateMarketingCampaign(member, dto);
    }
    getMarketingAnalytics(member) {
        return this.ai.getMarketingAnalytics(member);
    }
};
exports.AiController = AiController;
__decorate([
    (0, permissions_guard_1.RequirePermissions)('ai.use'),
    (0, features_guard_1.RequireFeatures)('AI_TRANSLATION'),
    (0, common_1.Post)('translate'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "translate", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('ai.use'),
    (0, features_guard_1.RequireFeatures)('AI_PRODUCT'),
    (0, common_1.Post)('product'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateProduct", null);
__decorate([
    (0, common_1.Post)('product-content'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateProductTranslations", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('ai.use'),
    (0, features_guard_1.RequireFeatures)('AI_MATCHING'),
    (0, common_1.Post)('matching'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "matchSuppliers", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('ai.use'),
    (0, features_guard_1.RequireFeatures)('AI_MARKET_INTELLIGENCE'),
    (0, common_1.Get)('market-intelligence'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Query)('industry')),
    __param(2, (0, common_1.Query)('country')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getMarketIntelligence", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('ai.use'),
    (0, features_guard_1.RequireFeatures)('AI_AUDIT'),
    (0, common_1.Post)('audit'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ai_service_1.AiAuditDto]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "audit", null);
__decorate([
    (0, common_1.Post)('marketing/generate-campaign'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "generateMarketingCampaign", null);
__decorate([
    (0, common_1.Get)('marketing/analytics'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AiController.prototype, "getMarketingAnalytics", null);
exports.AiController = AiController = __decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiController);
//# sourceMappingURL=ai.controller.js.map