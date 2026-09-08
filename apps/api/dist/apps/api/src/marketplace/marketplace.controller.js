"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products.service");
const rfq_service_1 = require("./rfq.service");
const chat_service_1 = require("./chat.service");
const appointment_service_1 = require("./appointment.service");
const org_member_guard_1 = require("../common/guards/org-member.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const client_1 = require("@prisma/client");
let MarketplaceController = class MarketplaceController {
    productsService;
    rfqService;
    chatService;
    appointmentService;
    constructor(productsService, rfqService, chatService, appointmentService) {
        this.productsService = productsService;
        this.rfqService = rfqService;
        this.chatService = chatService;
        this.appointmentService = appointmentService;
    }
    async listProducts(search, category, originCountry, isFeatured, language, sort) {
        return this.productsService.listProducts({
            search,
            category,
            originCountry,
            isFeatured: isFeatured === 'true' ? true : undefined,
            language,
            sort,
        });
    }
    async getProduct(id, language, deviceId) {
        return this.productsService.getProductById(id, language, deviceId);
    }
    async createProduct(member, body) {
        return this.productsService.createProduct(member.organizationId, body);
    }
    async updateProduct(member, id, body) {
        return this.productsService.updateProduct(member.organizationId, id, body);
    }
    async setProductVisibility(member, id, body) {
        return this.productsService.setVisibility(member.organizationId, id, body?.visibility ?? client_1.ProductVisibility.PUBLIC);
    }
    async deleteProduct(member, id) {
        return this.productsService.deleteProduct(member.organizationId, id);
    }
    async listOrgProducts(member) {
        return this.productsService.listOrgProducts(member.organizationId);
    }
    async listRfqs(category, search, status) {
        return this.rfqService.listRfqs({ category, search, status });
    }
    async getRfq(id) {
        return this.rfqService.getRfqById(id);
    }
    async createRfq(member, body) {
        return this.rfqService.createRfq(member.organizationId, body);
    }
    async createQuotation(member, rfqId, body) {
        return this.rfqService.createQuotation(member.organizationId, { ...body, rfqId });
    }
    async acceptQuotation(member, quotationId) {
        return this.rfqService.acceptQuotation(quotationId, member.organizationId);
    }
    async listOrders(member) {
        return this.rfqService.listOrders(member.organizationId);
    }
    async getOrder(member, orderId) {
        return this.rfqService.getOrderById(orderId, member.organizationId);
    }
    async listConversations(member) {
        return this.chatService.listConversations(member.organizationId);
    }
    async initiateConversation(member, body) {
        return this.chatService.getOrCreateConversation(member.organizationId, body.targetOrgId, body.title);
    }
    async getMessages(member, conversationId) {
        return this.chatService.getMessages(conversationId, member.organizationId);
    }
    async sendMessage(member, conversationId, body) {
        return this.chatService.sendMessage(conversationId, member.userId, member.organizationId, {
            text: body.text,
            language: body.language,
            attachmentUrl: body.attachmentUrl,
        });
    }
    async createAppointment(member, body) {
        return this.appointmentService.create(member, body);
    }
    async listAppointments(member, scope) {
        return this.appointmentService.list(member, scope);
    }
    async getAppointment(member, id) {
        return this.appointmentService.getById(member, id);
    }
    async updateAppointmentStatus(member, id, body) {
        return this.appointmentService.updateStatus(member, id, body.status);
    }
};
exports.MarketplaceController = MarketplaceController;
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('originCountry')),
    __param(3, (0, common_1.Query)('isFeatured')),
    __param(4, (0, common_1.Query)('language')),
    __param(5, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "listProducts", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('products/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('language')),
    __param(2, (0, common_1.Headers)('x-device-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getProduct", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, common_1.Post)('products'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "createProduct", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('products.edit'),
    (0, common_1.Patch)('products/:id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "updateProduct", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('products.publish'),
    (0, common_1.Patch)('products/:id/publish'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "setProductVisibility", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('products.delete'),
    (0, common_1.Delete)('products/:id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "deleteProduct", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('products.view'),
    (0, common_1.Get)('organizations/me/products'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "listOrgProducts", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('rfqs'),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "listRfqs", null);
__decorate([
    (0, jwt_auth_guard_1.Public)(),
    (0, common_1.Get)('rfqs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getRfq", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('rfq.create'),
    (0, common_1.Post)('rfqs'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "createRfq", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('rfq.respond'),
    (0, common_1.Post)('rfqs/:id/quotations'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "createQuotation", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('rfq.manage'),
    (0, common_1.Post)('quotations/:id/accept'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "acceptQuotation", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('orders.view'),
    (0, common_1.Get)('orders'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "listOrders", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('orders.view'),
    (0, common_1.Get)('orders/:id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getOrder", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('messages.view'),
    (0, common_1.Get)('conversations'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "listConversations", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('messages.send'),
    (0, common_1.Post)('conversations/initiate'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "initiateConversation", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('messages.view'),
    (0, common_1.Get)('conversations/:id/messages'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getMessages", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('messages.send'),
    (0, common_1.Post)('conversations/:id/messages'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "sendMessage", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('messages.send'),
    (0, common_1.Post)('appointments'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "createAppointment", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('messages.view'),
    (0, common_1.Get)('appointments'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Query)('scope')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "listAppointments", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('messages.view'),
    (0, common_1.Get)('appointments/:id'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "getAppointment", null);
__decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, permissions_guard_1.RequirePermissions)('messages.send'),
    (0, common_1.Patch)('appointments/:id/status'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MarketplaceController.prototype, "updateAppointmentStatus", null);
exports.MarketplaceController = MarketplaceController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        rfq_service_1.RfqService,
        chat_service_1.ChatService,
        appointment_service_1.AppointmentService])
], MarketplaceController);
//# sourceMappingURL=marketplace.controller.js.map