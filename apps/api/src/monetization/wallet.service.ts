import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(organizationId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { organizationId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          organizationId,
          currency: 'ETB',
          balance: new Decimal(0),
          lockedAmount: new Decimal(0),
          status: 'ACTIVE',
        },
      });
    }

    return wallet;
  }

  async deposit(organizationId: string, amount: number, referenceType: string, description: string, referenceId?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Deposit amount must be positive');
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
        amount: new Decimal(amount),
        currency: wallet.currency,
        referenceType,
        referenceId,
        description,
        status: 'COMPLETED',
      },
    });

    return updated;
  }

  async reserveFunds(
    organizationId: string,
    amount: number,
    referenceType: string,
    description: string,
    referenceId?: string,
  ) {
    const wallet = await this.getOrCreateWallet(organizationId);
    const available = Number(wallet.balance) - Number(wallet.lockedAmount);

    if (available < amount) {
      throw new BadRequestException(
        `Insufficient wallet balance. Required: ${amount} ${wallet.currency}, Available: ${available.toFixed(2)} ${wallet.currency}`,
      );
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
        amount: new Decimal(amount),
        currency: wallet.currency,
        referenceType,
        referenceId,
        description,
        status: 'PENDING',
      },
    });

    return tx;
  }

  async finalizeCharge(
    organizationId: string,
    amount: number,
    referenceType: string,
    description: string,
    referenceId?: string,
  ) {
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
        amount: new Decimal(amount),
        currency: wallet.currency,
        referenceType,
        referenceId,
        description,
        status: 'COMPLETED',
      },
    });

    return tx;
  }

  async releaseReservation(
    organizationId: string,
    amount: number,
    referenceType: string,
    description: string,
    referenceId?: string,
  ) {
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
        amount: new Decimal(amount),
        currency: wallet.currency,
        referenceType,
        referenceId,
        description,
        status: 'COMPLETED',
      },
    });

    return tx;
  }

  async getTransactions(organizationId: string) {
    const wallet = await this.getOrCreateWallet(organizationId);
    return this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
