import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { MemberContext } from '../common/guards/org-member.guard';
import { randomUUID } from 'crypto';

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  private canAccess(appt: { orgAId: string; orgBId: string }, orgId: string) {
    return appt.orgAId === orgId || appt.orgBId === orgId;
  }

  private async serialize(appt: any, orgId: string) {
    const otherOrgId = appt.orgAId === orgId ? appt.orgBId : appt.orgAId;
    const otherOrg = await this.prisma.organization.findUnique({
      where: { id: otherOrgId },
      select: {
        id: true,
        legalName: true,
        tradingName: true,
        country: true,
        verificationLevel: true,
      },
    });
    return {
      id: appt.id,
      conversationId: appt.conversationId,
      title: appt.title,
      scheduledAt: appt.scheduledAt,
      durationMins: appt.durationMins,
      meetingUrl: appt.meetingUrl,
      notes: appt.notes,
      status: appt.status,
      createdById: appt.createdById,
      amICreator: appt.createdById === orgId,
      otherOrg,
      counterpart: appt.orgAId === orgId ? 'B' : 'A',
      createdAt: appt.createdAt,
      updatedAt: appt.updatedAt,
    };
  }

  async create(
    member: MemberContext,
    dto: {
      counterpartOrgId: string;
      conversationId?: string;
      title: string;
      scheduledAt: string;
      durationMins?: number;
      notes?: string;
    },
  ) {
    const title = (dto.title || '').trim();
    if (!title) throw new BadRequestException('Appointment title is required');
    if (!dto.scheduledAt) throw new BadRequestException('scheduledAt is required');

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('scheduledAt is not a valid date');
    }

    if (dto.counterpartOrgId === member.organizationId) {
      throw new BadRequestException('You cannot schedule with your own organization.');
    }

    // The meeting is a real, joinable video room (Jitsi Meet).
    const meetingUrl = `https://meet.jit.si/ETHIO-${randomUUID().split('-')[0]}-${Date.now().toString(36)}`;

    const appt = await this.prisma.videoAppointment.create({
      data: {
        orgAId: member.organizationId,
        orgBId: dto.counterpartOrgId,
        createdById: member.organizationId,
        conversationId: dto.conversationId ?? null,
        title,
        scheduledAt,
        durationMins: dto.durationMins ?? 30,
        meetingUrl,
        notes: dto.notes ?? null,
        status: AppointmentStatus.PENDING,
      },
    });

    return this.serialize(appt, member.organizationId);
  }

  async list(member: MemberContext, scope?: 'upcoming' | 'past' | 'all') {
    const where: any = {
      OR: [{ orgAId: member.organizationId }, { orgBId: member.organizationId }],
    };
    if (scope === 'upcoming') {
      where.scheduledAt = { gte: new Date() };
    } else if (scope === 'past') {
      where.scheduledAt = { lt: new Date() };
    }

    const appts = await this.prisma.videoAppointment.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take: 100,
    });

    return Promise.all(appts.map((a) => this.serialize(a, member.organizationId)));
  }

  async getById(member: MemberContext, id: string) {
    const appt = await this.prisma.videoAppointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (!this.canAccess(appt, member.organizationId)) {
      throw new ForbiddenException('Access denied to appointment');
    }
    return this.serialize(appt, member.organizationId);
  }

  async updateStatus(
    member: MemberContext,
    id: string,
    status: AppointmentStatus,
  ) {
    const appt = await this.prisma.videoAppointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (!this.canAccess(appt, member.organizationId)) {
      throw new ForbiddenException('Access denied to appointment');
    }

    const mine = member.organizationId === appt.orgAId || member.organizationId === appt.orgBId;
    const isCounterpart = appt.createdById !== member.organizationId;

    if (status === AppointmentStatus.CANCELLED && appt.createdById !== member.organizationId) {
      throw new ForbiddenException('Only the organizer can cancel this appointment.');
    }
    if (
      (status === AppointmentStatus.ACCEPTED || status === AppointmentStatus.DECLINED) &&
      (!isCounterpart || appt.status !== AppointmentStatus.PENDING)
    ) {
      throw new ForbiddenException('Only the invited counterpart can accept or decline.');
    }
    if (!['PENDING', 'ACCEPTED', 'CANCELLED', 'COMPLETED'].includes(appt.status)) {
      throw new BadRequestException(`Cannot change an appointment in status ${appt.status}`);
    }
    if (!mine) {
      throw new ForbiddenException('Access denied to appointment');
    }

    await this.prisma.videoAppointment.update({ where: { id }, data: { status } });
    return this.getById(member, id);
  }
}