import { CommissionService } from '../src/monetization/commission.service';
import { WalletService } from '../src/monetization/wallet.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('Commercial Lifecycle & Revenue Engine', () => {
  describe('B2B Trade Commission Calculation (SDD §64)', () => {
    it('accurately computes 2% commission with floor and cap enforcement', async () => {
      const mockPrisma: any = {
        commissionRule: {
          findFirst: jest.fn().mockResolvedValue({
            percentage: new Decimal(2.0),
            fixedFee: new Decimal(0),
            minFee: new Decimal(50),
            maxFee: new Decimal(500000),
            currency: 'ETB',
          }),
        },
      };

      const commService = new CommissionService(mockPrisma);

      // Standard $20,000 transaction -> $400 platform fee (2%)
      const standard = await commService.calculateCommission(20000, 'USD', 'B2B_TRADE');
      expect(standard.grossAmount).toBe(20000);
      expect(standard.effectiveFee).toBe(400);
      expect(standard.netAmount).toBe(19600);

      // Micro transaction -> Floor at 50 ETB
      const micro = await commService.calculateCommission(500, 'ETB', 'B2B_TRADE');
      expect(micro.effectiveFee).toBe(50);
      expect(micro.netAmount).toBe(450);

      // Mega transaction -> Cap at 500,000 ETB
      const mega = await commService.calculateCommission(50000000, 'ETB', 'B2B_TRADE');
      expect(mega.effectiveFee).toBe(500000);
      expect(mega.netAmount).toBe(49500000);
    });
  });

  describe('Wallet Atomic Reservation Lifecycle (SDD §168)', () => {
    it('locks funds upon reservation and releases on failure', async () => {
      let balance = 1000;
      let lockedAmount = 0;

      const mockPrisma: any = {
        wallet: {
          findUnique: jest.fn().mockImplementation(() =>
            Promise.resolve({
              id: 'w-1',
              organizationId: 'org-1',
              currency: 'ETB',
              balance: new Decimal(balance),
              lockedAmount: new Decimal(lockedAmount),
            }),
          ),
          update: jest.fn().mockImplementation(({ data }) => {
            if (data.lockedAmount?.increment) {
              lockedAmount += Number(data.lockedAmount.increment);
            } else if (data.lockedAmount?.decrement) {
              lockedAmount -= Number(data.lockedAmount.decrement);
            }
            if (data.balance?.decrement) {
              balance -= Number(data.balance.decrement);
            }
            return Promise.resolve({
              id: 'w-1',
              balance: new Decimal(balance),
              lockedAmount: new Decimal(lockedAmount),
            });
          }),
        },
        walletTransaction: {
          create: jest.fn().mockResolvedValue({ id: 'tx-1', status: 'PENDING' }),
        },
      };

      const walletService = new WalletService(mockPrisma);

      // Step 1: Reserve ETB 50 for AI Service
      await walletService.reserveFunds('org-1', 50, 'AI_SERVICE', 'AI Product Gen');
      expect(lockedAmount).toBe(50);

      // Step 2: Simulate failure -> Release reservation
      await walletService.releaseReservation('org-1', 50, 'AI_SERVICE', 'Service failed refund');
      expect(lockedAmount).toBe(0);
      expect(balance).toBe(1000); // Balance untouched
    });

    it('finalizes charge upon successful AI execution', async () => {
      let balance = 1000;
      let lockedAmount = 50;

      const mockPrisma: any = {
        wallet: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'w-1',
            organizationId: 'org-1',
            currency: 'ETB',
            balance: new Decimal(balance),
            lockedAmount: new Decimal(lockedAmount),
          }),
          update: jest.fn().mockImplementation(({ data }) => {
            if (data.lockedAmount?.decrement) {
              lockedAmount -= Number(data.lockedAmount.decrement);
            }
            if (data.balance?.decrement) {
              balance -= Number(data.balance.decrement);
            }
            return Promise.resolve({
              id: 'w-1',
              balance: new Decimal(balance),
              lockedAmount: new Decimal(lockedAmount),
            });
          }),
        },
        walletTransaction: {
          create: jest.fn().mockResolvedValue({ id: 'tx-2', status: 'COMPLETED' }),
        },
      };

      const walletService = new WalletService(mockPrisma);

      // Finalize charge of ETB 50
      await walletService.finalizeCharge('org-1', 50, 'AI_SERVICE', 'AI Product Gen Success');
      expect(lockedAmount).toBe(0);
      expect(balance).toBe(950);
    });
  });
});
