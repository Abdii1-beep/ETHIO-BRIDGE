import { Module } from '@nestjs/common';
import { LotteryController } from './lottery.controller';
import { LotteryService } from './lottery.service';
import { CarController } from './car.controller';
import { CarService } from './car.service';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LotteryGateway } from './lottery.gateway';
import { LotteryScheduler } from './lottery.scheduler';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [LotteryController, CarController, TicketController],
  providers: [LotteryService, CarService, TicketService, LotteryGateway, LotteryScheduler],
  exports: [LotteryService, CarService, TicketService],
})
export class LotteryModule {}
