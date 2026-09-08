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
exports.AppointmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
let AppointmentService = class AppointmentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    canAccess(appt, orgId) {
        return appt.orgAId === orgId || appt.orgBId === orgId;
    }
    async serialize(appt, orgId) {
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
    async create(member, dto) {
        const title = (dto.title || '').trim();
        if (!title)
            throw new common_1.BadRequestException('Appointment title is required');
        if (!dto.scheduledAt)
            throw new common_1.BadRequestException('scheduledAt is required');
        const scheduledAt = new Date(dto.scheduledAt);
        if (Number.isNaN(scheduledAt.getTime())) {
            throw new common_1.BadRequestException('scheduledAt is not a valid date');
        }
        if (dto.counterpartOrgId === member.organizationId) {
            throw new common_1.BadRequestException('You cannot schedule with your own organization.');
        }
        const meetingUrl = `https://meet.jit.si/ETHIO-${(0, crypto_1.randomUUID)().split('-')[0]}-${Date.now().toString(36)}`;
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
                status: client_1.AppointmentStatus.PENDING,
            },
        });
        return this.serialize(appt, member.organizationId);
    }
    async list(member, scope) {
        const where = {
            OR: [{ orgAId: member.organizationId }, { orgBId: member.organizationId }],
        };
        if (scope === 'upcoming') {
            where.scheduledAt = { gte: new Date() };
        }
        else if (scope === 'past') {
            where.scheduledAt = { lt: new Date() };
        }
        const appts = await this.prisma.videoAppointment.findMany({
            where,
            orderBy: { scheduledAt: 'desc' },
            take: 100,
        });
        return Promise.all(appts.map((a) => this.serialize(a, member.organizationId)));
    }
    async getById(member, id) {
        const appt = await this.prisma.videoAppointment.findUnique({ where: { id } });
        if (!appt)
            throw new common_1.NotFoundException('Appointment not found');
        if (!this.canAccess(appt, member.organizationId)) {
            throw new common_1.ForbiddenException('Access denied to appointment');
        }
        return this.serialize(appt, member.organizationId);
    }
    async updateStatus(member, id, status) {
        const appt = await this.prisma.videoAppointment.findUnique({ where: { id } });
        if (!appt)
            throw new common_1.NotFoundException('Appointment not found');
        if (!this.canAccess(appt, member.organizationId)) {
            throw new common_1.ForbiddenException('Access denied to appointment');
        }
        const mine = member.organizationId === appt.orgAId || member.organizationId === appt.orgBId;
        const isCounterpart = appt.createdById !== member.organizationId;
        if (status === client_1.AppointmentStatus.CANCELLED && appt.createdById !== member.organizationId) {
            throw new common_1.ForbiddenException('Only the organizer can cancel this appointment.');
        }
        if ((status === client_1.AppointmentStatus.ACCEPTED || status === client_1.AppointmentStatus.DECLINED) &&
            (!isCounterpart || appt.status !== client_1.AppointmentStatus.PENDING)) {
            throw new common_1.ForbiddenException('Only the invited counterpart can accept or decline.');
        }
        if (!['PENDING', 'ACCEPTED', 'CANCELLED', 'COMPLETED'].includes(appt.status)) {
            throw new common_1.BadRequestException(`Cannot change an appointment in status ${appt.status}`);
        }
        if (!mine) {
            throw new common_1.ForbiddenException('Access denied to appointment');
        }
        await this.prisma.videoAppointment.update({ where: { id }, data: { status } });
        return this.getById(member, id);
    }
};
exports.AppointmentService = AppointmentService;
exports.AppointmentService = AppointmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentService);
//# sourceMappingURL=appointment.service.js.map