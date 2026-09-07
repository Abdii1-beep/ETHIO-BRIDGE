import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrmStage } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async listLeads(organizationId: string, stage?: CrmStage) {
    const where: any = { organizationId };
    if (stage) {
      where.stage = stage;
    }

    return this.prisma.crmLead.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createLead(
    organizationId: string,
    data: {
      contactName: string;
      companyName: string;
      email?: string;
      phone?: string;
      stage?: CrmStage;
      dealValue?: number;
      currency?: string;
      notes?: string;
    },
  ) {
    return this.prisma.crmLead.create({
      data: {
        organizationId,
        contactName: data.contactName,
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        stage: data.stage ?? CrmStage.NEW,
        dealValue: data.dealValue ? new Decimal(data.dealValue) : new Decimal(0),
        currency: data.currency ?? 'ETB',
        notes: data.notes,
      },
    });
  }

  async updateLeadStage(id: string, organizationId: string, stage: CrmStage) {
    const lead = await this.prisma.crmLead.findFirst({
      where: { id, organizationId },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }

    return this.prisma.crmLead.update({
      where: { id },
      data: { stage },
    });
  }

  async getPipelineSummary(organizationId: string) {
    const leads = await this.prisma.crmLead.findMany({
      where: { organizationId },
    });

    const stages: Record<string, { count: number; totalValue: number }> = {
      NEW: { count: 0, totalValue: 0 },
      CONTACTED: { count: 0, totalValue: 0 },
      QUALIFIED: { count: 0, totalValue: 0 },
      NEGOTIATING: { count: 0, totalValue: 0 },
      WON: { count: 0, totalValue: 0 },
      LOST: { count: 0, totalValue: 0 },
    };

    for (const lead of leads) {
      const stage = lead.stage;
      if (stages[stage]) {
        stages[stage].count += 1;
        stages[stage].totalValue += Number(lead.dealValue);
      }
    }

    return {
      stages,
      totalLeads: leads.length,
    };
  }
}
