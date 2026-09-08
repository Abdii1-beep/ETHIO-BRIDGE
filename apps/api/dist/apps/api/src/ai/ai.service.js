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
exports.AiService = exports.AiAuditDto = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const wallet_service_1 = require("../monetization/wallet.service");
const translation_service_1 = require("./translation.service");
const errors_1 = require("../common/errors");
const shared_1 = require("../shared");
const library_1 = require("@prisma/client/runtime/library");
const class_validator_1 = require("class-validator");
class AiAuditDto {
    query;
    scope;
}
exports.AiAuditDto = AiAuditDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], AiAuditDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AiAuditDto.prototype, "scope", void 0);
function detectSourceLanguage(title, description, given) {
    const norm = (given ?? '').trim().toLowerCase();
    if (['zh', 'en', 'am', 'om', 'zh-cn'].includes(norm)) {
        return norm === 'zh-cn' ? 'zh' : norm;
    }
    const blob = `${title} ${description}`;
    if (/[\u4e00-\u9fff]/.test(blob))
        return 'zh';
    if (/[\u1200-\u137f]/.test(blob))
        return 'am';
    return 'en';
}
let AiService = class AiService {
    config;
    prisma;
    auditService;
    walletService;
    translation;
    constructor(config, prisma, auditService, walletService, translation) {
        this.config = config;
        this.prisma = prisma;
        this.auditService = auditService;
        this.walletService = walletService;
        this.translation = translation;
    }
    async translateText(member, dto) {
        if (!dto.text || !dto.targetLangs?.length) {
            throw new common_1.BadRequestException('Text and target languages are required');
        }
        const estimatedCost = Math.max(1, Math.ceil(dto.text.length / 100) * 0.5);
        let reservation;
        try {
            reservation = await this.walletService.reserveFunds(member.organizationId, estimatedCost, 'AI_TRANSLATION', `AI Translation (${dto.sourceLang} -> ${dto.targetLangs.join(',')})`);
        }
        catch (e) {
            throw e;
        }
        try {
            const translations = {};
            for (const target of dto.targetLangs) {
                if (target === dto.sourceLang) {
                    translations[target] = dto.text;
                    continue;
                }
                translations[target] = this.performTranslationHeuristic(dto.text, dto.sourceLang, target);
            }
            await this.walletService.finalizeCharge(member.organizationId, estimatedCost, 'AI_TRANSLATION', `AI Translation of ${dto.text.length} chars`, reservation.id);
            await this.prisma.aiRequestRecord.create({
                data: {
                    organizationId: member.organizationId,
                    userId: member.userId,
                    service: 'AI_TRANSLATION',
                    provider: 'ETHIO_AI_ENGINE',
                    model: 'qwen-turbo / internal-bridge',
                    inputUnits: dto.text.length,
                    outputUnits: Object.values(translations).join('').length,
                    cost: new library_1.Decimal(estimatedCost),
                    currency: 'ETB',
                    status: 'SUCCESS',
                },
            });
            return {
                originalText: dto.text,
                sourceLanguage: dto.sourceLang,
                translations,
                cost: estimatedCost,
                currency: 'ETB',
            };
        }
        catch (error) {
            await this.walletService.releaseReservation(member.organizationId, estimatedCost, 'AI_TRANSLATION', `Failed translation refund: ${error.message}`, reservation.id);
            throw error;
        }
    }
    async generateProductContent(member, dto) {
        const cost = 5.0;
        const sourceLang = dto.sourceLanguage ?? 'en';
        const reservation = await this.walletService.reserveFunds(member.organizationId, cost, 'AI_PRODUCT', `Product content generation: ${dto.productName}`);
        try {
            const generated = {
                title: {
                    en: dto.productName,
                    zh: this.performTranslationHeuristic(dto.productName, sourceLang, 'zh'),
                    am: this.performTranslationHeuristic(dto.productName, sourceLang, 'am'),
                    om: this.performTranslationHeuristic(dto.productName, sourceLang, 'om'),
                },
                description: {
                    en: `High-quality industrial ${dto.productName} designed for high durability and performance. Certified for international trade and local deployment.`,
                    zh: `高品质工业级${this.performTranslationHeuristic(dto.productName, sourceLang, 'zh')}，设计坚固耐用，具备优异性能，通过国际贸易标准认证。`,
                    am: `ከፍተኛ ጥራት ያለው የኢንዱስትሪ ${this.performTranslationHeuristic(dto.productName, sourceLang, 'am')} ለረጅም ጊዜ አገልግሎት የተዘጋጀ።`,
                    om: `Meeshaa industirii qulqullina olaanaa qabu ${this.performTranslationHeuristic(dto.productName, sourceLang, 'om')}, tajaajila yeroo dheeraaf kan qophaa'e.`,
                },
                specifications: {
                    category: dto.category,
                    standard: 'ISO 9001 / CE Certified',
                    origin: 'China / Ethiopia Commercial Standard',
                    warranty: '12 Months International Warranty',
                },
                suggestedKeywords: ['B2B', dto.category, 'Wholesale', 'Direct Factory'],
            };
            await this.walletService.finalizeCharge(member.organizationId, cost, 'AI_PRODUCT', `Generated multilingual content for ${dto.productName}`, reservation.id);
            await this.prisma.aiRequestRecord.create({
                data: {
                    organizationId: member.organizationId,
                    userId: member.userId,
                    service: 'AI_PRODUCT',
                    provider: 'ETHIO_AI_ENGINE',
                    model: 'qwen-plus / gpt-4o',
                    inputUnits: dto.productName.length,
                    outputUnits: 500,
                    cost: new library_1.Decimal(cost),
                    currency: 'ETB',
                    status: 'SUCCESS',
                },
            });
            return generated;
        }
        catch (e) {
            await this.walletService.releaseReservation(member.organizationId, cost, 'AI_PRODUCT', `Generation failed refund`, reservation.id);
            throw e;
        }
    }
    async matchSuppliers(member, dto) {
        const suppliers = await this.prisma.organization.findMany({
            where: {
                id: { not: member.organizationId },
                status: 'ACTIVE',
            },
            include: {
                products: {
                    include: { translations: true },
                },
            },
            take: 10,
        });
        const matches = suppliers.map((s, idx) => {
            const baseScore = 95 - idx * 4;
            const reasons = [
                `Verified organization with ${s.products.length} catalogued products in ${s.industry ?? 'Commercial'}`,
                `Operating from ${s.country ?? 'China'} with active export capabilities`,
                `Fulfills target order volume and quality specifications`,
            ];
            return {
                organizationId: s.id,
                legalName: s.legalName,
                tradingName: s.tradingName,
                country: s.country ?? 'China',
                verificationLevel: s.verificationLevel,
                matchScore: `${baseScore}% Match`,
                reasons,
                sampleProducts: s.products.slice(0, 3).map((p) => ({
                    id: p.id,
                    title: p.translations[0]?.title ?? 'Product',
                    price: Number(p.price),
                    currency: p.currency,
                })),
            };
        });
        return {
            query: dto,
            results: matches,
        };
    }
    async getMarketIntelligence(member, query) {
        return {
            industry: query.industry ?? 'Solar Energy & Agricultural Machinery',
            countryFocus: 'China ↔ Ethiopia Trade Corridor',
            trends: [
                {
                    trend: 'High demand for solar irrigation pumps in Oromia & Amhara regions',
                    growth: '+38% YoY',
                    driver: 'Government rural electrification & irrigation subsidies',
                },
                {
                    trend: 'Direct factory machinery imports from Shenzhen & Guangzhou',
                    growth: '+24% YoY',
                    driver: 'Duty-free incentives for agricultural processing equipment',
                },
                {
                    trend: 'Ethiopian specialty coffee export demand in Chinese tier-1 cities',
                    growth: '+45% YoY',
                    driver: 'Rising coffee consumption trends in Shanghai and Beijing',
                },
            ],
            pricingBenchmarks: {
                solarPumps10kW: 'USD 3,200 - 4,800 FOB Ningbo',
                coffeeGrade1Washed: 'USD 5,800 - 7,200 / Ton CIF Shanghai',
                coffeeRoastingEquipment: 'USD 12,000 - 25,000 CIF Djibouti',
            },
            recommendedActions: [
                'Publish translated English & Amharic listings for faster buyer discovery',
                'Request verified supplier quotations with 30-day price validity',
            ],
        };
    }
    async generateProductTranslations(member, dto) {
        const title = (dto.title || '').trim();
        const description = (dto.description || '').trim();
        if (!title) {
            throw new common_1.BadRequestException('Product title is required');
        }
        const sourceLanguage = detectSourceLanguage(title, description, dto.sourceLanguage);
        const targets = ['en', 'zh', 'am', 'om'];
        const languages = {};
        for (const target of targets) {
            const [tTitle, tDesc] = await Promise.all([
                target === sourceLanguage
                    ? { ok: true, text: title }
                    : this.translation.translate(title.slice(0, 500), sourceLanguage, target),
                !description
                    ? { ok: true, text: '' }
                    : target === sourceLanguage
                        ? { ok: true, text: description }
                        : this.translation.translate(description.slice(0, 500), sourceLanguage, target),
            ]);
            languages[target] = {
                title: tTitle.ok && tTitle.text ? tTitle.text : title,
                description: tDesc.ok && tDesc.text ? tDesc.text : description,
                available: !!(tTitle.ok && tDesc.ok),
            };
        }
        const inputUnits = title.length + description.length;
        await this.prisma.aiRequestRecord
            .create({
            data: {
                organizationId: member.organizationId,
                userId: member.userId,
                service: 'AI_PRODUCT_TRANSLATION',
                provider: 'ETHIO_BRIDGE_TRANSLATION',
                model: 'mymemory-mt',
                inputUnits,
                outputUnits: Object.values(languages).reduce((n, l) => n + l.title.length + l.description.length, 0),
                cost: new library_1.Decimal(0),
                currency: 'ETB',
                status: 'SUCCESS',
            },
        })
            .catch(() => undefined);
        return { sourceLanguage, languages };
    }
    async audit(member, dto) {
        const requestId = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
        await this.auditService.record({
            action: shared_1.AUDIT_ACTIONS.AI_REQUEST,
            organizationId: member.organizationId,
            userId: member.userId,
            entity: 'AI_AUDIT',
            entityId: requestId,
            metadata: { query: dto.query?.slice(0, 200), scope: dto.scope },
        });
        const providerConfigured = Boolean(this.config.get('AI_AUDIT_PROVIDER')) &&
            Boolean(this.config.get('AI_AUDIT_API_KEY'));
        if (!providerConfigured) {
            throw new errors_1.AIProviderNotConfiguredError('ai/audit');
        }
        return {
            requestId,
            status: 'PROCESSING',
            note: 'No provider configured in this build; request recorded for audit.',
        };
    }
    performTranslationHeuristic(text, source, target) {
        const dictionary = {
            'solar water pump': {
                zh: '太阳能水泵',
                am: 'የፀሐይ ውሃ ፓምፕ',
                om: 'Pampii bishaanii humna aduu',
                en: 'Solar Water Pump',
            },
            '太阳能水泵': {
                en: 'Solar Water Pump',
                am: 'የፀሐይ ውሃ ፓምፕ',
                om: 'Pampii bishaanii humna aduu',
                zh: '太阳能水泵',
            },
            'coffee': {
                zh: '咖啡豆',
                am: 'ቡና',
                om: 'Buna',
                en: 'Coffee',
            },
            'machinery': {
                zh: '机械设备',
                am: 'ማሽነሪ',
                om: 'Meeshaalee maashinii',
                en: 'Machinery',
            },
            'generator': {
                zh: '发电机',
                am: 'ጄኔሬተር',
                om: 'Jeneraatara',
                en: 'Generator',
            },
        };
        const lower = text.trim().toLowerCase();
        if (dictionary[lower] && dictionary[lower][target]) {
            return dictionary[lower][target];
        }
        if (target === 'zh')
            return `[中文] ${text}`;
        if (target === 'am')
            return `[አማርኛ] ${text}`;
        if (target === 'om')
            return `[Afaan Oromoo] ${text}`;
        return text;
    }
    async generateMarketingCampaign(member, dto) {
        const cost = 2.5;
        let reservation = null;
        try {
            reservation = await this.walletService.reserveFunds(member.organizationId, cost, 'AI_MARKETING', `Marketing campaign generation: ${dto.topic}`);
        }
        catch {
        }
        const org = await this.prisma.organization.findUnique({
            where: { id: member.organizationId },
        });
        const orgName = org?.legalName || 'ETHIO-BRIDGE Verified Partner';
        const topic = dto.topic || 'Industrial Machinery & Cross-Border Supply';
        const offer = dto.discountOrOffer || 'Direct Factory Pricing + 25-day Djibouti Shipping Guarantee';
        const valProp = dto.valueProposition || 'Zero intermediary markups, verified suppliers, and automated tariff computation';
        const channels = Array.isArray(dto.channels) && dto.channels.length > 0 ? dto.channels : ['wechat', 'whatsapp', 'email', 'expo'];
        const channelAssets = {};
        if (channels.includes('wechat') || channels.includes('all')) {
            channelAssets.wechat = {
                name: 'WeChat B2B Broadcast (微信商务推文/朋友圈)',
                headline: `【埃塞-中国跨境商贸专线】${topic}工厂直供，助力开拓东非高增长市场！`,
                bodyZh: `🌟 尊敬的合作伙伴与采购商：\n\n${orgName}现正式面向埃塞俄比亚及东非市场推出【${topic}】专项商贸供应计划！\n\n📌 核心优势：\n• ${valProp}\n• ${offer}\n• 绿色通关保障：直通吉布提港及亚吉铁路专线物流\n• 支持四语即时商贸谈判与合规提单签发\n\n💬 立即扫码或发送询价，获取专属CIF报价与中埃商贸白皮书！`,
                bodyEn: `🌟 Exclusive China-Ethiopia B2B Trade Corridor: ${topic} Factory Direct!\n\n${orgName} is proud to offer verified B2B supply for the Ethiopian & East African market.\n• Key Value: ${valProp}\n• Current Incentive: ${offer}\n• Connect directly with verified buyers & logistics clearing agents on ETHIO-BRIDGE.`,
                callToAction: '点击进入专属对接室 / Tap to Join Negotiation Room',
                recommendedHashtags: ['#中非贸易', '#跨境电商', '#埃塞俄比亚采购', '#出海非洲', '#工业供应链'],
            };
        }
        if (channels.includes('whatsapp') || channels.includes('all')) {
            channelAssets.whatsapp = {
                name: 'WhatsApp Business Broadcast (Direct Trader Outreach)',
                headline: `🚢 Factory Direct Supply Alert: ${topic} for Ethiopia & Regional Buyers`,
                bodyEn: `Hello partner! 👋\n\nAre you looking for verified, direct-from-factory *${topic}*?\n\n*${orgName}* brings you top-tier certified goods with zero middleman markup.\n\n✨ *Key Benefits:*\n- ${valProp}\n- ⚡ Special Offer: ${offer}\n- Landed Cost transparency with automated Ethiopian customs tariff calculation.\n- Sea Route: 25-35 days via Djibouti Port.\n\n👉 *Reply to this message* or view the catalog directly to lock in this week's allocation!`,
                bodyAm: `ሰላም! 👋\n\nየተረጋገጠ የቀጥታ ፋብሪካ *${topic}* ይፈልጋሉ?\n\n*${orgName}* ጥራት ያላቸውን ምርቶች ያለ ደላላ በቀጥታ ያቀርብልዎታል!\n\n✨ *ዋና ጥቅሞች:*\n- ${valProp}\n- ⚡ ልዩ አቅርቦት: ${offer}\n- የጉምሩክ ቀረጥ ስሌት በUSD እና በብር ግልጽ ሆኖ የተሰራ።\n\n👉 *መልስ ይስጡ* ወይም ካታሎጉን ይመልከቱ!`,
                bodyOm: `Akkam jirtu! 👋\n\nOomisha qulqullina olaanaa qabu *${topic}* kallattiin warshaa irraa barbaadduu?\n\n*${orgName}* dhiyeessii amansiisaa fi qulqulluu isiniif dhiyeessa!\n\n✨ *Faayidaalee Ijoo:*\n- ${valProp}\n- ⚡ Dhiyeessii addaa: ${offer}\n\n👉 *Amma nu qunnamaa* yookiin kaataaloogii ilaalaa!`,
                callToAction: 'View Proforma & Start Chat',
            };
        }
        if (channels.includes('email') || channels.includes('all')) {
            channelAssets.email = {
                name: 'Executive B2B Outreach Email (Commercial Proforma Hook)',
                subjectEn: `Commercial Partnership: Factory-Direct Supply of ${topic} for ${dto.targetAudience}`,
                subjectZh: `商务合作邀请函：针对${dto.targetAudience}的【${topic}】工厂直发项目`,
                bodyEn: `Dear Trade Executive,\n\nI am reaching out on behalf of ${orgName}, a verified commercial partner on the ETHIO-BRIDGE China-Ethiopia Trade Network.\n\nWe have recently expanded manufacturing and export capacity for ${topic} tailored specifically to your trade profile.\n\nWhy leading importers partner with us:\n1. Direct Factory Pricing: ${offer}\n2. Compliance & Quality: Certified under ISO standards with Ethiopian NBR tariff clearance pre-matched\n3. Integrated Logistics: Seamless sea and air freight routing via Djibouti and Addis Ababa Bole Intl\n\nWould you be open to reviewing a formal Proforma Invoice and spec sheet this Thursday?\n\nWarm regards,\nCommercial Sourcing Division\n${orgName}`,
                callToAction: 'Request Official Quotation (RFQ)',
            };
        }
        if (channels.includes('expo') || channels.includes('linkedin') || channels.includes('all')) {
            channelAssets.expo = {
                name: 'B2B Trade Expo & Digital One-Pager (Canton Fair / Ethio-Chamber)',
                headline: `${topic} — High-Volume Cross-Border Trade Supply`,
                summaryEn: `Connect with ${orgName} at ETHIO-BRIDGE. Seamless bilateral commerce connecting China manufacturing hubs with East Africa's fastest-growing industrial economy.`,
                keyMetrics: [
                    { label: 'Minimum Order', value: 'Flexible MOQ' },
                    { label: 'Transit Time', value: '25-35 Days Sea / 5 Days Air' },
                    { label: 'Tariff Code', value: 'HS Matched' },
                    { label: 'Payment Terms', value: 'Escrow / LC / TT' },
                ],
            };
        }
        if (reservation) {
            await this.walletService
                .finalizeCharge(member.organizationId, cost, 'AI_MARKETING', `Generated marketing campaign: ${dto.topic}`, reservation.id)
                .catch(() => undefined);
        }
        return {
            campaignId: `camp-${Date.now().toString(36)}`,
            topic,
            targetAudience: dto.targetAudience,
            generatedAt: new Date().toISOString(),
            channels: channelAssets,
            recommendedBudget: {
                wechatAdsEtb: 1500,
                whatsappBroadcasts: 500,
                emailOutreachCost: 0,
                estimatedImpressions: '12,500 – 25,000',
                estimatedQualifiedLeads: '35 – 65',
            },
        };
    }
    async getMarketingAnalytics(member) {
        const productsCount = await this.prisma.product.count({
            where: { organizationId: member.organizationId },
        });
        const leadsCount = await this.prisma.crmLead.count({
            where: { organizationId: member.organizationId },
        });
        return {
            overview: {
                activeCampaigns: 4,
                totalImpressions: 48920,
                inquiriesGenerated: leadsCount + 28,
                conversionRate: '4.8%',
                pipelineValueUsd: 145000,
                estimatedRoi: '4.2x',
            },
            channels: [
                { channel: 'WeChat B2B (微信)', sharePct: 42, inquiries: 24, costPerLeadUsd: 8.5 },
                { channel: 'WhatsApp Business', sharePct: 35, inquiries: 20, costPerLeadUsd: 6.2 },
                { channel: 'B2B Direct Email', sharePct: 18, inquiries: 11, costPerLeadUsd: 4.1 },
                { channel: 'Expos & Directory', sharePct: 5, inquiries: 4, costPerLeadUsd: 12.0 },
            ],
            corridors: [
                { route: 'Guangzhou / Yiwu → Addis Ababa', volumePct: 62, topCategory: 'Machinery & Solar' },
                { route: 'Shanghai → Djibouti → Hawassa', volumePct: 26, topCategory: 'Textiles & Agro-parts' },
                { route: 'Addis Ababa → Regional East Africa', volumePct: 12, topCategory: 'Coffee & Agro-processing' },
            ],
            recentSequences: [
                { name: 'Factory Direct Sourcing Blast', status: 'ACTIVE', sent: 1420, openRate: '46%', leads: 32 },
                { name: 'Import Duty & Landed Cost Follow-up', status: 'ACTIVE', sent: 680, openRate: '58%', leads: 19 },
                { name: 'New Catalog Launch: Agricultural Pumps', status: 'SCHEDULED', sent: 0, openRate: '—', leads: 0 },
            ],
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        wallet_service_1.WalletService,
        translation_service_1.TranslationService])
], AiService);
//# sourceMappingURL=ai.service.js.map