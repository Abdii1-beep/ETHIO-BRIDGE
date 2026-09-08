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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const translation_service_1 = require("../ai/translation.service");
const library_1 = require("@prisma/client/runtime/library");
let ChatService = class ChatService {
    prisma;
    translation;
    constructor(prisma, translation) {
        this.prisma = prisma;
        this.translation = translation;
    }
    async getOrCreateConversation(orgAId, orgBId, referenceId) {
        let conv = await this.prisma.conversation.findFirst({
            where: {
                OR: [
                    { orgAId, orgBId },
                    { orgAId: orgBId, orgBId: orgAId },
                ],
            },
        });
        if (!conv) {
            conv = await this.prisma.conversation.create({
                data: {
                    orgAId,
                    orgBId,
                    type: 'DIRECT',
                    referenceId,
                },
            });
        }
        return conv;
    }
    async listConversations(orgId) {
        const convs = await this.prisma.conversation.findMany({
            where: {
                OR: [{ orgAId: orgId }, { orgBId: orgId }],
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        const results = await Promise.all(convs.map(async (c) => {
            const otherOrgId = c.orgAId === orgId ? c.orgBId : c.orgAId;
            const otherOrg = await this.prisma.organization.findUnique({
                where: { id: otherOrgId },
                select: {
                    id: true,
                    legalName: true,
                    tradingName: true,
                    country: true,
                    verificationLevel: true,
                    preferredLanguage: true,
                },
            });
            const lastRead = c.lastRead ?? {};
            const lastReadAt = lastRead[orgId];
            const unreadCount = lastReadAt
                ? await this.prisma.chatMessage.count({
                    where: {
                        conversationId: c.id,
                        senderOrgId: { not: orgId },
                        createdAt: { gt: new Date(lastReadAt) },
                    },
                })
                : await this.prisma.chatMessage.count({
                    where: {
                        conversationId: c.id,
                        senderOrgId: { not: orgId },
                    },
                });
            return {
                id: c.id,
                type: c.type,
                referenceId: c.referenceId,
                otherOrg,
                title: c.referenceId ?? otherOrg?.tradingName ?? otherOrg?.legalName ?? 'Trading partner',
                lastMessage: c.messages[0] ?? null,
                unreadCount,
                updatedAt: c.updatedAt,
            };
        }));
        return results;
    }
    async senderInfo(userId, orgId) {
        const [user, org] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
            this.prisma.organization.findUnique({
                where: { id: orgId },
                select: { id: true, legalName: true, tradingName: true, country: true, preferredLanguage: true },
            }),
        ]);
        return {
            userId: user?.id ?? userId,
            name: user?.name ?? 'Unknown user',
            orgId: org?.id ?? orgId,
            orgName: org?.tradingName ?? org?.legalName ?? 'Unknown org',
            country: org?.country ?? null,
            preferredLanguage: org?.preferredLanguage ?? 'en',
        };
    }
    async getMessages(conversationId, orgId) {
        const conv = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });
        if (!conv) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        if (conv.orgAId !== orgId && conv.orgBId !== orgId) {
            throw new common_1.ForbiddenException('Access denied to conversation');
        }
        const messages = await this.prisma.chatMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: 200,
        });
        const lastRead = conv.lastRead ?? {};
        lastRead[orgId] = new Date().toISOString();
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { lastRead },
        });
        const withSenders = await Promise.all(messages.map(async (m) => ({
            id: m.id,
            sender: await this.senderInfo(m.senderUserId, m.senderOrgId),
            originalLang: m.originalLang,
            originalText: m.originalText,
            translations: m.translations ?? {},
            attachmentUrl: m.attachmentUrl ?? null,
            createdAt: m.createdAt,
        })));
        return {
            conversation: {
                id: conv.id,
                type: conv.type,
                referenceId: conv.referenceId,
                updatedAt: conv.updatedAt,
                other: await this.prisma.organization.findUnique({
                    where: { id: conv.orgAId === orgId ? conv.orgBId : conv.orgAId },
                    select: {
                        id: true,
                        legalName: true,
                        tradingName: true,
                        country: true,
                        verificationLevel: true,
                        preferredLanguage: true,
                    },
                }),
            },
            messages: withSenders,
        };
    }
    async sendMessage(conversationId, senderUserId, senderOrgId, dto) {
        const conv = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });
        if (!conv) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        if (conv.orgAId !== senderOrgId && conv.orgBId !== senderOrgId) {
            throw new common_1.ForbiddenException('Access denied to conversation');
        }
        const text = (dto.text || '').trim();
        if (!text && !dto.attachmentUrl) {
            throw new common_1.NotFoundException('Message text or attachment is required');
        }
        const counterpartOrgId = conv.orgAId === senderOrgId ? conv.orgBId : conv.orgAId;
        const counterpartOrg = await this.prisma.organization.findUnique({
            where: { id: counterpartOrgId },
            select: { preferredLanguage: true },
        });
        const sourceLang = (dto.language || 'en').toLowerCase();
        const targetLang = counterpartOrg?.preferredLanguage || 'en';
        const translations = {};
        let translationResult = null;
        if (text && targetLang.toLowerCase() !== sourceLang.toLowerCase()) {
            translationResult = await this.translation.translate(text, sourceLang, targetLang);
            if (translationResult.ok && translationResult.text) {
                translations[targetLang] = translationResult.text;
            }
        }
        const message = await this.prisma.chatMessage.create({
            data: {
                conversationId,
                senderUserId,
                senderOrgId,
                originalLang: sourceLang,
                originalText: text,
                translations: Object.keys(translations).length ? translations : {},
                attachmentUrl: dto.attachmentUrl || null,
            },
        });
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });
        if (translationResult?.ok && text) {
            await this.prisma.aiRequestRecord
                .create({
                data: {
                    organizationId: senderOrgId,
                    userId: senderUserId,
                    service: 'AI_TRANSLATION',
                    provider: 'ETHIO_BRIDGE_TRANSLATION',
                    model: 'mymemory-mt',
                    inputUnits: text.length,
                    outputUnits: (translationResult.text ?? '').length,
                    cost: new library_1.Decimal(0),
                    currency: 'ETB',
                    status: 'SUCCESS',
                },
            })
                .catch(() => undefined);
        }
        return {
            id: message.id,
            sender: await this.senderInfo(senderUserId, senderOrgId),
            originalLang: sourceLang,
            originalText: text,
            translations,
            attachmentUrl: message.attachmentUrl,
            createdAt: message.createdAt,
        };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        translation_service_1.TranslationService])
], ChatService);
//# sourceMappingURL=chat.service.js.map