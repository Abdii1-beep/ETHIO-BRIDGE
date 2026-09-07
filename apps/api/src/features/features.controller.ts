import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FeatureRequestDto, FeaturesService } from './features.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';

@RequiresMember()
@Controller()
export class FeaturesController {
  constructor(private readonly features: FeaturesService) {}

  @RequirePermissions('features.view')
  @Get('features')
  catalog(@CurrentMember() member: MemberContext) {
    return this.features.catalog(member);
  }

  @RequirePermissions('features.view')
  @Get('organizations/me/features')
  myFeatures(@CurrentMember() member: MemberContext) {
    return this.features.myFeatures(member);
  }

  @RequirePermissions('features.request')
  @Post('features/request')
  request(@CurrentMember() member: MemberContext, @Body() dto: FeatureRequestDto) {
    return this.features.request(member, dto);
  }

  @RequirePermissions('features.activate')
  @Post('features/:id/activate')
  activate(@CurrentMember() member: MemberContext, @Param('id') id: string, @Body() dto: { note?: string }) {
    return this.features.activate(member, id, dto.note);
  }

  @RequirePermissions('features.manage')
  @Post('features/:id/deactivate')
  deactivate(@CurrentMember() member: MemberContext, @Param('id') id: string) {
    return this.features.deactivate(member, id);
  }
}