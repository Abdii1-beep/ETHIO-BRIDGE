import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CommissionService } from './commission.service';
import { SubscriptionService } from './subscription.service';
import { PaymentPartnerService } from './payment-partner.service';
import { MonetizationController } from './monetization.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MonetizationController],
  providers: [
    WalletService,
    CommissionService,
    SubscriptionService,
    PaymentPartnerService,
  ],
  exports: [
    WalletService,
    CommissionService,
    SubscriptionService,
    PaymentPartnerService,
  ],
})
export class MonetizationModule {}
