import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCurrentSubscription(organizationId: string) {
    const sub = await this.prisma.organizationSubscription.findFirst({
      where: { organizationId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (sub) {
      return sub;
    }

    // Default to FREE plan
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

  async subscribe(organizationId: string, planCode: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: planCode },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with code ${planCode} not found`);
    }

    // Mark previous subscriptions as cancelled
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

    // Automatically enable plan features
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
}
