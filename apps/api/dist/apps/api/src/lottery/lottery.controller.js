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
exports.LotteryController = void 0;
const common_1 = require("@nestjs/common");
const lottery_service_1 = require("./lottery.service");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const jwt_auth_guard_2 = require("../common/guards/jwt-auth.guard");
const client_1 = require("@prisma/client");
let LotteryController = class LotteryController {
    lotteryService;
    constructor(lotteryService) {
        this.lotteryService = lotteryService;
    }
    async createLottery(data, userId) {
        return this.lotteryService.createLottery(data);
    }
    async listLotteries(status, skip, take) {
        return this.lotteryService.listLotteries({
            status,
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
        });
    }
    async getLotteryStats() {
        return this.lotteryService.getLotteryStats();
    }
    async getLottery(id) {
        return this.lotteryService.getLottery(id);
    }
    async updateLottery(id, data) {
        return this.lotteryService.updateLottery(id, data);
    }
    async deleteLottery(id) {
        return this.lotteryService.deleteLottery(id);
    }
    async publishLottery(id) {
        return this.lotteryService.publishLottery(id);
    }
    async startSpin(id) {
        return this.lotteryService.startSpin(id);
    }
    async completeSpin(id) {
        return this.lotteryService.completeSpin(id);
    }
};
exports.LotteryController = LotteryController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_guard_1.RequirePermissions)('lottery.manage'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "createLottery", null);
__decorate([
    (0, common_1.Get)(),
    (0, jwt_auth_guard_2.Public)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('skip')),
    __param(2, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "listLotteries", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "getLotteryStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "getLottery", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_guard_1.RequirePermissions)('lottery.manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "updateLottery", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_guard_1.RequirePermissions)('lottery.manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "deleteLottery", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, permissions_guard_1.RequirePermissions)('lottery.manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "publishLottery", null);
__decorate([
    (0, common_1.Post)(':id/start-spin'),
    (0, permissions_guard_1.RequirePermissions)('lottery.manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "startSpin", null);
__decorate([
    (0, common_1.Post)(':id/complete-spin'),
    (0, permissions_guard_1.RequirePermissions)('lottery.manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "completeSpin", null);
exports.LotteryController = LotteryController = __decorate([
    (0, common_1.Controller)('lotteries'),
    __metadata("design:paramtypes", [lottery_service_1.LotteryService])
], LotteryController);
//# sourceMappingURL=lottery.controller.js.map