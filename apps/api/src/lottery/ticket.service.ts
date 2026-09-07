import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, TicketStatus, LotteryStatus } from '@prisma/client';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  async buyTicket(data: {
    lotteryId: string;
    userId: string;
  }): Promise<Ticket> {
    console.log('Buying ticket for lottery:', data.lotteryId, 'user:', data.userId);
    
    // Verify lottery exists and is active
    const lottery = await this.prisma.lottery.findUnique({
      where: { id: data.lotteryId },
    });

    console.log('Lottery found:', lottery);

    if (!lottery) {
      throw new NotFoundException('Lottery not found');
    }

    if (lottery.status !== LotteryStatus.ACTIVE) {
      throw new ForbiddenException('Lottery is not active');
    }

    if (lottery.soldTickets >= lottery.totalTickets) {
      throw new BadRequestException('All tickets have been sold');
    }

    // Check if user already has a ticket for this lottery
    const existingTicket = await this.prisma.ticket.findFirst({
      where: {
        lotteryId: data.lotteryId,
        userId: data.userId,
      },
    });

    if (existingTicket) {
      throw new BadRequestException('User already has a ticket for this lottery');
    }

    // Get next available ticket number
    const existingTickets = await this.prisma.ticket.findMany({
      where: { lotteryId: data.lotteryId },
      select: { ticketNumber: true },
    });

    const usedNumbers = new Set(existingTickets.map((t) => t.ticketNumber));
    let nextTicketNumber = 1;
    while (usedNumbers.has(nextTicketNumber)) {
      nextTicketNumber++;
    }

    // Create ticket with PENDING status (payment required)
    const ticket = await this.prisma.ticket.create({
      data: {
        lotteryId: data.lotteryId,
        userId: data.userId,
        ticketNumber: nextTicketNumber,
        status: TicketStatus.PENDING,
      },
    });

    console.log('Ticket created with PENDING status:', ticket);

    // Note: soldTickets count will be incremented after successful payment

    return ticket;
  }

  async getTicket(id: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { lottery: { include: { car: true } }, user: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async getUserTickets(userId: string, params?: {
    lotteryId?: string;
    status?: TicketStatus;
  }): Promise<Ticket[]> {
    const where: any = { userId };
    if (params?.lotteryId) {
      where.lotteryId = params.lotteryId;
    }
    if (params?.status) {
      where.status = params.status;
    }

    return this.prisma.ticket.findMany({
      where,
      include: { lottery: { include: { car: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLotteryTickets(lotteryId: string): Promise<Ticket[]> {
    return this.prisma.ticket.findMany({
      where: { lotteryId },
      include: { user: true },
      orderBy: { ticketNumber: 'asc' },
    });
  }
}
