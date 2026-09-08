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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let WalletService = class WalletService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateWallet(organizationId) {
        let wallet = await this.prisma.wallet.findUnique({
            where: { organizationId },
        });
        if (!wallet) {
            wallet = await this.prisma.wallet.create({
                data: {
                    organizationId,
                    currency: 'ETB',
                    balance: new library_1.Decimal(0),
                    lockedAmount: new library_1.Decimal(0),
                    status: 'ACTIVE',
                },
            });
        }
        return wallet;
    }
    async deposit(organizationId, amount, referenceType, description, referenceId) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Deposit amount must be positive');
        }
        const wallet = await this.getOrCreateWallet(organizationId);
        const updated = await this.prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                balance: { increment: amount },
            },
        });
        await this.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'CREDIT',
                amount: new library_1.Decimal(amount),
                currency: wallet.currency,
                referenceType,
                referenceId,
                description,
                status: 'COMPLETED',
            },
        });
        return updated;
    }
    async reserveFunds(organizationId, amount, referenceType, description, referenceId) {
        const wallet = await this.getOrCreateWallet(organizationId);
        const available = Number(wallet.balance) - Number(wallet.lockedAmount);
        if (available < amount) {
            throw new common_1.BadRequestException(`Insufficient wallet balance. Required: ${amount} ${wallet.currency}, Available: ${available.toFixed(2)} ${wallet.currency}`);
        }
        await this.prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                lockedAmount: { increment: amount },
            },
        });
        const tx = await this.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'RESERVE',
                amount: new library_1.Decimal(amount),
                currency: wallet.currency,
                referenceType,
                referenceId,
                description,
                status: 'PENDING',
            },
        });
        return tx;
    }
    async finalizeCharge(organizationId, amount, referenceType, description, referenceId) {
        const wallet = await this.getOrCreateWallet(organizationId);
        await this.prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                balance: { decrement: amount },
                lockedAmount: { decrement: amount },
            },
        });
        const tx = await this.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'DEBIT',
                amount: new library_1.Decimal(amount),
                currency: wallet.currency,
                referenceType,
                referenceId,
                description,
                status: 'COMPLETED',
            },
        });
        return tx;
    }
    async releaseReservation(organizationId, amount, referenceType, description, referenceId) {
        const wallet = await this.getOrCreateWallet(organizationId);
        await this.prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                lockedAmount: { decrement: amount },
            },
        });
        const tx = await this.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'RELEASE',
                amount: new library_1.Decimal(amount),
                currency: wallet.currency,
                referenceType,
                referenceId,
                description,
                status: 'COMPLETED',
            },
        });
        return tx;
    }
    async getTransactions(organizationId) {
        const wallet = await this.getOrCreateWallet(organizationId);
        return this.prisma.walletTransaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map