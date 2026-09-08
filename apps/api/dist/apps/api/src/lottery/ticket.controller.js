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
exports.TicketController = void 0;
const common_1 = require("@nestjs/common");
const ticket_service_1 = require("./ticket.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const jwt_auth_guard_2 = require("../common/guards/jwt-auth.guard");
const client_1 = require("@prisma/client");
let TicketController = class TicketController {
    ticketService;
    constructor(ticketService) {
        this.ticketService = ticketService;
    }
    async buyTicket(data, userId) {
        if (!userId) {
            userId = 'test-user-id';
        }
        return this.ticketService.buyTicket({ lotteryId: data.lotteryId, userId });
    }
    async getMyTickets(userId, lotteryId, status) {
        return this.ticketService.getUserTickets(userId, { lotteryId, status });
    }
    async getTicket(id) {
        return this.ticketService.getTicket(id);
    }
    async getLotteryTickets(lotteryId) {
        return this.ticketService.getLotteryTickets(lotteryId);
    }
};
exports.TicketController = TicketController;
__decorate([
    (0, common_1.Post)(),
    (0, jwt_auth_guard_2.Public)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "buyTicket", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('lotteryId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "getMyTickets", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "getTicket", null);
__decorate([
    (0, common_1.Get)('lottery/:lotteryId'),
    __param(0, (0, common_1.Param)('lotteryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TicketController.prototype, "getLotteryTickets", null);
exports.TicketController = TicketController = __decorate([
    (0, common_1.Controller)('tickets'),
    __metadata("design:paramtypes", [ticket_service_1.TicketService])
], TicketController);
//# sourceMappingURL=ticket.controller.js.map