import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CurrentUser } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/guards/jwt-auth.guard';
import { TicketStatus } from '@prisma/client';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @Public()
  async buyTicket(@Body() data: { lotteryId: string }, @CurrentUser('id') userId?: string) {
    // Temporarily allow without auth for debugging
    if (!userId) {
      // For testing, use a dummy user ID
      userId = 'test-user-id';
    }
    return this.ticketService.buyTicket({ lotteryId: data.lotteryId, userId });
  }

  @Get('my')
  async getMyTickets(
    @CurrentUser('id') userId: string,
    @Query('lotteryId') lotteryId?: string,
    @Query('status') status?: TicketStatus,
  ) {
    return this.ticketService.getUserTickets(userId, { lotteryId, status });
  }

  @Get(':id')
  async getTicket(@Param('id') id: string) {
    return this.ticketService.getTicket(id);
  }

  @Get('lottery/:lotteryId')
  async getLotteryTickets(@Param('lotteryId') lotteryId: string) {
    return this.ticketService.getLotteryTickets(lotteryId);
  }
}
