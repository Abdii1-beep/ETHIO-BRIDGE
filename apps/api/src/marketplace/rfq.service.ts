import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../monetization/commission.service';
import { RfqStatus, QuotationStatus, OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RfqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commissionService: CommissionService,
  ) {}

  async listRfqs(query: { category?: string; search?: string; status?: RfqStatus }) {
    const where: any = {
      status: query.status ?? RfqStatus.PUBLISHED,
    };

    if (query.category) {
      where.targetCategory = { contains: query.category, mode: 'insensitive' };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.rfq.findMany({
      where,
      include: {
        buyerOrg: {
          select: {
            id: true,
            legalName: true,
            tradingName: true,
            country: true,
            verificationLevel: true,
          },
        },
        _count: {
          select: { quotations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getRfqById(id: string) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        buyerOrg: {
          select: {
            id: true,
            legalName: true,
            tradingName: true,
            country: true,
            verificationLevel: true,
            email: true,
            phone: true,
          },
        },
        quotations: {
          include: {
            sellerOrg: {
              select: {
                id: true,
                legalName: true,
                tradingName: true,
                country: true,
                verificationLevel: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ ${id} not found`);
    }

    return rfq;
  }

  async createRfq(
    buyerOrgId: string,
    data: {
      title: string;
      description: string;
      targetCategory: string;
      quantity: number;
      unit?: string;
      targetBudget?: number;
      currency?: string;
      destination?: string;
      deliveryDate?: Date;
    },
  ) {
    return this.prisma.rfq.create({
      data: {
        buyerOrgId,
        title: data.title,
        description: data.description,
        targetCategory: data.targetCategory,
        quantity: data.quantity,
        unit: data.unit ?? 'pcs',
        targetBudget: data.targetBudget ? new Decimal(data.targetBudget) : null,
        currency: data.currency ?? 'USD',
        destination: data.destination ?? 'Ethiopia',
        deliveryDate: data.deliveryDate,
        status: RfqStatus.PUBLISHED,
      },
    });
  }

  async createQuotation(
    sellerOrgId: string,
    data: {
      rfqId: string;
      productId?: string;
      unitPrice: number;
      quantity: number;
      shippingCost?: number;
      currency?: string;
      moq?: number;
      deliveryDays?: number;
      paymentTerms?: string;
      validityDays?: number;
      notes?: string;
    },
  ) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: data.rfqId },
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ ${data.rfqId} not found`);
    }

    // When a seller attaches a product, it must be one of theirs.
    if (data.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: data.productId },
      });
      if (!product || product.organizationId !== sellerOrgId) {
        throw new ForbiddenException('You can only quote your own products.');
      }
    }

    const shipping = data.shippingCost ?? 0;
    const totalPrice = data.unitPrice * data.quantity + shipping;

    return this.prisma.quotation.create({
      data: {
        rfqId: data.rfqId,
        sellerOrgId,
        productId: data.productId,
        unitPrice: new Decimal(data.unitPrice),
        quantity: data.quantity,
        totalPrice: new Decimal(totalPrice),
        shippingCost: new Decimal(shipping),
        currency: data.currency ?? rfq.currency,
        moq: data.moq ?? 1,
        deliveryDays: data.deliveryDays ?? 15,
        paymentTerms: data.paymentTerms,
        validityDays: data.validityDays ?? 30,
        notes: data.notes,
        status: QuotationStatus.PENDING,
      },
    });
  }

  async acceptQuotation(quotationId: string, buyerOrgId: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { rfq: true },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation ${quotationId} not found`);
    }

    if (quotation.rfq.buyerOrgId !== buyerOrgId) {
      throw new ForbiddenException('Only the buyer organization can accept this quotation');
    }

    // Mark quotation as accepted
    await this.prisma.quotation.update({
      where: { id: quotationId },
      data: { status: QuotationStatus.ACCEPTED },
    });

    // Close RFQ
    await this.prisma.rfq.update({
      where: { id: quotation.rfqId },
      data: { status: RfqStatus.CLOSED },
    });

    // Calculate commission
    const totalAmount = Number(quotation.totalPrice);
    const comm = await this.commissionService.calculateCommission(
      totalAmount,
      quotation.currency,
      'B2B_TRADE',
    );

    // Create Order
    const order = await this.prisma.order.create({
      data: {
        buyerOrgId,
        sellerOrgId: quotation.sellerOrgId,
        rfqId: quotation.rfqId,
        quotationId,
        totalAmount: new Decimal(totalAmount),
        commissionAmount: new Decimal(comm.effectiveFee),
        currency: quotation.currency,
        status: OrderStatus.PENDING,
      },
    });

    // Record platform commission ledger
    await this.commissionService.recordCommission({
      orderId: order.id,
      organizationId: quotation.sellerOrgId,
      grossAmount: totalAmount,
      feeAmount: comm.effectiveFee,
      netAmount: comm.netAmount,
      currency: quotation.currency,
    });

    return {
      order,
      commission: comm,
    };
  }

  async listOrders(organizationId: string) {
    return this.prisma.order.findMany({
      where: {
        OR: [{ buyerOrgId: organizationId }, { sellerOrgId: organizationId }],
      },
      include: {
        buyerOrg: {
          select: { id: true, legalName: true, tradingName: true, country: true },
        },
        sellerOrg: {
          select: { id: true, legalName: true, tradingName: true, country: true },
        },
        rfq: { select: { title: true, targetCategory: true } },
        quotation: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, organizationId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyerOrg: true,
        sellerOrg: true,
        rfq: true,
        quotation: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.buyerOrgId !== organizationId && order.sellerOrgId !== organizationId) {
      throw new ForbiddenException('Access denied to this order');
    }

    return order;
  }
}
