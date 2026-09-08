"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LotteryModule = void 0;
const common_1 = require("@nestjs/common");
const lottery_controller_1 = require("./lottery.controller");
const lottery_service_1 = require("./lottery.service");
const car_controller_1 = require("./car.controller");
const car_service_1 = require("./car.service");
const ticket_controller_1 = require("./ticket.controller");
const ticket_service_1 = require("./ticket.service");
const prisma_module_1 = require("../prisma/prisma.module");
const lottery_gateway_1 = require("./lottery.gateway");
const lottery_scheduler_1 = require("./lottery.scheduler");
const schedule_1 = require("@nestjs/schedule");
let LotteryModule = class LotteryModule {
};
exports.LotteryModule = LotteryModule;
exports.LotteryModule = LotteryModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, schedule_1.ScheduleModule.forRoot()],
        controllers: [lottery_controller_1.LotteryController, car_controller_1.CarController, ticket_controller_1.TicketController],
        providers: [lottery_service_1.LotteryService, car_service_1.CarService, ticket_service_1.TicketService, lottery_gateway_1.LotteryGateway, lottery_scheduler_1.LotteryScheduler],
        exports: [lottery_service_1.LotteryService, car_service_1.CarService, ticket_service_1.TicketService],
    })
], LotteryModule);
//# sourceMappingURL=lottery.module.js.map