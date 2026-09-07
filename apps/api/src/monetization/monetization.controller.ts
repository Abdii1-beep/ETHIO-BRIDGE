import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CommissionService } from './commission.service';
import { SubscriptionService } from './subscription.service';
import { PaymentPartnerService } from './payment-partner.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';
import { Public } from '../common/guards/jwt-auth.guard';
import { PaymentProvider } from '@prisma/client';

@Controller()
export class MonetizationController {
  constructor(
    private readonly walletService: WalletService,
    private readonly commissionService: CommissionService,
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentPartnerService: PaymentPartnerService,
  ) {}

  @Public()
  @Get('billing/plans')
  async getPlans() {
    return this.subscriptionService.getPlans();
  }

  @RequiresMember()
  @RequirePermissions('billing.view')
  @Get('billing/subscription')
  async getSubscription(@CurrentMember() member: MemberContext) {
    return this.subscriptionService.getCurrentSubscription(member.organizationId);
  }

  @RequiresMember()
  @RequirePermissions('billing.manage')
  @Post('billing/subscription')
  async subscribe(
    @CurrentMember() member: MemberContext,
    @Body() body: { planCode: string },
  ) {
    return this.subscriptionService.subscribe(member.organizationId, body.planCode);
  }

  @RequiresMember()
  @RequirePermissions('wallet.view')
  @Get('wallet')
  async getWallet(@CurrentMember() member: MemberContext) {
    return this.walletService.getOrCreateWallet(member.organizationId);
  }

  @RequiresMember()
  @RequirePermissions('wallet.transact')
  @Post('wallet/deposit')
  async deposit(
    @CurrentMember() member: MemberContext,
    @Body() body: { amount: number; description?: string; referenceId?: string },
  ) {
    return this.walletService.deposit(
      member.organizationId,
      body.amount,
      'TOPUP',
      body.description ?? 'Wallet deposit',
      body.referenceId,
    );
  }

  @RequiresMember()
  @RequirePermissions('wallet.view')
  @Get('wallet/transactions')
  async getWalletTransactions(@CurrentMember() member: MemberContext) {
    return this.walletService.getTransactions(member.organizationId);
  }

  @Public()
  @Get('commissions/rule')
  async getCommissionRule(@Query('type') type?: string) {
    return this.commissionService.getActiveRule(type ?? 'B2B_TRADE');
  }

  @Public()
  @Post('commissions/calculate')
  async calculateCommission(
    @Body() body: { grossAmount: number; currency?: string; transactionType?: string },
  ) {
    return this.commissionService.calculateCommission(
      body.grossAmount,
      body.currency ?? 'ETB',
      body.transactionType ?? 'B2B_TRADE',
    );
  }

  @RequiresMember()
  @RequirePermissions('billing.view')
  @Get('commissions/summary')
  async getCommissionSummary(@CurrentMember() member: MemberContext) {
    return this.commissionService.getCommissionSummary(member.organizationId);
  }

  @RequiresMember()
  @RequirePermissions('orders.manage')
  @Post('payments/initiate')
  async initiatePayment(
    @CurrentMember() member: MemberContext,
    @Body()
    body: {
      orderId: string;
      amount: number;
      currency?: string;
      provider?: PaymentProvider;
    },
  ) {
    return this.paymentPartnerService.initiatePayment({
      ...body,
      userId: member.userId,
    });
  }

  @RequiresMember()
  @RequirePermissions('orders.manage')
  @Post('payments/confirm')
  async confirmPayment(@Body() body: { paymentAttemptId: string }) {
    return this.paymentPartnerService.confirmPayment(body.paymentAttemptId);
  }
}
