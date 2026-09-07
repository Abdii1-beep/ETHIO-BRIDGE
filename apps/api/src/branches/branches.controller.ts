import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { BranchesService, BranchDto } from './branches.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';

@RequiresMember()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @RequirePermissions('branches.manage')
  @Post()
  create(@CurrentMember() member: MemberContext, @Body() dto: BranchDto) {
    return this.branches.create(member, dto);
  }

  @RequirePermissions('branches.view')
  @Get()
  list(@CurrentMember() member: MemberContext) {
    return this.branches.list(member);
  }

  @RequirePermissions('branches.view')
  @Get(':id')
  getById(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    return this.branches.getById(member, id);
  }

  @RequirePermissions('branches.manage')
  @Put(':id')
  update(@CurrentMember() member: MemberContext, @Param('id') id: string, @Body() dto: Partial<BranchDto>) {
    return this.branches.update(member, id, dto);
  }

  @RequirePermissions('branches.manage')
  @Delete(':id')
  remove(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    return this.branches.remove(member, id);
  }
}