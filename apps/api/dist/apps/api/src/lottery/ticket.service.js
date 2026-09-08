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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TicketService = class TicketService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async buyTicket(data) {
        console.log('Buying ticket for lottery:', data.lotteryId, 'user:', data.userId);
        const lottery = await this.prisma.lottery.findUnique({
            where: { id: data.lotteryId },
        });
        console.log('Lottery found:', lottery);
        if (!lottery) {
            throw new common_1.NotFoundException('Lottery not found');
        }
        if (lottery.status !== client_1.LotteryStatus.ACTIVE) {
            throw new common_1.ForbiddenException('Lottery is not active');
        }
        if (lottery.soldTickets >= lottery.totalTickets) {
            throw new common_1.BadRequestException('All tickets have been sold');
        }
        const existingTicket = await this.prisma.ticket.findFirst({
            where: {
                lotteryId: data.lotteryId,
                userId: data.userId,
            },
        });
        if (existingTicket) {
            throw new common_1.BadRequestException('User already has a ticket for this lottery');
        }
        const existingTickets = await this.prisma.ticket.findMany({
            where: { lotteryId: data.lotteryId },
            select: { ticketNumber: true },
        });
        const usedNumbers = new Set(existingTickets.map((t) => t.ticketNumber));
        let nextTicketNumber = 1;
        while (usedNumbers.has(nextTicketNumber)) {
            nextTicketNumber++;
        }
        const ticket = await this.prisma.ticket.create({
            data: {
                lotteryId: data.lotteryId,
                userId: data.userId,
                ticketNumber: nextTicketNumber,
                status: client_1.TicketStatus.PENDING,
            },
        });
        console.log('Ticket created with PENDING status:', ticket);
        return ticket;
    }
    async getTicket(id) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id },
            include: { lottery: { include: { car: true } }, user: true },
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Ticket not found');
        }
        return ticket;
    }
    async getUserTickets(userId, params) {
        const where = { userId };
        if (params?.lotteryId) {
            where.lotteryId = params.lotteryId;
        }
        if (params?.status) {
            where.status = params.status;
        }
        return this.prisma.ticket.findMany({
            where,
            include: { lottery: { include: { car: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getLotteryTickets(lotteryId) {
        return this.prisma.ticket.findMany({
            where: { lotteryId },
            include: { user: true },
            orderBy: { ticketNumber: 'asc' },
        });
    }
};
exports.TicketService = TicketService;
exports.TicketService = TicketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TicketService);
//# sourceMappingURL=ticket.service.js.map