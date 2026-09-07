import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateRoleDto, RolesService, UpdateRoleDto } from './roles.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';

@RequiresMember()
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @RequirePermissions('roles.view')
  @Get('permissions')
  catalog(@CurrentMember() member: MemberContext) {
    return this.roles.catalog();
  }

  @RequirePermissions('roles.view')
  @Get()
  list(@CurrentMember() member: MemberContext) {
    return this.roles.list(member);
  }

  @RequirePermissions('roles.view')
  @Get(':id')
  getById(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    return this.roles.getById(member, id);
  }

  @RequirePermissions('roles.manage')
  @Post()
  create(@CurrentMember() member: MemberContext, @Body() dto: CreateRoleDto) {
    return this.roles.create(member, dto);
  }

  @RequirePermissions('roles.manage')
  @Put(':id')
  update(@CurrentMember() member: MemberContext, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(member, id, dto);
  }

  @RequirePermissions('roles.manage')
  @Delete(':id')
  remove(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    return this.roles.remove(member, id);
  }
}