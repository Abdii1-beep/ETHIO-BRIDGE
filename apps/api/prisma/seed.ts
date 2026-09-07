import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { FEATURES, PERMISSIONS } from '../../../packages/shared/src';
import { provisionOrganization } from '../src/organizations/provision';
import { coreFeatureCodes } from '../src/organizations/provision';

const prisma = new PrismaClient();

const PLATFORM_ADMIN_EMAIL = 'admin@ethio.bridge';
const PLATFORM_ADMIN_PASSWORD = 'EhioAdmin!2026';
const DEMO_EMAIL = 'demo@ethio.bridge';
const DEMO_PASSWORD = 'DemoUser!2026';

export async function seedCatalog(client: PrismaClient): Promise<void> {
  for (const p of PERMISSIONS) {
    await client.permission.upsert({
      where: { code: p.code },
      create: {
        code: p.code,
        nameKey: p.nameKey,
        descriptionKey: p.descriptionKey,
        category: p.category,
        isActive: p.isActive ?? true,
      },
      update: {
        nameKey: p.nameKey,
        descriptionKey: p.descriptionKey,
        category: p.category,
        isActive: p.isActive ?? true,
      },
    });
  }

  for (const f of FEATURES) {
    await client.feature.upsert({
      where: { code: f.code },
      create: {
        code: f.code,
        nameKey: f.nameKey,
        descriptionKey: f.descriptionKey,
        category: f.category,
        billingType: f.billingType,
        implementationStatus: f.implementationStatus,
        isOperational: f.isOperational,
        defaultUsageLimit: f.defaultUsageLimit,
        sortOrder: f.sortOrder,
        isActive: true,
      },
      update: {
        nameKey: f.nameKey,
        descriptionKey: f.descriptionKey,
        category: f.category,
        billingType: f.billingType,
        implementationStatus: f.implementationStatus,
        isOperational: f.isOperational,
        defaultUsageLimit: f.defaultUsageLimit,
        sortOrder: f.sortOrder,
      },
    });
  }

  // Seed default Subscription Plans (SDD §60)
  const plans = [
    {
      code: 'FREE',
      name: 'Free Tier',
      description: 'Company profile, basic listings, limited messaging & search',
      price: 0,
      currency: 'ETB',
      billingCycle: 'MONTHLY',
      features: ['COMPANY_PROFILE', 'USERS', 'BRANCHES', 'DEPARTMENTS', 'NOTIFICATIONS', 'FOUR_LANGUAGE_UI', 'BUSINESS_HUB'],
      sortOrder: 1,
    },
    {
      code: 'BUSINESS',
      name: 'Business Tier',
      description: 'More products, CRM, Advanced translation, RFQ, Analytics',
      price: 999,
      currency: 'ETB',
      billingCycle: 'MONTHLY',
      features: ['COMPANY_PROFILE', 'USERS', 'BRANCHES', 'DEPARTMENTS', 'NOTIFICATIONS', 'FOUR_LANGUAGE_UI', 'BUSINESS_HUB', 'PRODUCTS', 'RFQ', 'QUOTATION', 'MESSAGING', 'BUSINESS_CONNECTIONS', 'CRM', 'AI_TRANSLATION', 'BILLING'],
      sortOrder: 2,
    },
    {
      code: 'PROFESSIONAL',
      name: 'Professional Tier',
      description: 'Everything in Business plus Advanced AI, Inventory, Finance, AI Documents & Matching',
      price: 2999,
      currency: 'ETB',
      billingCycle: 'MONTHLY',
      features: ['COMPANY_PROFILE', 'USERS', 'BRANCHES', 'DEPARTMENTS', 'NOTIFICATIONS', 'FOUR_LANGUAGE_UI', 'BUSINESS_HUB', 'PRODUCTS', 'RFQ', 'QUOTATION', 'MESSAGING', 'BUSINESS_CONNECTIONS', 'CRM', 'FINANCE', 'AI_TRANSLATION', 'AI_PRODUCT', 'AI_DOCUMENT', 'AI_MATCHING', 'AI_MARKET_INTELLIGENCE', 'BILLING'],
      sortOrder: 3,
    },
    {
      code: 'ENTERPRISE',
      name: 'Enterprise Custom',
      description: 'Multiple branches, Custom AI models, Dedicated support, Advanced audit & custom integrations',
      price: 15000,
      currency: 'ETB',
      billingCycle: 'MONTHLY',
      features: ['COMPANY_PROFILE', 'USERS', 'BRANCHES', 'DEPARTMENTS', 'NOTIFICATIONS', 'FOUR_LANGUAGE_UI', 'BUSINESS_HUB', 'PRODUCTS', 'RFQ', 'QUOTATION', 'MESSAGING', 'BUSINESS_CONNECTIONS', 'CRM', 'FINANCE', 'AI_TRANSLATION', 'AI_PRODUCT', 'AI_DOCUMENT', 'AI_MATCHING', 'AI_MARKET_INTELLIGENCE', 'AI_AUDIT', 'BILLING'],
      sortOrder: 4,
    },
  ];

  for (const plan of plans) {
    await client.subscriptionPlan.upsert({
      where: { code: plan.code },
      create: {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        features: plan.features,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
      update: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        features: plan.features,
      },
    });
  }

  // Seed default 2% B2B commission rule (SDD §64)
  const existingRule = await client.commissionRule.findFirst({
    where: { transactionType: 'B2B_TRADE', isActive: true },
  });
  if (!existingRule) {
    await client.commissionRule.create({
      data: {
        transactionType: 'B2B_TRADE',
        percentage: 2.0,
        fixedFee: 0,
        minFee: 50,
        maxFee: 500000,
        currency: 'ETB',
        isActive: true,
      },
    });
  }
}

