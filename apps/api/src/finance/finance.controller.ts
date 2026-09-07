import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  CreateChartAccountDto,
  CreateTransactionDto,
  FinanceService,
  UpdateChartAccountDto,
} from './finance.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';

@RequiresMember()
@Controller('transactions')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  // ---------- Chart of accounts ----------
  @RequirePermissions('finance.view')
  @Get('accounts')
  listAccounts(@CurrentMember() member: MemberContext) {
    return this.finance.listAccounts(member);
  }

  @RequirePermissions('finance.create')
  @Post('accounts')
  createAccount(@CurrentMember() member: MemberContext, @Body() dto: CreateChartAccountDto) {
    return this.finance.createAccount(member, dto);
  }

  @RequirePermissions('finance.create')
  @Put('accounts/:id')
  updateAccount(
    @CurrentMember() member: MemberContext,
    @Param('id') id: string,
    @Body() dto: UpdateChartAccountDto,
  ) {
    return this.finance.updateAccount(member, id, dto);
  }

  // ---------- Reports ----------
  @RequirePermissions('finance.view')
  @Get('summary')
  summary(@CurrentMember() member: MemberContext) {
    return this.finance.summary(member);
  }

  // ---------- Transactions ----------
  @RequirePermissions('finance.create')
  @Post()
  create(@CurrentMember() member: MemberContext, @Body() dto: CreateTransactionDto) {
    return this.finance.create(member, dto);
  }

  @RequirePermissions('finance.view')
  @Get()
  list(
    @CurrentMember() member: MemberContext,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.finance.list(member, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      type,
      accountId,
    });
  }

  @RequirePermissions('finance.view')
  @Get(':id')
  getById(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    return this.finance.getById(member, id);
  }

  @RequirePermissions('finance.delete')
  @Delete(':id')
  remove(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    return this.finance.remove(member, id);
  }
}