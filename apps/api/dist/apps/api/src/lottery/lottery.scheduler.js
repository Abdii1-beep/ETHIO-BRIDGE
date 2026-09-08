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
exports.LotteryScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const lottery_service_1 = require("./lottery.service");
const client_1 = require("@prisma/client");
let LotteryScheduler = class LotteryScheduler {
    prisma;
    lotteryService;
    constructor(prisma, lotteryService) {
        this.prisma = prisma;
        this.lotteryService = lotteryService;
    }
    async checkDueLotteries() {
        try {
            const now = new Date();
            const dueLotteries = await this.prisma.lottery.findMany({
                where: {
                    status: client_1.LotteryStatus.ACTIVE,
                    spinDueDate: {
                        lte: now,
                    },
                },
            });
            for (const lottery of dueLotteries) {
                console.log(`Auto-starting spin for lottery: ${lottery.id}`);
                try {
                    await this.lotteryService.startSpin(lottery.id);
                    setTimeout(async () => {
                        try {
                            await this.lotteryService.completeSpin(lottery.id);
                            console.log(`Auto-completed spin for lottery: ${lottery.id}`);
                        }
                        catch (error) {
                            console.error(`Failed to auto-complete spin for lottery ${lottery.id}:`, error);
                        }
                    }, 5000);
                }
                catch (error) {
                    console.error(`Failed to auto-start spin for lottery ${lottery.id}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Error checking due lotteries:', error);
        }
    }
};
exports.LotteryScheduler = LotteryScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LotteryScheduler.prototype, "checkDueLotteries", null);
exports.LotteryScheduler = LotteryScheduler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        lottery_service_1.LotteryService])
], LotteryScheduler);
//# sourceMappingURL=lottery.scheduler.js.map