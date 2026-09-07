import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { MembersService, ClaimInviteDto, InviteUserDto } from './members.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { CurrentUser, JwtUser } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';

@Controller('users')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @RequiresMember()
  @RequirePermissions('users.view')
  @Get()
  list(@CurrentMember() member: MemberContext) {
    return this.members.list(member);
  }

  @RequiresMember()
  @RequirePermissions('users.invite')
  @Post('invite')
  invite(@CurrentMember() member: MemberContext, @Body() dto: InviteUserDto) {
    return this.members.invite(member, dto);
  }

  @Post('invitations/claim')
  claim(@CurrentUser() user: JwtUser, @Body() dto: ClaimInviteDto) {
    return this.members.claim(user.sub, dto);
  }

  @RequiresMember()
  @RequirePermissions('users.edit')
  @Put(':memberId')
  update(
    @CurrentMember() member: MemberContext,
    @Param('memberId') memberId: string,
    @Body() dto: { title?: string; roleIds?: string[]; branchIds?: string[]; departmentIds?: string[] },
  ) {
    return this.members.updateAssignments(member, memberId, dto);
  }

  @RequiresMember()
  @RequirePermissions('users.disable')
  @Post(':memberId/disable')
  disable(
    @CurrentMember() member: MemberContext,
    @Param('memberId') memberId: string,
    @Body() body: { reason?: string } = {},
  ) {
    return this.members.disable(member, memberId, body.reason);
  }

  @RequiresMember()
  @RequirePermissions('users.edit')
  @Post(':memberId/enable')
  enable(@CurrentMember() member: MemberContext, @Param('memberId') memberId: string) {
    return this.members.enable(member, memberId);
  }
}