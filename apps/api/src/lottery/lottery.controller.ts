import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { LotteryService } from './lottery.service';
import { RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/guards/jwt-auth.guard';
import { LotteryStatus } from '@prisma/client';

@Controller('lotteries')
export class LotteryController {
  constructor(private readonly lotteryService: LotteryService) {}

  @Post()
  @RequirePermissions('lottery.manage')
  async createLottery(@Body() data: any, @CurrentUser('id') userId: string) {
    return this.lotteryService.createLottery(data);
  }

  @Get()
  @Public()
  async listLotteries(
    @Query('status') status?: LotteryStatus,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.lotteryService.listLotteries({
      status,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get('stats')
  async getLotteryStats() {
    return this.lotteryService.getLotteryStats();
  }

  @Get(':id')
  async getLottery(@Param('id') id: string) {
    return this.lotteryService.getLottery(id);
  }

  @Patch(':id')
  @RequirePermissions('lottery.manage')
  async updateLottery(@Param('id') id: string, @Body() data: any) {
    return this.lotteryService.updateLottery(id, data);
  }

  @Delete(':id')
  @RequirePermissions('lottery.manage')
  async deleteLottery(@Param('id') id: string) {
    return this.lotteryService.deleteLottery(id);
  }

  @Post(':id/publish')
  @RequirePermissions('lottery.manage')
  async publishLottery(@Param('id') id: string) {
    return this.lotteryService.publishLottery(id);
  }

  @Post(':id/start-spin')
  @RequirePermissions('lottery.manage')
  async startSpin(@Param('id') id: string) {
    return this.lotteryService.startSpin(id);
  }

  @Post(':id/complete-spin')
  @RequirePermissions('lottery.manage')
  async completeSpin(@Param('id') id: string) {
    return this.lotteryService.completeSpin(id);
  }
}
