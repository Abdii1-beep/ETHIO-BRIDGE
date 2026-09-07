import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductVisibility, QuotationStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type ProductSort = 'newest' | 'featured' | 'top-viewed' | 'top-sold';

function discountPercent(price: Decimal | number, compareAt?: Decimal | null): number {
  if (!compareAt) return 0;
  const p = Number(price);
  const c = Number(compareAt);
  if (c <= 0 || p <= 0 || p >= c) return 0;
  return Math.round(((c - p) / c) * 100);
}

interface ListQuery {
  search?: string;
  category?: string;
  originCountry?: string;
  isFeatured?: boolean;
  language?: string;
  sort?: ProductSort;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async soldCounts(): Promise<Map<string, number>> {
    const grouped = await this.prisma.quotation.groupBy({
      by: ['productId'],
      where: { productId: { not: null }, status: QuotationStatus.ACCEPTED },
      _sum: { quantity: true },
    });
    return new Map(grouped.map((g) => [g.productId as string, g._sum.quantity ?? 0]));
  }

  async listProducts(query: ListQuery) {
    const lang = query.language ?? 'en';
    const where: any = {
      visibility: ProductVisibility.PUBLIC,
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
    let orderBy: any = [{ createdAt: 'desc' as const }];
    if (sort === 'featured') {
      orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'top-viewed') {
      orderBy = [{ viewCount: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'top-sold') {
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
      const targetTranslation =
        p.translations.find((t) => t.language === lang) ||
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

  async getProductById(id: string, language = 'en', deviceId?: string) {
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
      throw new NotFoundException(`Product ${id} not found`);
    }

    // A product view is counted ONCE PER DEVICE (X-Device-Id). The same device
    // browsing the product repeatedly (refresh, reopening the modal) never
    // inflates the counter. Requests without a device id are not counted.
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
    const targetTranslation =
      p.translations.find((t) => t.language === language) ||
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

  async createProduct(
    organizationId: string,
    data: {
      category: string;
      price: number;
      compareAtPrice?: number | null;
      currency?: string;
      moq?: number;
      stockQuantity?: number;
      unit?: string;
      originCountry?: string;
      images?: string[];
      videoUrl?: string;
      specs?: any;
      originalLanguage: string;
      title: string;
      description: string;
      translations?: Array<{
        language: string;
        title: string;
        description: string;
      }>;
      contactInfo?: {
        wechat?: string | null;
        whatsapp?: string | null;
        phone?: string | null;
        email?: string | null;
      };
    },
  ) {
    if (!data.title?.trim() || !data.description?.trim()) {
      throw new BadRequestException('Title and description are required');
    }

    try {
      const product = await this.prisma.product.create({
        data: {
          organizationId,
          category: data.category,
          price: new Decimal(data.price ?? 0),
          compareAtPrice:
            data.compareAtPrice != null ? new Decimal(data.compareAtPrice) : null,
          currency: data.currency ?? 'USD',
          moq: data.moq ?? 1,
          stockQuantity: data.stockQuantity ?? 0,
          unit: data.unit ?? 'pcs',
          originCountry: data.originCountry ?? 'CN',
          images: data.images ?? [],
          videoUrl: data.videoUrl,
          specs: data.specs ?? {},
          visibility: ProductVisibility.PUBLIC,
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
    } catch (error) {
      console.error('Error creating product:', error);
      throw new BadRequestException('Failed to create product: ' + (error as Error).message);
    }
  }

  async updateProduct(
    organizationId: string,
    id: string,
    data: {
      category?: string;
      price?: number;
      compareAtPrice?: number | null;
      currency?: string;
      moq?: number;
      stockQuantity?: number;
      unit?: string;
      originCountry?: string;
      images?: string[];
      videoUrl?: string | null;
      specs?: any;
      isFeatured?: boolean;
      translations?: Array<{
        language: string;
        title: string;
        description: string;
      }>;
    },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { translations: { where: { isOriginal: true }, take: 1 } },
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    if (product.organizationId !== organizationId) {
      throw new ForbiddenException('You cannot modify another organization\'s product.');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.price !== undefined ? { price: new Decimal(data.price) } : {}),
        ...(data.compareAtPrice !== undefined
          ? { compareAtPrice: data.compareAtPrice != null ? new Decimal(data.compareAtPrice) : null }
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
        if (!t.title?.trim()) continue;
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

  async setVisibility(organizationId: string, id: string, visibility: ProductVisibility) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    if (product.organizationId !== organizationId) {
      throw new ForbiddenException('You cannot modify another organization\'s product.');
    }
    return this.prisma.product.update({
      where: { id },
      data: { visibility },
    });
  }

  async deleteProduct(organizationId: string, id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    if (product.organizationId !== organizationId) {
      throw new ForbiddenException('You cannot delete another organization\'s product.');
    }
    await this.prisma.product.delete({ where: { id } });
    return { success: true, id };
  }

  async listOrgProducts(organizationId: string) {
    return this.prisma.product.findMany({
      where: { organizationId },
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}