import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AiAuditDto, AiService } from './ai.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';
import { RequireFeatures } from '../common/guards/features.guard';

@RequiresMember()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @RequirePermissions('ai.use')
  @RequireFeatures('AI_TRANSLATION')
  @Post('translate')
  translate(
    @CurrentMember() member: MemberContext,
    @Body()
    dto: {
      text: string;
      sourceLang: string;
      targetLangs: string[];
    },
  ) {
    return this.ai.translateText(member, dto);
  }

  @RequirePermissions('ai.use')
  @RequireFeatures('AI_PRODUCT')
  @Post('product')
  generateProduct(
    @CurrentMember() member: MemberContext,
    @Body()
    dto: {
      productName: string;
      category: string;
      originalDescription?: string;
      sourceLanguage?: string;
    },
  ) {
    return this.ai.generateProductContent(member, dto);
  }

  @Post('product-content')
  generateProductTranslations(
    @CurrentMember() member: MemberContext,
    @Body()
    dto: { title: string; description: string; sourceLanguage?: string },
  ) {
    return this.ai.generateProductTranslations(member, dto);
  }

  @RequirePermissions('ai.use')
  @RequireFeatures('AI_MATCHING')
  @Post('matching')
  matchSuppliers(
    @CurrentMember() member: MemberContext,
    @Body()
    dto: {
      rfqTitle?: string;
      category?: string;
      targetCountry?: string;
      requiredQuantity?: number;
    },
  ) {
    return this.ai.matchSuppliers(member, dto);
  }

  @RequirePermissions('ai.use')
  @RequireFeatures('AI_MARKET_INTELLIGENCE')
  @Get('market-intelligence')
  getMarketIntelligence(
    @CurrentMember() member: MemberContext,
    @Query('industry') industry?: string,
    @Query('country') country?: string,
  ) {
    return this.ai.getMarketIntelligence(member, { industry, country });
  }

  @RequirePermissions('ai.use')
  @RequireFeatures('AI_AUDIT')
  @Post('audit')
  audit(@CurrentMember() member: MemberContext, @Body() dto: AiAuditDto) {
    return this.ai.audit(member, dto);
  }

  @Post('marketing/generate-campaign')
  generateMarketingCampaign(
    @CurrentMember() member: MemberContext,
    @Body()
    dto: {
      topic: string;
      category?: string;
      targetAudience: string;
      channels: string[];
      valueProposition?: string;
      discountOrOffer?: string;
    },
  ) {
    return this.ai.generateMarketingCampaign(member, dto);
  }

  @Get('marketing/analytics')
  getMarketingAnalytics(@CurrentMember() member: MemberContext) {
    return this.ai.getMarketingAnalytics(member);
  }
}