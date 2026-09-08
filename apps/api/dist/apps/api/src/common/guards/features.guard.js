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
exports.FeaturesGuard = exports.RequireFeatures = exports.FEATURES_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const errors_1 = require("../errors");
exports.FEATURES_KEY = 'ehio_required_features';
const RequireFeatures = (...featureCodes) => (0, common_1.SetMetadata)(exports.FEATURES_KEY, featureCodes);
exports.RequireFeatures = RequireFeatures;
let FeaturesGuard = class FeaturesGuard {
    reflector;
    prisma;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(ctx) {
        const required = this.reflector.getAllAndOverride(exports.FEATURES_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!required || required.length === 0) {
            return true;
        }
        const member = ctx
            .switchToHttp()
            .getRequest().member;
        if (!member) {
            throw new errors_1.FeatureNotEnabledError(required[0]);
        }
        const orgFeatures = await this.prisma.organizationFeature.findMany({
            where: {
                organizationId: member.organizationId,
                feature: { code: { in: required } },
            },
            include: { feature: { select: { code: true } } },
        });
        const now = new Date();
        for (const code of required) {
            const of = orgFeatures.find((f) => f.feature?.code === code);
            const active = of &&
                of.status === 'ACTIVE' &&
                (!of.expirationDate || of.expirationDate > now) &&
                of.organizationId === member.organizationId;
            if (!active) {
                throw new errors_1.FeatureNotEnabledError(code);
            }
        }
        return true;
    }
};
exports.FeaturesGuard = FeaturesGuard;
exports.FeaturesGuard = FeaturesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], FeaturesGuard);
//# sourceMappingURL=features.guard.js.map