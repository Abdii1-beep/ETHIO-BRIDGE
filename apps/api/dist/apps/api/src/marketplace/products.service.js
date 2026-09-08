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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
function discountPercent(price, compareAt) {
    if (!compareAt)
        return 0;
    const p = Number(price);
    const c = Number(compareAt);
    if (c <= 0 || p <= 0 || p >= c)
        return 0;
    return Math.round(((c - p) / c) * 100);
}
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async soldCounts() {
        const grouped = await this.prisma.quotation.groupBy({
            by: ['productId'],
            where: { productId: { not: null }, status: client_1.QuotationStatus.ACCEPTED },
            _sum: { quantity: true },
        });
        return new Map(grouped.map((g) => [g.productId, g._sum.quantity ?? 0]));
    }
    async listProducts(query) {
        const lang = query.language ?? 'en';
        const where = {
            visibility: client_1.ProductVisibility.PUBLIC,
        };
        if (query.category) {
            where.category = { contains: query.category, mode: 'insensitive' };
        }
        if (query.originCountry) {
            where.originCountry = query.originCountry;
        }
        if (query.isFeatured !== undefined) {
            where.isFeatured = query.isFeatured;
        }
        if (query.search) {
            where.OR = [
                { category: { contains: query.search, mode: 'insensitive' } },
                {
                    translations: {
                        some: {
                            OR: [
                                { title: { contains: query.search, mode: 'insensitive' } },
                                { description: { contains: query.search, mode: 'insensitive' } },
                            ],
                        },
                    },
                },
            ];
        }
        const sort = query.sort ?? 'newest';
        let orderBy = [{ createdAt: 'desc' }];
        if (sort === 'featured') {
            orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
        }
        else if (sort === 'top-viewed') {
            orderBy = [{ viewCount: 'desc' }, { createdAt: 'desc' }];
        }
        else if (sort === 'top-sold') {
            orderBy = [{ createdAt: 'desc' }];
        }
        const products = await this.prisma.product.findMany({
            where,
            include: {
                organization: {
                    select: {
                        id: true,
                        legalName: true,
                        tradingName: true,
                        country: true,
                        verificationLevel: true,
                    },
                },
                translations: true,
            },
            orderBy,
            take: 50,
        });
        const sold = await this.soldCounts();
        let result = products.map((p) => {
            const targetTranslation = p.translations.find((t) => t.language === lang) ||
                p.translations.find((t) => t.isOriginal) ||
                p.translations[0];
            return {
                id: p.id,
                organizationId: p.organizationId,
                organization: p.organization,
                category: p.category,
                price: Number(p.price),
                compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
                discountPct: discountPercent(p.price, p.compareAtPrice),
                currency: p.currency,
                moq: p.moq,
                stockQuantity: p.stockQuantity,
                unit: p.unit,
                originCountry: p.originCountry,
                isFeatured: p.isFeatured,
                visibility: p.visibility,
                images: p.images,
                videoUrl: p.videoUrl,
                specs: p.specs,
                viewCount: p.viewCount,
                soldCount: sold.get(p.id) ?? 0,
                title: targetTranslation?.title ?? 'Product',
                description: targetTranslation?.description ?? '',
                translationLanguage: targetTranslation?.language ?? 'en',
                allTranslations: p.translations,
                createdAt: p.createdAt,
            };
        });
        if (sort === 'top-sold') {
            result = [...result].sort((a, b) => b.soldCount - a.soldCount || b.createdAt.getTime() - a.createdAt.getTime());
        }
        return result;
    }
    async getProductById(id, language = 'en', deviceId) {
        const p = await this.prisma.product.findUnique({
            where: { id },
            include: {
                organization: {
                    select: {
                        id: true,
                        legalName: true,
                        tradingName: true,
                        country: true,
                        verificationLevel: true,
                        phone: true,
                        email: true,
                    },
                },
                translations: true,
            },
        });
        if (!p) {
            throw new common_1.NotFoundException(`Product ${id} not found`);
        }
        let viewRegistered = false;
        if (deviceId) {
            const existed = await this.prisma.productView.findUnique({
                where: {
                    productId_deviceId: { productId: id, deviceId },
                },
                select: { id: true },
            });
            if (!existed) {
                await this.prisma.productView.create({
                    data: { productId: id, deviceId },
                });
                viewRegistered = true;
            }
        }
        const nextViewCount = p.viewCount + (viewRegistered ? 1 : 0);
        if (viewRegistered) {
            await this.prisma.product.update({
                where: { id: p.id },
                data: { viewCount: { increment: 1 } },
            });
        }
        const sold = await this.soldCounts();
        const targetTranslation = p.translations.find((t) => t.language === language) ||
            p.translations.find((t) => t.isOriginal) ||
            p.translations[0];
        return {
            id: p.id,
            organizationId: p.organizationId,
            organization: p.organization,
            category: p.category,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            discountPct: discountPercent(p.price, p.compareAtPrice),
            currency: p.currency,
            moq: p.moq,
            stockQuantity: p.stockQuantity,
            unit: p.unit,
            originCountry: p.originCountry,
            visibility: p.visibility,
            isFeatured: p.isFeatured,
            images: p.images,
            videoUrl: p.videoUrl,
            specs: p.specs,
            viewCount: nextViewCount,
            soldCount: sold.get(p.id) ?? 0,
            title: targetTranslation?.title ?? 'Product',
            description: targetTranslation?.description ?? '',
            translationLanguage: targetTranslation?.language ?? 'en',
            allTranslations: p.translations,
            createdAt: p.createdAt,
        };
    }
    async createProduct(organizationId, data) {
        if (!data.title?.trim() || !data.description?.trim()) {
            throw new common_1.BadRequestException('Title and description are required');
        }
        try {
            const product = await this.prisma.product.create({
                data: {
                    organizationId,
                    category: data.category,
                    price: new library_1.Decimal(data.price ?? 0),
                    compareAtPrice: data.compareAtPrice != null ? new library_1.Decimal(data.compareAtPrice) : null,
                    currency: data.currency ?? 'USD',
                    moq: data.moq ?? 1,
                    stockQuantity: data.stockQuantity ?? 0,
                    unit: data.unit ?? 'pcs',
                    originCountry: data.originCountry ?? 'CN',
                    images: data.images ?? [],
                    videoUrl: data.videoUrl,
                    specs: data.specs ?? {},
                    visibility: client_1.ProductVisibility.PUBLIC,
                    contactWechat: data.contactInfo?.wechat || null,
                    contactWhatsapp: data.contactInfo?.whatsapp || null,
                    contactPhone: data.contactInfo?.phone || null,
                    contactEmail: data.contactInfo?.email || null,
                },
            });
            await this.prisma.productTranslation.create({
                data: {
                    productId: product.id,
                    language: data.originalLanguage || 'en',
                    title: data.title,
                    description: data.description,
                    isOriginal: true,
                    status: 'PUBLISHED',
                },
            });
            if (data.translations && data.translations.length > 0) {
                for (const t of data.translations) {
                    if (t.language !== (data.originalLanguage || 'en')) {
                        await this.prisma.productTranslation.create({
                            data: {
                                productId: product.id,
                                language: t.language,
                                title: t.title,
                                description: t.description,
                                isOriginal: false,
                                status: 'PUBLISHED',
                            },
                        });
                    }
                }
            }
            return this.getProductById(product.id, data.originalLanguage || 'en');
        }
        catch (error) {
            console.error('Error creating product:', error);
            throw new common_1.BadRequestException('Failed to create product: ' + error.message);
        }
    }
    async updateProduct(organizationId, id, data) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { translations: { where: { isOriginal: true }, take: 1 } },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product ${id} not found`);
        }
        if (product.organizationId !== organizationId) {
            throw new common_1.ForbiddenException('You cannot modify another organization\'s product.');
        }
        const updated = await this.prisma.product.update({
            where: { id },
            data: {
                ...(data.category !== undefined ? { category: data.category } : {}),
                ...(data.price !== undefined ? { price: new library_1.Decimal(data.price) } : {}),
                ...(data.compareAtPrice !== undefined
                    ? { compareAtPrice: data.compareAtPrice != null ? new library_1.Decimal(data.compareAtPrice) : null }
                    : {}),
                ...(data.currency !== undefined ? { currency: data.currency } : {}),
                ...(data.moq !== undefined ? { moq: data.moq } : {}),
                ...(data.stockQuantity !== undefined ? { stockQuantity: data.stockQuantity } : {}),
                ...(data.unit !== undefined ? { unit: data.unit } : {}),
                ...(data.originCountry !== undefined ? { originCountry: data.originCountry } : {}),
                ...(data.images !== undefined ? { images: data.images } : {}),
                ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
                ...(data.specs !== undefined ? { specs: data.specs } : {}),
                ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
            },
        });
        if (data.translations && data.translations.length > 0) {
            for (const t of data.translations) {
                if (!t.title?.trim())
                    continue;
                await this.prisma.productTranslation.upsert({
                    where: { productId_language: { productId: id, language: t.language } },
                    create: {
                        productId: id,
                        language: t.language,
                        title: t.title,
                        description: t.description ?? '',
                        isOriginal: product.translations.length === 0,
                        status: 'PUBLISHED',
                    },
                    update: {
                        title: t.title,
                        description: t.description ?? '',
                        status: 'PUBLISHED',
                    },
                });
            }
        }
        return this.getProductById(id);
    }
    async setVisibility(organizationId, id, visibility) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw new common_1.NotFoundException(`Product ${id} not found`);
        }
        if (product.organizationId !== organizationId) {
            throw new common_1.ForbiddenException('You cannot modify another organization\'s product.');
        }
        return this.prisma.product.update({
            where: { id },
            data: { visibility },
        });
    }
    async deleteProduct(organizationId, id) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw new common_1.NotFoundException(`Product ${id} not found`);
        }
        if (product.organizationId !== organizationId) {
            throw new common_1.ForbiddenException('You cannot delete another organization\'s product.');
        }
        await this.prisma.product.delete({ where: { id } });
        return { success: true, id };
    }
    async listOrgProducts(organizationId) {
        return this.prisma.product.findMany({
            where: { organizationId },
            include: { translations: true },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map