import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { CurrentUser, JwtUser, Public } from '../common/guards/jwt-auth.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';
import { CreateOrganizationDto, UpdateOrganizationDto } from '../auth/auth.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateOrganizationDto) {
    return this.orgs.create(user.sub, dto);
  }

  @Get('me')
  myOrganizations(@CurrentUser() user: JwtUser) {
    return this.orgs.myOrganizations(user.sub);
  }

  @Public()
  @Get('org-directory')
  directory(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.orgs.directory(q, limit ? parseInt(limit, 10) : undefined);
  }

  @RequiresMember()
  @Get(':id')
  getById(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    return this.orgs.getById(member, id);
  }

  @RequiresMember()
  @RequirePermissions('company.edit')
  @Put(':id')
  update(
    @CurrentMember() member: MemberContext,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgs.update(member, id, dto);
  }
}