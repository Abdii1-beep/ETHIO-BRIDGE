import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider, PaymentAttemptStatus, TicketStatus, LotteryStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import axios, { AxiosInstance } from 'axios';

interface ChapaInitializeRequest {
  amount: string;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title: string;
    description: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

interface ChapaInitializeResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
    tx_ref: string;
  };
}

interface ChapaVerifyResponse {
  message: string;
  status: string;
  data: {
    amount: string;
    currency: string;
    status: string;
    tx_ref: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    payment_method: string;
    created_at: string;
    updated_at: string;
  };
}

@Injectable()
export class ChapaService {
  private readonly logger = new Logger(ChapaService.name);
  private readonly axios: AxiosInstance;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.config.get<string>('CHAPA_SECRET_KEY');
    const baseUrl = this.config.get<string>('CHAPA_BASE_URL', 'https://api.chapa.co');

    if (!secretKey) {
      this.logger.warn('CHAPA_SECRET_KEY not configured. Payment integration will not work.');
    }

    this.axios = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private generateTxRef(prefix: string = 'GECHO'): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async initializeLotteryTicketPayment(data: {
    ticketId: string;
    userId: string;
    userEmail: string;
    userName: string;
    userPhone: string;
    amount: number;
    currency?: string;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: data.ticketId },
      include: { lottery: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status !== TicketStatus.PENDING) {
      throw new BadRequestException('Ticket is not available for purchase');
    }

    if (ticket.lottery.status !== LotteryStatus.ACTIVE) {
      throw new BadRequestException('Lottery is not active');
    }

    // Check if there's already a pending payment for this ticket
    const existingPayment = await this.prisma.paymentAttempt.findFirst({
      where: {
        ticketId: data.ticketId,
        status: { in: [PaymentAttemptStatus.INITIATED, PaymentAttemptStatus.PENDING] },
      },
    });

    if (existingPayment) {
      // Return existing payment attempt
      const metadata = existingPayment.metadata as any;
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
    const callbackUrl = this.config.get<string>('CHAPA_CALLBACK_URL');
    const returnUrl = this.config.get<string>('CHAPA_RETURN_URL');
    const cancelUrl = this.config.get<string>('CHAPA_CANCEL_URL');

    if (!callbackUrl || !returnUrl) {
      throw new BadRequestException('Payment callback URLs not configured');
    }

    const chapaRequest: ChapaInitializeRequest = {
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
      const response = await this.axios.post<ChapaInitializeResponse>(
        '/v1/transaction/initialize',
        chapaRequest,
      );

      if (response.data.status !== 'success') {
        throw new BadRequestException('Failed to initialize payment with Chapa');
      }

      // Create payment attempt record
      const paymentAttempt = await this.prisma.paymentAttempt.create({
        data: {
          ticketId: data.ticketId,
          userId: data.userId,
          provider: PaymentProvider.CHAPA,
          providerRef: txRef,
          amount: new Decimal(data.amount),
          currency: data.currency || 'ETB',
          status: PaymentAttemptStatus.INITIATED,
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
    } catch (error) {
      this.logger.error('Chapa initialization failed:', error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Payment initialization failed: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  async verifyTransaction(txRef: string): Promise<ChapaVerifyResponse['data']> {
    try {
      const response = await this.axios.get<{ data: ChapaVerifyResponse['data'] }>(
        `/v1/transaction/verify/${txRef}`,
      );

      const transactionData = response.data.data;

      this.logger.log(`Transaction verified: ${txRef}, status: ${transactionData.status}`);

      return transactionData;
    } catch (error) {
      this.logger.error(`Transaction verification failed for ${txRef}:`, error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Transaction verification failed: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  async processCallback(txRef: string) {
    const paymentAttempt = await this.prisma.paymentAttempt.findUnique({
      where: { providerRef: txRef },
    });

    if (!paymentAttempt) {
      throw new NotFoundException('Payment attempt not found');
    }

    // Get ticket for this payment
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: paymentAttempt.ticketId! },
      include: { lottery: true },
    });

    // Update callback received flag
    await this.prisma.paymentAttempt.update({
      where: { id: paymentAttempt.id },
      data: { callbackReceived: true },
    });

    // Verify transaction with Chapa
    const transactionData = await this.verifyTransaction(txRef);

    // Check if already processed (idempotency)
    if (paymentAttempt.verified && paymentAttempt.status === PaymentAttemptStatus.SUCCESS) {
      this.logger.log(`Payment ${txRef} already processed, skipping`);
      return paymentAttempt;
    }

    // Validate amount and currency
    const expectedAmount = Number(paymentAttempt.amount);
    const actualAmount = parseFloat(transactionData.amount);
    
    if (Math.abs(expectedAmount - actualAmount) > 0.01) {
      this.logger.error(`Amount mismatch for ${txRef}: expected ${expectedAmount}, got ${actualAmount}`);
      throw new BadRequestException('Payment amount does not match');
    }

    if (transactionData.currency !== paymentAttempt.currency) {
      this.logger.error(`Currency mismatch for ${txRef}: expected ${paymentAttempt.currency}, got ${transactionData.currency}`);
      throw new BadRequestException('Payment currency does not match');
    }

    // Update payment attempt based on Chapa status
    if (transactionData.status === 'success' && ticket) {
      await this.prisma.$transaction([
        // Update payment attempt
        this.prisma.paymentAttempt.update({
          where: { id: paymentAttempt.id },
          data: {
            status: PaymentAttemptStatus.SUCCESS,
            verified: true,
            paymentMethod: transactionData.payment_method,
            paidAt: new Date(),
          },
        }),
        // Activate ticket
        this.prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: TicketStatus.PAID,
            purchasedAt: new Date(),
          },
        }),
        // Update lottery sold tickets count
        this.prisma.lottery.update({
          where: { id: ticket.lotteryId },
          data: { soldTickets: { increment: 1 } },
        }),
      ]);

      this.logger.log(`Payment successful: ${txRef}, ticket ${paymentAttempt.ticketId} activated`);
    } else {
      await this.prisma.paymentAttempt.update({
        where: { id: paymentAttempt.id },
        data: {
          status: PaymentAttemptStatus.FAILED,
          failedAt: new Date(),
        },
      });

      this.logger.log(`Payment failed: ${txRef}`);
    }

    return await this.prisma.paymentAttempt.findUnique({
      where: { id: paymentAttempt.id },
    });
  }

  async processWebhook(txRef: string, webhookData: any) {
    const paymentAttempt = await this.prisma.paymentAttempt.findUnique({
      where: { providerRef: txRef },
    });

    if (!paymentAttempt) {
      this.logger.warn(`Webhook received for unknown payment: ${txRef}`);
      return null;
    }

    // Get ticket for this payment
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: paymentAttempt.ticketId! },
      include: { lottery: true },
    });

    // Update webhook received flag
    await this.prisma.paymentAttempt.update({
      where: { id: paymentAttempt.id },
      data: { webhookReceived: true },
    });

    // Check if already processed (idempotency)
    if (paymentAttempt.verified && paymentAttempt.status === PaymentAttemptStatus.SUCCESS) {
      this.logger.log(`Webhook for ${txRef} already processed, skipping`);
      return paymentAttempt;
    }

    // Verify transaction with Chapa to ensure webhook is legitimate
    const transactionData = await this.verifyTransaction(txRef);

    // Validate amount and currency
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

    // Update payment attempt based on Chapa status
    if (transactionData.status === 'success' && ticket) {
      await this.prisma.$transaction([
        // Update payment attempt
        this.prisma.paymentAttempt.update({
          where: { id: paymentAttempt.id },
          data: {
            status: PaymentAttemptStatus.SUCCESS,
            verified: true,
            paymentMethod: transactionData.payment_method,
            paidAt: new Date(),
          },
        }),
        // Activate ticket
        this.prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: TicketStatus.PAID,
            purchasedAt: new Date(),
          },
        }),
        // Update lottery sold tickets count
        this.prisma.lottery.update({
          where: { id: ticket.lotteryId },
          data: { soldTickets: { increment: 1 } },
        }),
      ]);

      this.logger.log(`Webhook processed successfully: ${txRef}, ticket ${paymentAttempt.ticketId} activated`);
    } else {
      await this.prisma.paymentAttempt.update({
        where: { id: paymentAttempt.id },
        data: {
          status: PaymentAttemptStatus.FAILED,
          failedAt: new Date(),
        },
      });

      this.logger.log(`Webhook payment failed: ${txRef}`);
    }

    return await this.prisma.paymentAttempt.findUnique({
      where: { id: paymentAttempt.id },
    });
  }

  async getPaymentStatus(paymentAttemptId: string) {
    const paymentAttempt = await this.prisma.paymentAttempt.findUnique({
      where: { id: paymentAttemptId },
    });

    if (!paymentAttempt) {
      throw new NotFoundException('Payment attempt not found');
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
}
