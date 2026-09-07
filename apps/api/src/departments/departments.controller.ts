import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { DepartmentsService, DepartmentDto } from './departments.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';

@RequiresMember()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @RequirePermissions('departments.manage')
  @Post()
  create(@CurrentMember() member: MemberContext, @Body() dto: DepartmentDto) {
    return this.departments.create(member, dto);
  }

  @RequirePermissions('departments.view')
  @Get()
  list(@CurrentMember() member: MemberContext) {
    return this.departments.list(member);
  }

  @RequirePermissions('departments.view')
  @Get(':id')
  getById(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    return this.departments.getById(member, id);
  }

  @RequirePermissions('departments.manage')
  @Put(':id')
  update(@CurrentMember() member: MemberContext, @Param('id') id: string, @Body() dto: Partial<DepartmentDto>) {
    return this.departments.update(member, id, dto);
  }

  @RequirePermissions('departments.manage')
  @Delete(':id')
  remove(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    return this.departments.remove(member, id);
  }
}