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
exports.LotteryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const lottery_gateway_1 = require("./lottery.gateway");
let LotteryService = class LotteryService {
    prisma;
    lotteryGateway;
    constructor(prisma, lotteryGateway) {
        this.prisma = prisma;
        this.lotteryGateway = lotteryGateway;
    }
    async createLottery(data) {
        const car = await this.prisma.car.findUnique({ where: { id: data.carId } });
        if (!car) {
            throw new common_1.NotFoundException('Car not found');
        }
        if (!car.isAvailable) {
            throw new common_1.BadRequestException('Car is not available for lottery');
        }
        const existingLottery = await this.prisma.lottery.findFirst({
            where: {
                carId: data.carId,
                status: { in: [client_1.LotteryStatus.ACTIVE, client_1.LotteryStatus.SPINNING] },
            },
        });
        if (existingLottery) {
            throw new common_1.BadRequestException('Car already has an active lottery');
        }
        return this.prisma.lottery.create({
            data: {
                carId: data.carId,
                title: data.title,
                description: data.description,
                ticketPrice: data.ticketPrice,
                currency: data.currency || 'ETB',
                totalTickets: data.totalTickets,
                spinDueDate: data.spinDueDate,
                status: client_1.LotteryStatus.DRAFT,
            },
            include: { car: true },
        });
    }
    async getLottery(id) {
        const lottery = await this.prisma.lottery.findUnique({
            where: { id },
            include: { car: true, tickets: true, spinResult: true },
        });
        if (!lottery) {
            throw new common_1.NotFoundException('Lottery not found');
        }
        return lottery;
    }
    async listLotteries(params) {
        const where = {};
        if (params?.status) {
            where.status = params.status;
        }
        const [lotteries, total] = await Promise.all([
            this.prisma.lottery.findMany({
                where,
                skip: params?.skip || 0,
                take: params?.take || 20,
                include: {
                    car: true,
                    spinResult: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.lottery.count({ where }),
        ]);
        const lotteriesWithWinners = await Promise.all(lotteries.map(async (lottery) => {
            if (lottery.status === client_1.LotteryStatus.COMPLETED && lottery.winnerTicketId) {
                const winnerTicket = await this.prisma.ticket.findUnique({
                    where: { id: lottery.winnerTicketId },
                    select: { id: true, ticketNumber: true, userId: true },
                });
                return { ...lottery, winnerTicket };
            }
            return lottery;
        }));
        return { lotteries: lotteriesWithWinners, total };
    }
    async updateLottery(id, data) {
        const lottery = await this.prisma.lottery.findUnique({ where: { id } });
        if (!lottery) {
            throw new common_1.NotFoundException('Lottery not found');
        }
        if (lottery.status === client_1.LotteryStatus.SPINNING || lottery.status === client_1.LotteryStatus.COMPLETED) {
            throw new common_1.ForbiddenException('Cannot modify lottery that is spinning or completed');
        }
        if (data.totalTickets !== undefined && data.totalTickets < lottery.soldTickets) {
            throw new common_1.BadRequestException('Total tickets cannot be less than sold tickets');
        }
        return this.prisma.lottery.update({
            where: { id },
            data,
            include: { car: true },
        });
    }
    async deleteLottery(id) {
        const lottery = await this.prisma.lottery.findUnique({ where: { id } });
        if (!lottery) {
            throw new common_1.NotFoundException('Lottery not found');
        }
        if (lottery.status !== client_1.LotteryStatus.DRAFT) {
            throw new common_1.ForbiddenException('Can only delete draft lotteries');
        }
        return this.prisma.lottery.delete({ where: { id } });
    }
    async publishLottery(id) {
        const lottery = await this.prisma.lottery.findUnique({ where: { id } });
        if (!lottery) {
            throw new common_1.NotFoundException('Lottery not found');
        }
        if (lottery.status !== client_1.LotteryStatus.DRAFT) {
            throw new common_1.ForbiddenException('Can only publish draft lotteries');
        }
        return this.prisma.lottery.update({
            where: { id },
            data: { status: client_1.LotteryStatus.ACTIVE },
            include: { car: true },
        });
    }
    async startSpin(id) {
        const lottery = await this.prisma.lottery.findUnique({
            where: { id },
            include: { tickets: true },
        });
        if (!lottery) {
            throw new common_1.NotFoundException('Lottery not found');
        }
        if (lottery.status !== client_1.LotteryStatus.ACTIVE) {
            throw new common_1.ForbiddenException('Lottery must be active to start spin');
        }
        if (lottery.soldTickets === 0) {
            throw new common_1.BadRequestException('Cannot spin lottery with no sold tickets');
        }
        const updatedLottery = await this.prisma.lottery.update({
            where: { id },
            data: {
                status: client_1.LotteryStatus.SPINNING,
                actualSpinDate: new Date(),
            },
            include: { car: true, tickets: true },
        });
        this.lotteryGateway.notifySpinStart(lottery.id);
        return updatedLottery;
    }
    async completeSpin(id) {
        const lottery = await this.prisma.lottery.findUnique({
            where: { id },
            include: { tickets: { where: { status: client_1.TicketStatus.PAID } } },
        });
        if (!lottery) {
            throw new common_1.NotFoundException('Lottery not found');
        }
        if (lottery.status !== client_1.LotteryStatus.SPINNING) {
            throw new common_1.ForbiddenException('Lottery must be spinning to complete spin');
        }
        const paidTickets = lottery.tickets;
        if (paidTickets.length === 0) {
            throw new common_1.BadRequestException('No paid tickets available');
        }
        const winningIndex = Math.floor(Math.random() * paidTickets.length);
        const winningTicket = paidTickets[winningIndex];
        const spinStartedAt = lottery.actualSpinDate || new Date();
        const spinCompletedAt = new Date();
        const durationMs = spinCompletedAt.getTime() - spinStartedAt.getTime();
        await this.prisma.spinResult.create({
            data: {
                lotteryId: id,
                winningTicketId: winningTicket.id,
                spinStartedAt,
                spinCompletedAt,
                durationMs,
            },
        });
        await this.prisma.$transaction([
            this.prisma.ticket.update({
                where: { id: winningTicket.id },
                data: { status: client_1.TicketStatus.WINNING },
            }),
            this.prisma.ticket.updateMany({
                where: {
                    lotteryId: id,
                    status: client_1.TicketStatus.PAID,
                    id: { not: winningTicket.id },
                },
                data: { status: client_1.TicketStatus.LOSING },
            }),
        ]);
        const updatedLottery = await this.prisma.lottery.update({
            where: { id },
            data: {
                status: client_1.LotteryStatus.COMPLETED,
                winnerTicketId: winningTicket.id,
            },
            include: { car: true, tickets: true, spinResult: true },
        });
        this.lotteryGateway.notifySpinComplete(lottery.id, winningTicket.id);
        return updatedLottery;
    }
    async getLotteryStats() {
        const [total, active, completed, ticketsSold] = await Promise.all([
            this.prisma.lottery.count(),
            this.prisma.lottery.count({ where: { status: client_1.LotteryStatus.ACTIVE } }),
            this.prisma.lottery.count({ where: { status: client_1.LotteryStatus.COMPLETED } }),
            this.prisma.lottery.aggregate({
                _sum: { soldTickets: true },
            }),
        ]);
        return {
            totalLotteries: total,
            activeLotteries: active,
            completedLotteries: completed,
            totalTicketsSold: ticketsSold._sum.soldTickets || 0,
        };
    }
};
exports.LotteryService = LotteryService;
exports.LotteryService = LotteryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        lottery_gateway_1.LotteryGateway])
], LotteryService);
//# sourceMappingURL=lottery.service.js.map