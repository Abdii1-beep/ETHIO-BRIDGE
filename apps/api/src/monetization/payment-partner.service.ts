import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider, PaymentAttemptStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentPartnerService {
  constructor(private readonly prisma: PrismaService) {}

  async initiatePayment(data: {
    orderId: string;
    userId: string;
    amount: number;
    currency?: string;
    provider?: PaymentProvider;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${data.orderId} not found`);
    }

    const provider = data.provider ?? PaymentProvider.NBE_LICENSED_PARTNER;
    const providerRef = `PAY-${provider}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const attempt = await this.prisma.paymentAttempt.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        provider,
        providerRef,
        amount: new Decimal(data.amount),
        currency: data.currency ?? 'ETB',
        status: PaymentAttemptStatus.INITIATED,
        metadata: {
          checkoutUrl: `https://checkout.partner.ehio.bridge/pay?ref=${providerRef}`,
          partnerNotice:
            'Payment is securely processed through NBE-licensed National Switch / payment partner infrastructure.',
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
      checkoutUrl: (attempt.metadata as Record<string, string>)?.checkoutUrl,
      partnerNotice: (attempt.metadata as Record<string, string>)?.partnerNotice,
    };
  }

  async confirmPayment(paymentAttemptId: string) {
    const attempt = await this.prisma.paymentAttempt.findUnique({
      where: { id: paymentAttemptId },
      include: { order: true },
    });

    if (!attempt) {
      throw new NotFoundException('Payment attempt not found');
    }

    const updatedAttempt = await this.prisma.paymentAttempt.update({
      where: { id: paymentAttemptId },
      data: { status: PaymentAttemptStatus.SUCCESS },
    });

    // Update order status to PAID
    if (attempt.orderId) {
      await this.prisma.order.update({
        where: { id: attempt.orderId },
        data: { status: 'PAID' },
      });
    }

    return updatedAttempt;
  }
}
