-- CreateEnum
CREATE TYPE "ProductVisibility" AS ENUM ('DRAFT', 'PRIVATE', 'BUSINESS_ONLY', 'PUBLIC', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'NEGOTIATING');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'RESERVE', 'RELEASE', 'REFUND');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('ETHSWITCH', 'NBE_LICENSED_PARTNER', 'TELEBIRR', 'CHAPA', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CrmStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lockedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "limits" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSubscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL DEFAULT 'B2B_TRADE',
    "percentage" DECIMAL(5,2) NOT NULL,
    "fixedFee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "minFee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "maxFee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCommission" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "organizationId" TEXT NOT NULL,
    "grossAmount" DECIMAL(18,2) NOT NULL,
    "feeAmount" DECIMAL(18,2) NOT NULL,
    "netAmount" DECIMAL(18,2) NOT NULL,
    "partnerFee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "featureCode" TEXT NOT NULL,
    "unitCount" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "totalCost" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "compareAtPrice" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "moq" INTEGER NOT NULL DEFAULT 1,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "originCountry" TEXT NOT NULL DEFAULT 'CN',
    "visibility" "ProductVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "specs" JSONB,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "contactWechat" TEXT,
    "contactWhatsapp" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductView" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "firstViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "specs" JSONB,
    "isOriginal" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rfq" (
    "id" TEXT NOT NULL,
    "buyerOrgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetCategory" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "targetBudget" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "destination" TEXT NOT NULL DEFAULT 'Ethiopia',
    "deliveryDate" TIMESTAMP(3),
    "status" "RfqStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "sellerOrgId" TEXT NOT NULL,
    "productId" TEXT,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "shippingCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "moq" INTEGER NOT NULL DEFAULT 1,
    "deliveryDays" INTEGER NOT NULL DEFAULT 15,
    "paymentTerms" TEXT,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyerOrgId" TEXT NOT NULL,
    "sellerOrgId" TEXT NOT NULL,
    "rfqId" TEXT,
    "quotationId" TEXT,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "commissionAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'NBE_LICENSED_PARTNER',
    "providerRef" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'INITIATED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "orgAId" TEXT NOT NULL,
    "orgBId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DIRECT',
    "referenceId" TEXT,
    "lastRead" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "senderOrgId" TEXT NOT NULL,
    "originalLang" TEXT NOT NULL DEFAULT 'en',
    "originalText" TEXT NOT NULL,
    "translations" JSONB,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoAppointment" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "orgAId" TEXT NOT NULL,
    "orgBId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "meetingUrl" TEXT NOT NULL,
    "notes" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessConnection" (
    "id" TEXT NOT NULL,
    "requesterOrgId" TEXT NOT NULL,
    "targetOrgId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmLead" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "stage" "CrmStage" NOT NULL DEFAULT 'NEW',
    "dealValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRequestRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputUnits" INTEGER NOT NULL DEFAULT 0,
    "outputUnits" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequestRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_organizationId_key" ON "Wallet"("organizationId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE INDEX "OrganizationSubscription_organizationId_idx" ON "OrganizationSubscription"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationSubscription_planId_idx" ON "OrganizationSubscription"("planId");

-- CreateIndex
CREATE INDEX "PlatformCommission_organizationId_idx" ON "PlatformCommission"("organizationId");

-- CreateIndex
CREATE INDEX "PlatformCommission_orderId_idx" ON "PlatformCommission"("orderId");

-- CreateIndex
CREATE INDEX "UsageRecord_organizationId_featureCode_idx" ON "UsageRecord"("organizationId", "featureCode");

-- CreateIndex
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_visibility_idx" ON "Product"("visibility");

-- CreateIndex
CREATE INDEX "ProductView_productId_firstViewedAt_idx" ON "ProductView"("productId", "firstViewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductView_productId_deviceId_key" ON "ProductView"("productId", "deviceId");

-- CreateIndex
CREATE INDEX "ProductTranslation_productId_idx" ON "ProductTranslation"("productId");

-- CreateIndex
CREATE INDEX "ProductTranslation_language_idx" ON "ProductTranslation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_language_key" ON "ProductTranslation"("productId", "language");

-- CreateIndex
CREATE INDEX "Rfq_buyerOrgId_idx" ON "Rfq"("buyerOrgId");

-- CreateIndex
CREATE INDEX "Rfq_targetCategory_idx" ON "Rfq"("targetCategory");

-- CreateIndex
CREATE INDEX "Rfq_status_idx" ON "Rfq"("status");

-- CreateIndex
CREATE INDEX "Quotation_rfqId_idx" ON "Quotation"("rfqId");

-- CreateIndex
CREATE INDEX "Quotation_sellerOrgId_idx" ON "Quotation"("sellerOrgId");

-- CreateIndex
CREATE INDEX "Quotation_productId_idx" ON "Quotation"("productId");

-- CreateIndex
CREATE INDEX "Order_buyerOrgId_idx" ON "Order"("buyerOrgId");

-- CreateIndex
CREATE INDEX "Order_sellerOrgId_idx" ON "Order"("sellerOrgId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_orderId_idx" ON "PaymentAttempt"("orderId");

-- CreateIndex
CREATE INDEX "Conversation_orgAId_idx" ON "Conversation"("orgAId");

-- CreateIndex
CREATE INDEX "Conversation_orgBId_idx" ON "Conversation"("orgBId");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoAppointment_orgAId_idx" ON "VideoAppointment"("orgAId");

-- CreateIndex
CREATE INDEX "VideoAppointment_orgBId_idx" ON "VideoAppointment"("orgBId");

-- CreateIndex
CREATE INDEX "VideoAppointment_conversationId_idx" ON "VideoAppointment"("conversationId");

-- CreateIndex
CREATE INDEX "BusinessConnection_requesterOrgId_idx" ON "BusinessConnection"("requesterOrgId");

-- CreateIndex
CREATE INDEX "BusinessConnection_targetOrgId_idx" ON "BusinessConnection"("targetOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessConnection_requesterOrgId_targetOrgId_key" ON "BusinessConnection"("requesterOrgId", "targetOrgId");

-- CreateIndex
CREATE INDEX "CrmLead_organizationId_stage_idx" ON "CrmLead"("organizationId", "stage");

-- CreateIndex
CREATE INDEX "AiRequestRecord_organizationId_service_idx" ON "AiRequestRecord"("organizationId", "service");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationSubscription" ADD CONSTRAINT "OrganizationSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformCommission" ADD CONSTRAINT "PlatformCommission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_sellerOrgId_fkey" FOREIGN KEY ("sellerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerOrgId_fkey" FOREIGN KEY ("sellerOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAppointment" ADD CONSTRAINT "VideoAppointment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequestRecord" ADD CONSTRAINT "AiRequestRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequestRecord" ADD CONSTRAINT "AiRequestRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