export async function seedPlatformAdmin(client: PrismaClient): Promise<void> {
  const existing = await client.user.findUnique({ where: { email: PLATFORM_ADMIN_EMAIL } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(PLATFORM_ADMIN_PASSWORD, 10);
    await client.user.create({
      data: {
        email: PLATFORM_ADMIN_EMAIL,
        name: 'Platform Super Admin',
        passwordHash,
        platformRole: 'PLATFORM_SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true,
        preferredLanguage: 'en',
      },
    });
  } else {
    await client.user.update({
      where: { email: PLATFORM_ADMIN_EMAIL },
      data: { platformRole: 'PLATFORM_SUPER_ADMIN' },
    });
  }
}

export async function seedDemoOrganization(client: PrismaClient): Promise<void> {
  const existing = await client.organization.findFirst({
    where: { legalName: 'ETHIO Demo Trading PLC' },
  });

  let orgId: string;

  if (existing) {
    orgId = existing.id;
  } else {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const owner = await client.user.upsert({
      where: { email: DEMO_EMAIL },
      create: {
        email: DEMO_EMAIL,
        name: 'Demo Owner',
        passwordHash,
        isActive: true,
        isEmailVerified: true,
        preferredLanguage: 'en',
      },
      update: {},
    });

    const { organizationId } = await provisionOrganization(client, {
      ownerUserId: owner.id,
      legalName: 'ETHIO Demo Trading PLC',
      tradingName: 'ETHIO Demo',
      businessType: 'SME',
      industry: 'Import / Export',
      yearEstablished: 2023,
      description: 'Demo organization created by the development seed. Clearly separated from production data.',
      country: 'Ethiopia',
      region: 'Addis Ababa',
      city: 'Addis Ababa',
      email: DEMO_EMAIL,
    });
    orgId = organizationId;

    await client.branch.createMany({
      data: [
        { organizationId: orgId, name: 'Addis Ababa Branch', city: 'Addis Ababa' },
        { organizationId: orgId, name: 'Shenzhen Office', city: 'Shenzhen' },
      ],
    });
    await client.department.createMany({
      data: [
        { organizationId: orgId, name: 'Management' },
        { organizationId: orgId, name: 'Sales' },
        { organizationId: orgId, name: 'Procurement' },
      ],
    });
  }

  // Seed demo wallet with ETB 50,000 for testing
  await client.wallet.upsert({
    where: { organizationId: orgId },
    create: {
      organizationId: orgId,
      currency: 'ETB',
      balance: 50000,
      lockedAmount: 0,
      status: 'ACTIVE',
    },
    update: {},
  });

  // Backfill ACTIVE entitlements for all core features (self-heals orgs provisioned
  // before runtime feature activation existed, keeping them in line with provisioning).
  const coreFeatures = await client.feature.findMany({
    where: { code: { in: coreFeatureCodes() } },
  });
  if (coreFeatures.length) {
    await client.organizationFeature.createMany({
      data: coreFeatures.map((f) => ({
        organizationId: orgId,
        featureId: f.id,
        status: 'ACTIVE',
        activationDate: new Date(),
      })),
      skipDuplicates: true,
    });
  }
  // Seed a Buyer demo organization for admin testing
  const adminUser = await client.user.findUnique({ where: { email: PLATFORM_ADMIN_EMAIL } });
  if (adminUser) {
    const existingBuyerOrg = await client.organization.findFirst({
      where: { legalName: 'Bridge Global Sourcing PLC' },
    });
    if (!existingBuyerOrg) {
      const { organizationId: buyerOrgId } = await provisionOrganization(client, {
        ownerUserId: adminUser.id,
        legalName: 'Bridge Global Sourcing PLC',
        tradingName: 'Bridge Global',
        businessType: 'IMPORTER',
        industry: 'Global Procurement & Trade',
        yearEstablished: 2024,
        description: 'Global sourcing partner for testing B2B trade, RFQs, and cross-border communications.',
        country: 'China',
        region: 'Guangdong',
        city: 'Guangzhou',
        email: PLATFORM_ADMIN_EMAIL,
      });

      const coreFeats = await client.feature.findMany({
        where: { code: { in: coreFeatureCodes() } },
      });
      if (coreFeats.length) {
        await client.organizationFeature.createMany({
          data: coreFeats.map((f) => ({
            organizationId: buyerOrgId,
            featureId: f.id,
            status: 'ACTIVE',
            activationDate: new Date(),
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  const existingProducts = await client.product.count({ where: { organizationId: orgId } });
  if (existingProducts > 0) return;

  // Seed demo products
  const product1 = await client.product.create({
    data: {
      organizationId: orgId,
      category: 'Solar Energy & Machinery',
      price: 18500,
      currency: 'USD',
      moq: 5,
      stockQuantity: 100,
      originCountry: 'CN',
      visibility: 'PUBLIC',
      isFeatured: true,
      images: ['https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800'],
      specs: { power: '10kW', voltage: '380V', efficiency: '21.5%' },
    },
  });

  await client.productTranslation.createMany({
    data: [
      {
        productId: product1.id,
        language: 'zh',
        title: '高效太阳能水泵与光伏发电系统',
        description: '适用于农业灌溉与工业供水的全自动智能太阳能水泵系统，支持深井扬程与实时流量监控。',
        isOriginal: true,
        status: 'PUBLISHED',
      },
      {
        productId: product1.id,
        language: 'en',
        title: 'High-Efficiency Solar Water Pump & PV System',
        description: 'Automated smart solar pumping system for agricultural irrigation and industrial supply with remote monitoring.',
        isOriginal: false,
        status: 'PUBLISHED',
      },
      {
        productId: product1.id,
        language: 'am',
        title: 'ከፍተኛ ብቃት ያለው የፀሐይ ኃይል የውሃ ፓምፕ እና የፎቶቮልታይክ ሲስተም',
        description: 'ለእርሻ መስኖ እና ለኢንዱስትሪ አገልግሎት የሚውል አስተማማኝ አውቶማቲክ የፀሐይ ኃይል ፓምፕ።',
        isOriginal: false,
        status: 'PUBLISHED',
      },
      {
        productId: product1.id,
        language: 'om',
        title: 'Pampii Bishaanii Humna Aduu fi Sirna PV Gahumsa Olaanaa',
        description: 'Sirna pampii bishaanii humna aduu kan qonnaa fi industiriif oolu, to\u0027annoo ammayyaa qabu.',
        isOriginal: false,
        status: 'PUBLISHED',
      },
    ],
  });
}

async function main(): Promise<void> {
  await seedCatalog(prisma);
  await seedPlatformAdmin(prisma);
  if (process.env.SEED_DEMO !== '0') {
    await seedDemoOrganization(prisma);
  }
  console.log('Seed complete.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { prisma };