import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TranslationService } from './translation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.service';
import { MonetizationModule } from '../monetization/monetization.module';

@Module({
  imports: [PrismaModule, AuditModule, MonetizationModule],
  controllers: [AiController],
  providers: [AiService, TranslationService],
  exports: [AiService, TranslationService],
})
export class AiModule {}