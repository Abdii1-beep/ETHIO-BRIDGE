import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChapaService } from './chapa.service';
import { CurrentUser } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly chapaService: ChapaService) {}

  @Post('chapa/initialize-lottery')
  @Public()
  async initializeLotteryPayment(
    @Body() data: {
      ticketId: string;
      userEmail: string;
      userName: string;
      userPhone: string;
      userId: string;
    },
  ) {
    // Get ticket details to determine amount
    const ticket = await this.chapaService['prisma'].ticket.findUnique({
      where: { id: data.ticketId },
      include: { lottery: true },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Use lottery ticket price as amount
    const amount = Number(ticket.lottery.ticketPrice) || 100; // Default to 100 ETB if no price

    return this.chapaService.initializeLotteryTicketPayment({
      ticketId: data.ticketId,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      userPhone: data.userPhone,
      amount: amount,
    });
  }

  @Get('chapa/callback')
  @Public()
  async handleCallback(@Query('tx_ref') txRef: string, @Res() res: Response) {
    try {
      const paymentAttempt = await this.chapaService.processCallback(txRef);
      
      if (!paymentAttempt) {
        throw new Error('Payment attempt not found');
      }
      
      // Redirect to frontend with payment status
      const returnUrl = process.env.CHAPA_RETURN_URL || 'http://localhost:3003/payment/success';
      const redirectUrl = `${returnUrl}?payment_attempt_id=${paymentAttempt.id}&status=${paymentAttempt.status}`;
      
      return res.redirect(redirectUrl);
    } catch (error: any) {
      const cancelUrl = process.env.CHAPA_CANCEL_URL || 'http://localhost:3003/payment/failed';
      return res.redirect(`${cancelUrl}?error=${encodeURIComponent(error.message || 'Unknown error')}`);
    }
  }

  @Post('chapa/webhook')
  @Public()
  async handleWebhook(@Body() webhookData: any) {
    const txRef = webhookData.tx_ref;
    
    if (!txRef) {
      return { status: 'error', message: 'Missing tx_ref' };
    }

    const paymentAttempt = await this.chapaService.processWebhook(txRef, webhookData);
    
    return { status: 'success', data: paymentAttempt };
  }

  @Get('status/:paymentAttemptId')
  async getPaymentStatus(
    @Param('paymentAttemptId') paymentAttemptId: string,
    @CurrentUser('id') userId: string,
  ) {
    const status = await this.chapaService.getPaymentStatus(paymentAttemptId);
    
    // Ensure user can only see their own payments
    if (status.ticket && status.ticket.userId !== userId) {
      throw new Error('Unauthorized');
    }
    
    return status;
  }
}
