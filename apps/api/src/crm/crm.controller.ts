import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';
import { CrmStage } from '@prisma/client';

@RequiresMember()
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @RequirePermissions('crm.view')
  @Get('leads')
  async listLeads(
    @CurrentMember() member: MemberContext,
    @Query('stage') stage?: CrmStage,
  ) {
    return this.crmService.listLeads(member.organizationId, stage);
  }

  @RequirePermissions('crm.manage')
  @Post('leads')
  async createLead(
    @CurrentMember() member: MemberContext,
    @Body() body: any,
  ) {
    return this.crmService.createLead(member.organizationId, body);
  }

  @RequirePermissions('crm.manage')
  @Patch('leads/:id/stage')
  async updateStage(
    @CurrentMember() member: MemberContext,
    @Param('id') id: string,
    @Body() body: { stage: CrmStage },
  ) {
    return this.crmService.updateLeadStage(id, member.organizationId, body.stage);
  }

  @RequirePermissions('crm.view')
  @Get('summary')
  async getSummary(@CurrentMember() member: MemberContext) {
    return this.crmService.getPipelineSummary(member.organizationId);
  }
}
