import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Lottery, LotteryStatus, TicketStatus } from '@prisma/client';
import { LotteryGateway } from './lottery.gateway';

@Injectable()
export class LotteryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lotteryGateway: LotteryGateway,
  ) {}

  async createLottery(data: {
    carId: string;
    title: string;
    description?: string;
    ticketPrice: number;
    currency?: string;
    totalTickets: number;
    spinDueDate: Date;
  }): Promise<Lottery> {
    // Verify car exists and is available
    const car = await this.prisma.car.findUnique({ where: { id: data.carId } });
    if (!car) {
      throw new NotFoundException('Car not found');
    }
    if (!car.isAvailable) {
      throw new BadRequestException('Car is not available for lottery');
    }

    // Check if car already has an active lottery
    const existingLottery = await this.prisma.lottery.findFirst({
      where: {
        carId: data.carId,
        status: { in: [LotteryStatus.ACTIVE, LotteryStatus.SPINNING] },
      },
    });

    if (existingLottery) {
      throw new BadRequestException('Car already has an active lottery');
    }

    return this.prisma.lottery.create({
      data: {
        carId: data.carId,
        title: data.title,
        description: data.description,
        ticketPrice: data.ticketPrice,
        currency: data.currency || 'ETB',
        totalTickets: data.totalTickets,
        spinDueDate: data.spinDueDate,
        status: LotteryStatus.DRAFT,
      },
      include: { car: true },
    });
  }

  async getLottery(id: string): Promise<Lottery> {
    const lottery = await this.prisma.lottery.findUnique({
      where: { id },
      include: { car: true, tickets: true, spinResult: true },
    });

    if (!lottery) {
      throw new NotFoundException('Lottery not found');
    }

    return lottery;
  }

  async listLotteries(params?: {
    status?: LotteryStatus;
    skip?: number;
    take?: number;
  }): Promise<{ lotteries: Lottery[]; total: number }> {
    const where: any = {};
    if (params?.status) {
      where.status = params.status;
    }

    const [lotteries, total] = await Promise.all([
      this.prisma.lottery.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 20,
        include: { 
          car: true, 
          spinResult: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lottery.count({ where }),
    ]);

    // Manually fetch winner tickets for completed lotteries
    const lotteriesWithWinners = await Promise.all(
      lotteries.map(async (lottery) => {
        if (lottery.status === LotteryStatus.COMPLETED && lottery.winnerTicketId) {
          const winnerTicket = await this.prisma.ticket.findUnique({
            where: { id: lottery.winnerTicketId },
            select: { id: true, ticketNumber: true, userId: true },
          });
          return { ...lottery, winnerTicket };
        }
        return lottery;
      })
    );

    return { lotteries: lotteriesWithWinners, total };
  }

  async updateLottery(
    id: string,
    data: {
      title?: string;
      description?: string;
      ticketPrice?: number;
      totalTickets?: number;
      spinDueDate?: Date;
      status?: LotteryStatus;
    },
  ): Promise<Lottery> {
    const lottery = await this.prisma.lottery.findUnique({ where: { id } });
    if (!lottery) {
      throw new NotFoundException('Lottery not found');
    }

    // Prevent modification if lottery is spinning or completed
    if (lottery.status === LotteryStatus.SPINNING || lottery.status === LotteryStatus.COMPLETED) {
      throw new ForbiddenException('Cannot modify lottery that is spinning or completed');
    }

    // If increasing total tickets, ensure it's not less than sold tickets
    if (data.totalTickets !== undefined && data.totalTickets < lottery.soldTickets) {
      throw new BadRequestException('Total tickets cannot be less than sold tickets');
    }

    return this.prisma.lottery.update({
      where: { id },
      data,
      include: { car: true },
    });
  }

  async deleteLottery(id: string): Promise<Lottery> {
    const lottery = await this.prisma.lottery.findUnique({ where: { id } });
    if (!lottery) {
      throw new NotFoundException('Lottery not found');
    }

    // Only allow deletion of draft lotteries
    if (lottery.status !== LotteryStatus.DRAFT) {
      throw new ForbiddenException('Can only delete draft lotteries');
    }

    return this.prisma.lottery.delete({ where: { id } });
  }

  async publishLottery(id: string): Promise<Lottery> {
    const lottery = await this.prisma.lottery.findUnique({ where: { id } });
    if (!lottery) {
      throw new NotFoundException('Lottery not found');
    }

    if (lottery.status !== LotteryStatus.DRAFT) {
      throw new ForbiddenException('Can only publish draft lotteries');
    }

    return this.prisma.lottery.update({
      where: { id },
      data: { status: LotteryStatus.ACTIVE },
      include: { car: true },
    });
  }

  async startSpin(id: string): Promise<Lottery> {
    const lottery = await this.prisma.lottery.findUnique({
      where: { id },
      include: { tickets: true },
    });

    if (!lottery) {
      throw new NotFoundException('Lottery not found');
    }

    if (lottery.status !== LotteryStatus.ACTIVE) {
      throw new ForbiddenException('Lottery must be active to start spin');
    }

    if (lottery.soldTickets === 0) {
      throw new BadRequestException('Cannot spin lottery with no sold tickets');
    }

    // Update status to spinning
    const updatedLottery = await this.prisma.lottery.update({
      where: { id },
      data: {
        status: LotteryStatus.SPINNING,
        actualSpinDate: new Date(),
      },
      include: { car: true, tickets: true },
    });

    // Notify all connected clients about spin start
    this.lotteryGateway.notifySpinStart(lottery.id);

    return updatedLottery;
  }

  async completeSpin(id: string): Promise<Lottery> {
    const lottery = await this.prisma.lottery.findUnique({
      where: { id },
      include: { tickets: { where: { status: TicketStatus.PAID } } },
    });

    if (!lottery) {
      throw new NotFoundException('Lottery not found');
    }

    if (lottery.status !== LotteryStatus.SPINNING) {
      throw new ForbiddenException('Lottery must be spinning to complete spin');
    }

    // Select random winning ticket
    const paidTickets = lottery.tickets;
    if (paidTickets.length === 0) {
      throw new BadRequestException('No paid tickets available');
    }

    const winningIndex = Math.floor(Math.random() * paidTickets.length);
    const winningTicket = paidTickets[winningIndex];

    const spinStartedAt = lottery.actualSpinDate || new Date();
    const spinCompletedAt = new Date();
    const durationMs = spinCompletedAt.getTime() - spinStartedAt.getTime();

    // Create spin result
    await this.prisma.spinResult.create({
      data: {
        lotteryId: id,
        winningTicketId: winningTicket.id,
        spinStartedAt,
        spinCompletedAt,
        durationMs,
      },
    });

    // Update ticket statuses
    await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id: winningTicket.id },
        data: { status: TicketStatus.WINNING },
      }),
      this.prisma.ticket.updateMany({
        where: {
          lotteryId: id,
          status: TicketStatus.PAID,
          id: { not: winningTicket.id },
        },
        data: { status: TicketStatus.LOSING },
      }),
    ]);

    // Update lottery status
    const updatedLottery = await this.prisma.lottery.update({
      where: { id },
      data: {
        status: LotteryStatus.COMPLETED,
        winnerTicketId: winningTicket.id,
      },
      include: { car: true, tickets: true, spinResult: true },
    });

    // Notify all connected clients about spin completion
    this.lotteryGateway.notifySpinComplete(lottery.id, winningTicket.id);

    return updatedLottery;
  }

  async getLotteryStats(): Promise<{
    totalLotteries: number;
    activeLotteries: number;
    completedLotteries: number;
    totalTicketsSold: number;
  }> {
    const [total, active, completed, ticketsSold] = await Promise.all([
      this.prisma.lottery.count(),
      this.prisma.lottery.count({ where: { status: LotteryStatus.ACTIVE } }),
      this.prisma.lottery.count({ where: { status: LotteryStatus.COMPLETED } }),
      this.prisma.lottery.aggregate({
        _sum: { soldTickets: true },
      }),
    ]);

    return {
      totalLotteries: total,
      activeLotteries: active,
      completedLotteries: completed,
      totalTicketsSold: ticketsSold._sum.soldTickets || 0,
    };
  }
}
