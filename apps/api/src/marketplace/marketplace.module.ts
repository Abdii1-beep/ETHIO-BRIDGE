import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { MarketplaceController } from './marketplace.controller';
import { ProductsService } from './products.service';
import { RfqService } from './rfq.service';
import { ChatService } from './chat.service';
import { AppointmentService } from './appointment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, MonetizationModule, AiModule],
  controllers: [
    SalesController,
    InventoryController,
    ProcurementController,
    ExpensesController,
    MarketplaceController,
  ],
  providers: [
    SalesService,
    InventoryService,
    ProcurementService,
    ExpensesService,
    ProductsService,
    RfqService,
    ChatService,
    AppointmentService,
  ],
  exports: [
    SalesService,
    InventoryService,
    ProcurementService,
    ExpensesService,
    ProductsService,
    RfqService,
    ChatService,
    AppointmentService,
  ],
})
export class MarketplaceModule {}