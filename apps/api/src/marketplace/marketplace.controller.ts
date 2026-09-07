import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { ProductsService, ProductSort } from './products.service';
import { RfqService } from './rfq.service';
import { ChatService } from './chat.service';
import { AppointmentService } from './appointment.service';
import {
  CurrentMember,
  MemberContext,
  RequiresMember,
} from '../common/guards/org-member.guard';
import { RequirePermissions } from '../common/guards/permissions.guard';
import { Public } from '../common/guards/jwt-auth.guard';
import { RfqStatus, ProductVisibility } from '@prisma/client';

@Controller()
export class MarketplaceController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly rfqService: RfqService,
    private readonly chatService: ChatService,
    private readonly appointmentService: AppointmentService,
  ) {}

  // --- Products ---

  @Public()
  @Get('products')
  async listProducts(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('originCountry') originCountry?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('language') language?: string,
    @Query('sort') sort?: ProductSort,
  ) {
    return this.productsService.listProducts({
      search,
      category,
      originCountry,
      isFeatured: isFeatured === 'true' ? true : undefined,
      language,
      sort,
    });
  }

  @Public()
  @Get('products/:id')
  async getProduct(
    @Param('id') id: string,
    @Query('language') language?: string,
    @Headers('x-device-id') deviceId?: string,
  ) {
    return this.productsService.getProductById(id, language, deviceId);
  }

  @RequiresMember()
  @Post('products')
  async createProduct(
    @CurrentMember() member: MemberContext,
    @Body() body: any,
  ) {
    return this.productsService.createProduct(member.organizationId, body);
  }

  @RequiresMember()
  @RequirePermissions('products.edit')
  @Patch('products/:id')
  async updateProduct(
    @CurrentMember() member: MemberContext,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.productsService.updateProduct(member.organizationId, id, body);
  }

  @RequiresMember()
  @RequirePermissions('products.publish')
  @Patch('products/:id/publish')
  async setProductVisibility(
    @CurrentMember() member: MemberContext,
    @Param('id') id: string,
    @Body() body: { visibility: ProductVisibility },
  ) {
    return this.productsService.setVisibility(
      member.organizationId,
      id,
      body?.visibility ?? ProductVisibility.PUBLIC,
    );
  }

  @RequiresMember()
  @RequirePermissions('products.delete')
  @Delete('products/:id')
  async deleteProduct(
    @CurrentMember() member: MemberContext,
    @Param('id') id: string,
  ) {
    return this.productsService.deleteProduct(member.organizationId, id);
  }

  @RequiresMember()
  @RequirePermissions('products.view')
  @Get('organizations/me/products')
  async listOrgProducts(@CurrentMember() member: MemberContext) {
    return this.productsService.listOrgProducts(member.organizationId);
  }

  // --- RFQ ---

  @Public()
  @Get('rfqs')
  async listRfqs(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('status') status?: RfqStatus,
  ) {
    return this.rfqService.listRfqs({ category, search, status });
  }

  @Public()
  @Get('rfqs/:id')
  async getRfq(@Param('id') id: string) {
    return this.rfqService.getRfqById(id);
  }

  @RequiresMember()
  @RequirePermissions('rfq.create')
  @Post('rfqs')
  async createRfq(
    @CurrentMember() member: MemberContext,
    @Body() body: any,
  ) {
    return this.rfqService.createRfq(member.organizationId, body);
  }

  @RequiresMember()
  @RequirePermissions('rfq.respond')
  @Post('rfqs/:id/quotations')
  async createQuotation(
    @CurrentMember() member: MemberContext,
    @Param('id') rfqId: string,
    @Body() body: any,
  ) {
    return this.rfqService.createQuotation(member.organizationId, { ...body, rfqId });
  }

  @RequiresMember()
  @RequirePermissions('rfq.manage')
  @Post('quotations/:id/accept')
  async acceptQuotation(
    @CurrentMember() member: MemberContext,
    @Param('id') quotationId: string,
  ) {
    return this.rfqService.acceptQuotation(quotationId, member.organizationId);
  }

  // --- Orders ---

  @RequiresMember()
  @RequirePermissions('orders.view')
  @Get('orders')
  async listOrders(@CurrentMember() member: MemberContext) {
    return this.rfqService.listOrders(member.organizationId);
  }

  @RequiresMember()
  @RequirePermissions('orders.view')
  @Get('orders/:id')
  async getOrder(
    @CurrentMember() member: MemberContext,
    @Param('id') orderId: string,
  ) {
    return this.rfqService.getOrderById(orderId, member.organizationId);
  }

  // --- Chat & Messaging ---

  @RequiresMember()
  @RequirePermissions('messages.view')
  @Get('conversations')
  async listConversations(@CurrentMember() member: MemberContext) {
    return this.chatService.listConversations(member.organizationId);
  }

  @RequiresMember()
  @RequirePermissions('messages.send')
  @Post('conversations/initiate')
  async initiateConversation(
    @CurrentMember() member: MemberContext,
    @Body() body: { targetOrgId: string; title?: string },
  ) {
    return this.chatService.getOrCreateConversation(
      member.organizationId,
      body.targetOrgId,
      body.title,
    );
  }

  @RequiresMember()
  @RequirePermissions('messages.view')
  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentMember() member: MemberContext,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getMessages(conversationId, member.organizationId);
  }

  @RequiresMember()
  @RequirePermissions('messages.send')
  @Post('conversations/:id/messages')
  async sendMessage(
    @CurrentMember() member: MemberContext,
    @Param('id') conversationId: string,
    @Body() body: { text: string; language?: string; attachmentUrl?: string },
  ) {
    return this.chatService.sendMessage(conversationId, member.userId, member.organizationId, {
      text: body.text,
      language: body.language,
      attachmentUrl: body.attachmentUrl,
    });
  }

  // --- Video Discussion Appointments ---

  @RequiresMember()
  @RequirePermissions('messages.send')
  @Post('appointments')
  async createAppointment(
    @CurrentMember() member: MemberContext,
    @Body()
    body: {
      counterpartOrgId: string;
      conversationId?: string;
      title: string;
      scheduledAt: string;
      durationMins?: number;
      notes?: string;
    },
  ) {
    return this.appointmentService.create(member, body);
  }

  @RequiresMember()
  @RequirePermissions('messages.view')
  @Get('appointments')
  async listAppointments(
    @CurrentMember() member: MemberContext,
    @Query('scope') scope?: 'upcoming' | 'past' | 'all',
  ) {
    return this.appointmentService.list(member, scope);
  }

  @RequiresMember()
  @RequirePermissions('messages.view')
  @Get('appointments/:id')
  async getAppointment(
    @CurrentMember() member: MemberContext,
    @Param('id') id: string,
  ) {
    return this.appointmentService.getById(member, id);
  }

  @RequiresMember()
  @RequirePermissions('messages.send')
  @Patch('appointments/:id/status')
  async updateAppointmentStatus(
    @CurrentMember() member: MemberContext,
    @Param('id') id: string,
    @Body() body: { status: import('@prisma/client').AppointmentStatus },
  ) {
    return this.appointmentService.updateStatus(member, id, body.status);
  }
}
