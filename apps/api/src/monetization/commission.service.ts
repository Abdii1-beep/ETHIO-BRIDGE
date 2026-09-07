import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface CommissionCalculationResult {
  grossAmount: number;
  feePercentage: number;
  rawFee: number;
  effectiveFee: number;
  netAmount: number;
  currency: string;
  minFee: number;
  maxFee: number;
}

@Injectable()
export class CommissionService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveRule(transactionType = 'B2B_TRADE') {
    let rule = await this.prisma.commissionRule.findFirst({
      where: { transactionType, isActive: true },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!rule) {
      rule = await this.prisma.commissionRule.create({
        data: {
          transactionType,
          percentage: new Decimal(2.0),
          fixedFee: new Decimal(0),
          minFee: new Decimal(50),
          maxFee: new Decimal(500000),
          currency: 'ETB',
          isActive: true,
        },
      });
    }

    return rule;
  }

  async calculateCommission(
    grossAmount: number,
    currency = 'ETB',
    transactionType = 'B2B_TRADE',
  ): Promise<CommissionCalculationResult> {
    const rule = await this.getActiveRule(transactionType);

    const percentage = Number(rule.percentage);
    const fixedFee = Number(rule.fixedFee);
    const minFee = Number(rule.minFee);
    const maxFee = Number(rule.maxFee);

    let rawFee = (grossAmount * percentage) / 100 + fixedFee;
    let effectiveFee = rawFee;

    if (minFee > 0 && effectiveFee < minFee) {
      effectiveFee = minFee;
    }
    if (maxFee > 0 && effectiveFee > maxFee) {
      effectiveFee = maxFee;
    }

    const netAmount = Math.max(0, grossAmount - effectiveFee);

    return {
      grossAmount,
      feePercentage: percentage,
      rawFee,
      effectiveFee,
      netAmount,
      currency,
      minFee,
      maxFee,
    };
  }

  async recordCommission(data: {
    orderId?: string;
    organizationId: string;
    grossAmount: number;
    feeAmount: number;
    netAmount: number;
    partnerFee?: number;
    currency?: string;
  }) {
    return this.prisma.platformCommission.create({
      data: {
        orderId: data.orderId,
        organizationId: data.organizationId,
        grossAmount: new Decimal(data.grossAmount),
        feeAmount: new Decimal(data.feeAmount),
        netAmount: new Decimal(data.netAmount),
        partnerFee: new Decimal(data.partnerFee ?? 0),
        currency: data.currency ?? 'ETB',
        status: 'SETTLED',
      },
    });
  }

  async getCommissionSummary(organizationId: string) {
    const records = await this.prisma.platformCommission.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totals = records.reduce(
      (acc, curr) => {
        acc.totalGross += Number(curr.grossAmount);
        acc.totalFees += Number(curr.feeAmount);
        acc.totalNet += Number(curr.netAmount);
        return acc;
      },
      { totalGross: 0, totalFees: 0, totalNet: 0 },
    );

    return {
      records,
      totals,
    };
  }
}
