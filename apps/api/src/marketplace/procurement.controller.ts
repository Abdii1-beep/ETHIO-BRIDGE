import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentMember, MemberContext, RequiresMember } from '../common/guards/org-member.guard';

@RequiresMember()
@Controller('procurement')
export class ProcurementController {
  @RequirePermissions('procurement.view')
  @Get()
  async listProcurements(@CurrentMember() member: MemberContext, @Query() query: any) {
    // Return procurement requests for the organization
    return {
      success: true,
      data: {
        procurements: [],
        total: 0,
        pending: 0,
        approved: 0,
        budget: {
          allocated: 0,
          spent: 0,
          remaining: 0
        }
      }
    };
  }

  @RequirePermissions('procurement.create')
  @Post()
  async createProcurement(@CurrentMember() member: MemberContext, @Body() data: any) {
    // Create a new procurement request
    return {
      success: true,
      data: {
        id: 'procurement-id',
        ...data,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }
    };
  }

  @RequirePermissions('procurement.view')
  @Get(':id')
  async getProcurement(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    // Get specific procurement details
    return {
      success: true,
      data: {
        id,
        items: [],
        totalAmount: 0,
        currency: 'ETB',
        status: 'PENDING',
        requestedBy: member.userId
      }
    };
  }

  @RequirePermissions('procurement.manage')
  @Put(':id')
  async updateProcurement(@CurrentMember() member: MemberContext, @Param('id') id: string, @Body() data: any) {
    // Update procurement request
    return {
      success: true,
      data: {
        id,
        ...data,
        updatedAt: new Date().toISOString()
      }
    };
  }

  @RequirePermissions('procurement.manage')
  @Post(':id/approve')
  async approveProcurement(@CurrentMember() member: MemberContext, @Param('id') id: string, @Body() data: any) {
    // Approve procurement request
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

  @RequirePermissions('procurement.manage')
  @Delete(':id')
  async deleteProcurement(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    // Delete procurement request
    return {
      success: true,
      data: { id }
    };
  }
}