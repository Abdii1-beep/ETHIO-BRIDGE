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
exports.LotteryGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let LotteryGateway = class LotteryGateway {
    server;
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    notifySpinStart(lotteryId) {
        this.server.emit('spin-start', { lotteryId, timestamp: new Date() });
    }
    notifySpinComplete(lotteryId, winningTicketId) {
        this.server.emit('spin-complete', { lotteryId, winningTicketId, timestamp: new Date() });
    }
    handleJoinLottery(client, lotteryId) {
        client.join(`lottery:${lotteryId}`);
        console.log(`Client ${client.id} joined lottery ${lotteryId}`);
    }
    handleLeaveLottery(client, lotteryId) {
        client.leave(`lottery:${lotteryId}`);
        console.log(`Client ${client.id} left lottery ${lotteryId}`);
    }
};
exports.LotteryGateway = LotteryGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LotteryGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-lottery'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], LotteryGateway.prototype, "handleJoinLottery", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-lottery'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], LotteryGateway.prototype, "handleLeaveLottery", null);
exports.LotteryGateway = LotteryGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    })
], LotteryGateway);
//# sourceMappingURL=lottery.gateway.js.map