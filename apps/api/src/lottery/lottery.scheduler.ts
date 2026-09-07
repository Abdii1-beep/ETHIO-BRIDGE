import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { LotteryService } from './lottery.service';
import { LotteryStatus } from '@prisma/client';

@Injectable()
export class LotteryScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lotteryService: LotteryService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkDueLotteries() {
    try {
      const now = new Date();
      
      // Find lotteries that are ACTIVE and past their due date
      const dueLotteries = await this.prisma.lottery.findMany({
        where: {
          status: LotteryStatus.ACTIVE,
          spinDueDate: {
            lte: now,
          },
        },
      });

      for (const lottery of dueLotteries) {
        console.log(`Auto-starting spin for lottery: ${lottery.id}`);
        try {
          await this.lotteryService.startSpin(lottery.id);
          
          // Automatically complete the spin after a short delay (e.g., 5 seconds)
          setTimeout(async () => {
            try {
              await this.lotteryService.completeSpin(lottery.id);
              console.log(`Auto-completed spin for lottery: ${lottery.id}`);
            } catch (error) {
              console.error(`Failed to auto-complete spin for lottery ${lottery.id}:`, error);
            }
          }, 5000);
        } catch (error) {
          console.error(`Failed to auto-start spin for lottery ${lottery.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking due lotteries:', error);
    }
  }
}
