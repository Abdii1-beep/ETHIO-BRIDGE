import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { ChapaService } from './chapa.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentsController],
  providers: [ChapaService],
  exports: [ChapaService],
})
export class PaymentsModule {}
