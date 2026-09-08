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
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SubscriptionService = class SubscriptionService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPlans() {
        return this.prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async getCurrentSubscription(organizationId) {
        const sub = await this.prisma.organizationSubscription.findFirst({
            where: { organizationId, status: 'ACTIVE' },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
        });
        if (sub) {
            return sub;
        }
        const freePlan = await this.prisma.subscriptionPlan.findUnique({
            where: { code: 'FREE' },
        });
        return {
            id: 'default-free',
            organizationId,
            planId: freePlan?.id ?? 'free',
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: null,
            autoRenew: true,
            plan: freePlan,
        };
    }
    async subscribe(organizationId, planCode) {
        const plan = await this.prisma.subscriptionPlan.findUnique({
            where: { code: planCode },
        });
        if (!plan) {
            throw new common_1.NotFoundException(`Plan with code ${planCode} not found`);
        }
        await this.prisma.organizationSubscription.updateMany({
            where: { organizationId, status: 'ACTIVE' },
            data: { status: 'CANCELLED' },
        });
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const subscription = await this.prisma.organizationSubscription.create({
            data: {
                organizationId,
                planId: plan.id,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: nextMonth,
                autoRenew: true,
            },
            include: { plan: true },
        });
        if (plan.features && plan.features.length > 0) {
            for (const featureCode of plan.features) {
                const feature = await this.prisma.feature.findUnique({
                    where: { code: featureCode },
                });
                if (feature) {
                    await this.prisma.organizationFeature.upsert({
                        where: {
                            organizationId_featureId: {
                                organizationId,
                                featureId: feature.id,
                            },
                        },
                        create: {
                            organizationId,
                            featureId: feature.id,
                            status: 'ACTIVE',
                            billingType: plan.code === 'FREE' ? 'FREE' : 'SUBSCRIPTION',
                        },
                        update: {
                            status: 'ACTIVE',
                            billingType: plan.code === 'FREE' ? 'FREE' : 'SUBSCRIPTION',
                        },
                    });
                }
            }
        }
        return subscription;
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map