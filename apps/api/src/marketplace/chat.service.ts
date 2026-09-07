import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TranslationService, TranslationResult } from '../ai/translation.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface SendMessageDto {
  text: string;
  language?: string;
  attachmentUrl?: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translation: TranslationService,
  ) {}

  async getOrCreateConversation(orgAId: string, orgBId: string, referenceId?: string) {
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

  async listConversations(orgId: string) {
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

    const results = await Promise.all(
      convs.map(async (c) => {
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

        const lastRead = (c.lastRead as Record<string, string> | null) ?? {};
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
      }),
    );

    return results;
  }

  private async senderInfo(userId: string, orgId: string) {
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

  async getMessages(conversationId: string, orgId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    if (conv.orgAId !== orgId && conv.orgBId !== orgId) {
      throw new ForbiddenException('Access denied to conversation');
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    // As soon as the current participant reads, record it for unread badges.
    const lastRead = (conv.lastRead as Record<string, string> | null) ?? {};
    lastRead[orgId] = new Date().toISOString();
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastRead },
    });

    const withSenders = await Promise.all(
      messages.map(async (m) => ({
        id: m.id,
        sender: await this.senderInfo(m.senderUserId, m.senderOrgId),
        originalLang: m.originalLang,
        originalText: m.originalText,
        translations: (m.translations as Record<string, string> | null) ?? {},
        attachmentUrl: m.attachmentUrl ?? null,
        createdAt: m.createdAt,
      })),
    );

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

  async sendMessage(
    conversationId: string,
    senderUserId: string,
    senderOrgId: string,
    dto: SendMessageDto,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    if (conv.orgAId !== senderOrgId && conv.orgBId !== senderOrgId) {
      throw new ForbiddenException('Access denied to conversation');
    }

    const text = (dto.text || '').trim();
    if (!text && !dto.attachmentUrl) {
      throw new NotFoundException('Message text or attachment is required');
    }

    const counterpartOrgId = conv.orgAId === senderOrgId ? conv.orgBId : conv.orgAId;
    const counterpartOrg = await this.prisma.organization.findUnique({
      where: { id: counterpartOrgId },
      select: { preferredLanguage: true },
    });

    const sourceLang = (dto.language || 'en').toLowerCase();
    const targetLang = counterpartOrg?.preferredLanguage || 'en';

    // Auto-translate into the counterpart's language (best effort — never blocks sending).
    const translations: Record<string, string> = {};
    let translationResult: TranslationResult | null = null;
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

    // Audit the AI translation genuinely performed (no charge — messaging always works).
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
            cost: new Decimal(0),
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
}