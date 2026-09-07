import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentMember, MemberContext, RequiresMember } from '../common/guards/org-member.guard';

@RequiresMember()
@Controller('expenses')
export class ExpensesController {
  @RequirePermissions('expenses.view')
  @Get()
  async listExpenses(@CurrentMember() member: MemberContext, @Query() query: any) {
    // Return expenses data for the organization
    return {
      success: true,
      data: {
        expenses: [],
        total: 0,
        summary: {
          today: 0,
          week: 0,
          month: 0,
          year: 0,
          byCategory: {}
        }
      }
    };
  }

  @RequirePermissions('expenses.create')
  @Post()
  async createExpense(@CurrentMember() member: MemberContext, @Body() data: any) {
    // Create a new expense record
    return {
      success: true,
      data: {
        id: 'expense-id',
        ...data,
        createdAt: new Date().toISOString()
      }
    };
  }

  @RequirePermissions('expenses.view')
  @Get(':id')
  async getExpense(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    // Get specific expense details
    return {
      success: true,
      data: {
        id,
        amount: 0,
        currency: 'ETB',
        category: '',
        description: '',
        status: 'PENDING'
      }
    };
  }

  @RequirePermissions('expenses.manage')
  @Put(':id')
  async updateExpense(@CurrentMember() member: MemberContext, @Param('id') id: string, @Body() data: any) {
    // Update expense record
    return {
      success: true,
      data: {
        id,
        ...data,
        updatedAt: new Date().toISOString()
      }
    };
  }

  @RequirePermissions('expenses.manage')
  @Delete(':id')
  async deleteExpense(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    // Delete expense record
    return {
      success: true,
      data: { id }
    };
  }

  @RequirePermissions('expenses.manage')
  @Post(':id/approve')
  async approveExpense(@CurrentMember() member: MemberContext, @Param('id') id: string, @Body() data: any) {
    // Approve expense
    return {
      success: true,
      data: {
        id,
        status: 'APPROVED',
        approvedBy: member.userId,
        approvedAt: new Date().toISOString()
      }
    };
  }
}