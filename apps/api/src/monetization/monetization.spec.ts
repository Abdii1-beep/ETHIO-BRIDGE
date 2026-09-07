import { CommissionService } from './commission.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('CommissionService', () => {
  let commissionService: CommissionService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      commissionRule: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'rule-1',
          transactionType: 'B2B_TRADE',
          percentage: new Decimal(2.0),
          fixedFee: new Decimal(0),
          minFee: new Decimal(50),
          maxFee: new Decimal(500000),
          currency: 'ETB',
          isActive: true,
        }),
      },
    };
    commissionService = new CommissionService(mockPrisma);
  });

  it('calculates 2% commission on a standard trade ($20,000 * 2% = $400)', async () => {
    const res = await commissionService.calculateCommission(20000, 'USD', 'B2B_TRADE');
    expect(res.grossAmount).toBe(20000);
    expect(res.feePercentage).toBe(2);
    expect(res.effectiveFee).toBe(400);
    expect(res.netAmount).toBe(19600);
  });

  it('applies minimum fee when transaction is very small', async () => {
    const res = await commissionService.calculateCommission(100, 'ETB', 'B2B_TRADE');
    // 2% of 100 is 2, but minFee is 50
    expect(res.rawFee).toBe(2);
    expect(res.effectiveFee).toBe(50);
    expect(res.netAmount).toBe(50);
  });

  it('applies maximum fee cap when transaction is huge', async () => {
    const res = await commissionService.calculateCommission(100000000, 'ETB', 'B2B_TRADE');
    // 2% of 100M is 2M, but maxFee is 500k
    expect(res.rawFee).toBe(2000000);
    expect(res.effectiveFee).toBe(500000);
    expect(res.netAmount).toBe(99500000);
  });
});
